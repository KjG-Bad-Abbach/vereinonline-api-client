import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  mailToMembersTemplate: {
    action: "admin_mailtemplates",
    cmd: "signatur.txt",
  },
  loginDetails: {
    action: "admin_mailtemplates",
    cmd: "passwort.txt",
  },
  passwordReset: {
    action: "admin_mailtemplates",
    cmd: "passwortreset.txt",
  },
  birthday: {
    action: "admin_mailtemplates",
    cmd: "geburtstag.txt",
  },
  admission: {
    action: "admin_mailtemplates",
    cmd: "aufnahme.txt",
  },
  termination: {
    action: "admin_mailtemplates",
    cmd: "kuendigung.txt",
  },
  jubilee: {
    action: "admin_mailtemplates",
    cmd: "jubilaeum.txt",
  },
  profileChange: {
    action: "admin_mailtemplates",
    cmd: "profilaenderung.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class MemberMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
