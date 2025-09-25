import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  agenda: {
    action: "admin_mailtemplates",
    cmd: "versammlungagenda.txt",
  },
  protocol: {
    action: "admin_mailtemplates",
    cmd: "versammlungprotokollmail.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class ConventionMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
