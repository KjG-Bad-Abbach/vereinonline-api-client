import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  header: {
    action: "admin_mailtemplates",
    cmd: "mailheader.txt",
  },
  footer: {
    action: "admin_mailtemplates",
    cmd: "mailfooter.txt",
  },
  layout: {
    action: "admin_mailtemplates",
    cmd: "maillayout.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class LayoutMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
