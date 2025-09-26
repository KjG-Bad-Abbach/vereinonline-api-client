import type { ApiClient } from "./client.ts";
import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";

// Initialize the parser
await initParser();

/**
 * Represents a mail template in VereinOnline.
 */
export type MailTemplate = {
  subject?: string;
  htmlBody?: string;
};

/**
 * A mail template with its name.
 */
export type NamedMailTemplate = MailTemplate & {
  index?: number;
  name: string;
};

export class MailTemplateClientApi {
  constructor(
    private client: ApiClient,
    private action: string,
    private cmd: string,
    private options?: { hasSubject?: boolean; hasHtmlBody?: boolean },
  ) {}

  private extractNamesFromHtml(
    html: string,
  ): { name: string; href: string; isActive: boolean; index: number }[] {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract the names from the links
    const registerLineElement = doc?.querySelector(
      "#content > div > div.registerline",
    );
    if (!registerLineElement) {
      throw new Error(
        "Failed to parse the template HTML. (No registerline element found)",
      );
    }

    // Find the next sibling ul element after the registerline
    let ulElement = registerLineElement.nextElementSibling;
    while (ulElement && ulElement.tagName !== "UL") {
      ulElement = ulElement.nextElementSibling;
    }

    if (!ulElement) {
      throw new Error(
        "Failed to parse the template HTML. (No ul element found after registerline)",
      );
    }

    const navListElement = ulElement.querySelector(
      `a[href*="action=${this.action}&cmd=${this.cmd}"]`,
    )?.closest("ul");

    if (!navListElement) {
      throw new Error(
        "Failed to parse the template HTML. (No matching nav list found)",
      );
    }

    let index = 0;
    const links = [...navListElement.querySelectorAll("li a")].map((a) => ({
      name: a.textContent?.trim() || "",
      href: a.getAttribute("href") || "",
      isActive: a.closest("li")?.classList.contains("active") || false,
      index: index++,
    }));
    return links;
  }

  private extractTemplateFromHtml(html: string): NamedMailTemplate {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract the name from the active link
    const activeLink = this.extractNamesFromHtml(html).find((l) => l.isActive);
    if (!activeLink) {
      throw new Error(
        "Failed to parse the template HTML. (No active link found)",
      );
    }

    let subject: string | undefined = undefined;
    if (this.options?.hasSubject !== false) {
      // Extract the subject from the input field
      const subjectElement = doc?.querySelector(
        '#form1 input[name="subject"]',
      );
      if (!subjectElement) {
        throw new Error(
          "Failed to parse the template HTML. (No subject element found)",
        );
      }
      subject = subjectElement?.attributes.getNamedItem("value")?.value || "";
    }

    let htmlBody: string | undefined = undefined;
    if (this.options?.hasHtmlBody !== false) {
      // Extract the body from the textarea
      const bodyElement = doc?.querySelector('#form1 textarea[name="werte"]');
      if (!bodyElement) {
        throw new Error(
          "Failed to parse the template HTML. (No body element found)",
        );
      }
      htmlBody = bodyElement?.textContent || "";
    }

    return {
      index: activeLink.index,
      name: activeLink.name,
      subject: subject,
      htmlBody: htmlBody,
    };
  }

  async getNames(): Promise<{ name: string; href: string }[]> {
    const html = await this.client.fetchHtml(
      "",
      {
        params: {
          action: this.action,
          cmd: this.cmd,
        },
      },
    );

    return this.extractNamesFromHtml(html).map((n) => ({
      index: n.index,
      name: n.name,
      href: n.href,
    }));
  }

  async get(): Promise<NamedMailTemplate> {
    const html = await this.client.fetchHtml(
      "",
      {
        params: {
          action: this.action,
          cmd: this.cmd,
        },
      },
    );

    return this.extractTemplateFromHtml(html);
  }

  async resetToDefault(): Promise<NamedMailTemplate> {
    const html = await this.client.fetchHtml(
      "",
      {
        params: {
          action: this.action,
          cmd: `delete${this.cmd}`,
        },
      },
    );

    try {
      return this.extractTemplateFromHtml(html);
    } catch (error) {
      throw new Error(`Failed to reset template to default. (${error})`);
    }
  }

  async set(template: MailTemplate): Promise<NamedMailTemplate> {
    const body = {
      cmd: `save${this.cmd}`,
      action: this.action,
      dialog: "0",
      sprache: "",
      view: "",
      subject: template.subject,
      werte: template.htmlBody,
    };

    const html = await this.client.fetchHtml(
      "",
      {
        method: "POST",
        body: body,
        contentType: "multipart/form-data",
      },
    );

    const updatedTemplate = this.extractTemplateFromHtml(html);
    if (
      updatedTemplate.subject !== template.subject ||
      updatedTemplate.htmlBody !== template.htmlBody
    ) {
      throw new Error(
        "Failed to update the template. (New values do not match)",
      );
    }

    return updatedTemplate;
  }
}

export class MailTemplateBaseApi<
  TEMPLATE extends string,
> {
  constructor(
    protected client: ApiClient,
    private mapping: Record<TEMPLATE, { action: string; cmd: string }>,
    private options?: {
      hasSubject?: boolean;
      hasHtmlBody?: boolean;
      fetchAllTemplateNames?: {
        ignoreHrefs?: string[];
      };
    },
  ) {}

  public allTemplateNames(): TEMPLATE[] {
    return Object.keys(this.mapping) as TEMPLATE[];
  }

  public async fetchAllTemplateNames(): Promise<
    { name: string; href: string }[]
  > {
    const errors: Error[] = [];

    for (const template of this.allTemplateNames()) {
      try {
        const api = this.getTemplateClient(template);
        let names = await api.getNames();

        // Filter out ignored hrefs
        if (this.options?.fetchAllTemplateNames?.ignoreHrefs) {
          names = names.filter(
            (n) =>
              !this.options?.fetchAllTemplateNames?.ignoreHrefs?.includes(
                n.href,
              ),
          );
        }

        // If we found any names, return them
        return names;
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    throw new AggregateError(
      errors,
      "Failed to fetch template names from any template.",
    );
  }

  private cache: Partial<Record<TEMPLATE, MailTemplateClientApi>> = {};
  private getTemplateClient(template: TEMPLATE): MailTemplateClientApi {
    if (!this.cache[template]) {
      const info = this.mapping[template];
      this.cache[template] = new MailTemplateClientApi(
        this.client,
        info.action,
        info.cmd,
        this.options,
      );
    }
    return this.cache[template]!;
  }

  public get(template: TEMPLATE): Promise<NamedMailTemplate> {
    const api = this.getTemplateClient(template);
    return api.get();
  }

  public resetToDefault(template: TEMPLATE): Promise<NamedMailTemplate> {
    const api = this.getTemplateClient(template);
    return api.resetToDefault();
  }

  public set(
    template: TEMPLATE,
    data: MailTemplate,
  ): Promise<NamedMailTemplate> {
    const api = this.getTemplateClient(template);
    return api.set(data);
  }

  public async getAll(): Promise<Record<TEMPLATE, NamedMailTemplate>> {
    const templates: Partial<Record<TEMPLATE, NamedMailTemplate>> = {};

    // Check that the mapping is up to date
    const existingUrls = (await this.fetchAllTemplateNames()).map((t) =>
      t.href
    );
    const definedUrls = this.allTemplateNames().map((t) =>
      `?action=${this.mapping[t].action}&cmd=${this.mapping[t].cmd}`
    );
    const additional = existingUrls.filter((url) => !definedUrls.includes(url));
    const missing = definedUrls.filter((url) => !existingUrls.includes(url));
    if (additional.length > 0 || missing.length > 0) {
      const additionalMsg = additional.length > 0
        ? ` Additional: ${additional.join(", ")}.`
        : "";
      const missingMsg = missing.length > 0
        ? ` Missing: ${missing.join(", ")}.`
        : "";
      throw new Error(
        `Template mapping is out of date.${additionalMsg}${missingMsg}`,
      );
    }

    // Fetch all templates in parallel
    await Promise.all(
      this.allTemplateNames().map(async (template) => {
        templates[template] = await this.get(template);
      }),
    );

    return templates as Record<TEMPLATE, NamedMailTemplate>;
  }
}
