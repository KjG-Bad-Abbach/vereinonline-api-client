import type { ApiClient } from "./client.ts";
import { HtmlTemplatesApi } from "./templates_htmls.ts";
import { MailTemplatesApi } from "./templates_mails.ts";
import { NewsletterTemplatesApi } from "./templates_newsletters.ts";
import { PdfTemplatesApi } from "./templates_pdfs.ts";

/**
 * TemplatesApi class for interacting with the templates of VereinOnline.
 * This class provides methods to fetch and update templates.
 */
export class TemplatesApi {
  constructor(private client: ApiClient) {}

  private mailsApi?: MailTemplatesApi;
  get mails(): MailTemplatesApi {
    return this.mailsApi ??= new MailTemplatesApi(this.client);
  }

  private pdfsApi?: PdfTemplatesApi;
  get pdfs(): PdfTemplatesApi {
    return this.pdfsApi ??= new PdfTemplatesApi(this.client);
  }

  private htmlsApi?: HtmlTemplatesApi;
  get htmls(): HtmlTemplatesApi {
    return this.htmlsApi ??= new HtmlTemplatesApi(this.client);
  }

  private newslettersApi?: NewsletterTemplatesApi;
  get newsletters(): NewsletterTemplatesApi {
    return this.newslettersApi ??= new NewsletterTemplatesApi(this.client);
  }
}
