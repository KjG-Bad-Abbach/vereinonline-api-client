import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  mailToParticipantsTemplate: {
    action: "admin_mailtemplates",
    cmd: "mailanteilnehmer.txt",
  },
  reminder: {
    action: "admin_mailtemplates",
    cmd: "reminder.txt",
  },
  registrationConfirmation: {
    action: "admin_mailtemplates",
    cmd: "anmeldung.txt",
  },
  cancellation: {
    action: "admin_mailtemplates",
    cmd: "absage.txt",
  },
  postponement: {
    action: "admin_mailtemplates",
    cmd: "verschiebung.txt",
  },
  invitation: {
    action: "admin_mailtemplates",
    cmd: "einladung.txt",
  },
  invitationSeries: {
    action: "admin_mailtemplates",
    cmd: "einladungserie.txt",
  },
  registrationNotification: {
    action: "admin_mailtemplates",
    cmd: "anmeldebenachrichtigung.txt",
  },
  gleaning: {
    action: "admin_mailtemplates",
    cmd: "mailnachlese.txt",
  },
  certificateOfAttendance: {
    action: "admin_mailtemplates",
    cmd: "teilnahmebescheinigung.txt",
  },
  voucherCode: {
    action: "admin_mailtemplates",
    cmd: "vagutscheincode.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class EventMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
