import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  notification: {
    action: "admin_mailtemplates",
    cmd: "blognotify.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class BlogMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping, {
      fetchAllTemplateNames: {
        ignoreHrefs: [
          "?action=admin_mailtemplates&cmd=forumnotify.txt",
          "?action=admin_mailtemplates&cmd=tasknotification.txt",
          "?action=admin_mailtemplates&cmd=datanotify.txt",
        ],
      },
    });
  }
}
