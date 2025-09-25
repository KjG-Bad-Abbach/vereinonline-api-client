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

  private extractFromHtml(html: string): MailTemplate {
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

    return this.extractFromHtml(html);
  }

  async resetToDefault(): Promise<void> {
    const html = await this.client.fetchHtml(
      "",
      {
        params: {
          action: this.action,
          cmd: `delete${this.cmd}`,
        },
      },
    );

    let failed = false;
    try {
      const template = this.extractFromHtml(html);
      if (!template.subject && !template.htmlBody) {
        failed = true;
      }
    } catch {
      failed = true;
    }
    if (failed) {
      throw new Error("Failed to reset template to default.");
    }
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

    const updatedTemplate = this.extractFromHtml(html);
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

  public resetToDefault(template: TEMPLATE): Promise<void> {
    const api = this.getTemplateClient(template);
    return api.resetToDefault();
  }

  public set(template: TEMPLATE, data: MailTemplate): Promise<void> {
    const api = this.getTemplateClient(template);
    return api.set(data);
  }

  public async getAll(): Promise<Record<TEMPLATE, MailTemplate>> {
    const templates: Partial<Record<TEMPLATE, MailTemplate>> = {};

    for (const template of this.allTemplateNames()) {
      templates[template] = await this.get(template);
    }

    return templates as Record<TEMPLATE, MailTemplate>;
  }
}
