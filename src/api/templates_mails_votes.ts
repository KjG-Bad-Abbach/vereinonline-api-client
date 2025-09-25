import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  invitation: {
    action: "admin_mailtemplates",
    cmd: "abstimmungseinladung.txt",
  },
  notification: {
    action: "admin_mailtemplates",
    cmd: "abstimmungsbenachrichtigung.txt",
  },
  result: {
    action: "admin_mailtemplates",
    cmd: "abstimmungsergebnis.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class VoteMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
