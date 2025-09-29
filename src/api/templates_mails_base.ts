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
        { cause: { html } },
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
        { cause: { html } },
      );
    }

    const navListElement = ulElement.querySelector(
      `a[href*="action=${this.action}&cmd=${this.cmd}"]`,
    )?.closest("ul");

    if (!navListElement) {
      throw new Error(
        "Failed to parse the template HTML. (No matching nav list found)",
        { cause: { html } },
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
        { cause: { html } },
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
          { cause: { html } },
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
          { cause: { html } },
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
      throw new Error(`Failed to reset template to default. (${error})`, {
        cause: { html, originalError: error },
      });
    }
  }

  async set(
    template: MailTemplate,
    options?: { comparer?: (a: MailTemplate, b: MailTemplate) => boolean },
  ): Promise<NamedMailTemplate> {
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
        charset: "iso-8859-1",
      },
    );

    const updatedTemplate = this.extractTemplateFromHtml(html);
    const comparer = options?.comparer ??
      ((a, b) => a.subject === b.subject && a.htmlBody === b.htmlBody);
    if (!comparer(template, updatedTemplate)) {
      throw new Error(
        "Failed to update the template. (New values do not match)",
        { cause: { expected: template, actual: updatedTemplate } },
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
      allTemplateNames?: {
        ignore?: TEMPLATE[];
      };
    },
  ) {}

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

  public ignoreUpstreamUrl(url: string): void {
    if (!this.options) {
      this.options = {};
    }
    if (!this.options.fetchAllTemplateNames) {
      this.options.fetchAllTemplateNames = {};
    }
    if (!this.options.fetchAllTemplateNames.ignoreHrefs) {
      this.options.fetchAllTemplateNames.ignoreHrefs = [];
    }
    this.options.fetchAllTemplateNames.ignoreHrefs.push(url);
  }

  public ignoreKnownTemplate(template: TEMPLATE): void {
    if (!this.options) {
      this.options = {};
    }
    if (!this.options.allTemplateNames) {
      this.options.allTemplateNames = {};
    }
    if (!this.options.allTemplateNames.ignore) {
      this.options.allTemplateNames.ignore = [];
    }
    this.options.allTemplateNames.ignore.push(template);
  }

  public allTemplateNames(): TEMPLATE[] {
    return (Object.keys(this.mapping) as TEMPLATE[]).filter(
      (t) => !this.options?.allTemplateNames?.ignore?.includes(t),
    );
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

    // Fetch all template names from upstream
    // and compare with known names
    // to detect any changes
    // that require updating the mapping
    // or ignoring certain URLs
    const upstreamUrls = (await this.fetchAllTemplateNames()).map((t) =>
      t.href
    );
    const knownUrls = this.allTemplateNames().map((t) => ({
      name: t,
      href: `?action=${this.mapping[t].action}&cmd=${this.mapping[t].cmd}`,
    }));

    // Find any additional or missing URLs
    const additional = upstreamUrls.filter((url) =>
      !knownUrls.map((k) => k.href).includes(url)
    );
    const missing = knownUrls.map((k) => k.href).filter((url) =>
      !upstreamUrls.includes(url)
    );

    // Helper to enhance URL with name if known
    const tryEnhanceWithName = (url: string) => {
      const known = knownUrls.find((k) => k.href === url);
      return known ? `${url} (${known.name})` : url;
    };

    // If there are any differences, throw an error
    if (additional.length > 0 || missing.length > 0) {
      const additionalMsg = additional.length > 0
        ? ` Upstream has additional: ${
          additional.map(tryEnhanceWithName).join(", ")
        }.`
        : "";
      const missingMsg = missing.length > 0
        ? ` Upstream is missing: ${missing.map(tryEnhanceWithName).join(", ")}.`
        : "";
      throw new Error(
        `Template mapping is out of date.${additionalMsg}${missingMsg}`,
        { cause: { upstreamUrls, knownUrls } },
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
