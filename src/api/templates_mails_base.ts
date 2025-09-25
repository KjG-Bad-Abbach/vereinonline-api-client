import type { ApiClient } from "./client.ts";
import { DOMParser, initParser } from "@b-fuze/deno-dom/wasm-noinit";

// Initialize the parser
await initParser();

/**
 * Represents a mail template in VereinOnline.
 */
export type MailTemplate = {
  subject: string;
  htmlBody: string;
};

export class MailTemplateClientApi {
  constructor(
    private client: ApiClient,
    private action: string,
    private cmd: string,
  ) {}

  private extractNamesFromHtml(
    html: string,
  ): { title: string; href: string }[] {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract the names from the links
    const navElements = doc?.querySelectorAll(
      `#content ul li a[href*="action=${this.action}&cmd=${this.cmd}"]`,
    );

    if (!navElements || navElements.length === 0) {
      throw new Error(
        "Failed to parse the template HTML. (No nav elements found)",
      );
    }

    if (navElements.length > 1) {
      throw new Error(
        "Failed to parse the template HTML. (Multiple nav lists found)",
      );
    }

    const navListElement = navElements[0]?.closest("ul");
    if (!navListElement) {
      throw new Error(
        "Failed to parse the template HTML. (No nav list element found)",
      );
    }

    const links = [...navListElement.querySelectorAll("li a")].map((a) => ({
      title: a.textContent?.trim() || "",
      href: a.getAttribute("href") || "",
    }));
    return links;
  }

  private extractTemplateFromHtml(html: string): MailTemplate {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract the subject from the input field
    const subjectElement = doc?.querySelector(
      '#form1 input[name="subject"]',
    );
    if (!subjectElement) {
      throw new Error(
        "Failed to parse the template HTML. (No subject element found)",
      );
    }
    const subject = subjectElement?.attributes.getNamedItem("value")?.value ||
      "";

    // Extract the body from the textarea
    const bodyElement = doc?.querySelector('#form1 textarea[name="werte"]');
    if (!bodyElement) {
      throw new Error(
        "Failed to parse the template HTML. (No body element found)",
      );
    }
    const htmlBody = bodyElement?.textContent || "";

    return {
      subject: subject,
      htmlBody: htmlBody,
    };
  }

  async getNames(): Promise<{ title: string; href: string }[]> {
    const html = await this.client.fetchHtml(
      "",
      {
        params: {
          action: this.action,
          cmd: this.cmd,
        },
      },
    );

    return this.extractNamesFromHtml(html);
  }

  async get(): Promise<MailTemplate> {
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

  async resetToDefault(): Promise<MailTemplate> {
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
      const template = this.extractTemplateFromHtml(html);
      if (template.subject || template.htmlBody) {
        return template;
      }
    } catch {
      // Ignore parsing errors here
    }
    throw new Error("Failed to reset template to default.");
  }

  async set(template: MailTemplate): Promise<void> {
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
      throw new Error("Failed to update the template.");
    }
  }
}

export class MailTemplateBaseApi<
  TEMPLATE extends string,
> {
  constructor(
    protected client: ApiClient,
    private mapping: Record<TEMPLATE, { action: string; cmd: string }>,
  ) {}

  public allTemplateNames(): TEMPLATE[] {
    return Object.keys(this.mapping) as TEMPLATE[];
  }

  public async fetchAllTemplateNames(): Promise<
    { title: string; href: string }[]
  > {
    const errors: Error[] = [];

    for (const template of this.allTemplateNames().reverse()) {
      try {
        const api = this.getTemplateClient(template);
        return await api.getNames();
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
      );
    }
    return this.cache[template]!;
  }

  public get(template: TEMPLATE): Promise<MailTemplate> {
    const api = this.getTemplateClient(template);
    return api.get();
  }

  public resetToDefault(template: TEMPLATE): Promise<MailTemplate> {
    const api = this.getTemplateClient(template);
    return api.resetToDefault();
  }

  public set(template: TEMPLATE, data: MailTemplate): Promise<void> {
    const api = this.getTemplateClient(template);
    return api.set(data);
  }

  public async getAll(): Promise<Record<TEMPLATE, MailTemplate>> {
    const templates: Partial<Record<TEMPLATE, MailTemplate>> = {};

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

    return templates as Record<TEMPLATE, MailTemplate>;
  }
}
