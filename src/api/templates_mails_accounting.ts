import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  invoice: {
    action: "admin_mailtemplates",
    cmd: "rechnungpermail.txt",
  },
  creditNote: {
    action: "admin_mailtemplates",
    cmd: "gutschriftpermail.txt",
  },
  paymentReceived: {
    action: "admin_mailtemplates",
    cmd: "bezahltpermail.txt",
  },
  donationReceipt: {
    action: "admin_mailtemplates",
    cmd: "spendenquittungpermail.txt",
  },
  firstReminder: {
    action: "admin_mailtemplates",
    cmd: "mahnungpermail.txt",
  },
  secondReminder: {
    action: "admin_mailtemplates",
    cmd: "mahnungpermail2.txt",
  },
  thirdReminder: {
    action: "admin_mailtemplates",
    cmd: "mahnungpermail3.txt",
  },
  invoiceStatus: {
    action: "admin_mailtemplates",
    cmd: "rechnungsstatus.txt",
  },
  offer: {
    action: "admin_mailtemplates",
    cmd: "angebotpermail.txt",
  },
  orderConfirmation: {
    action: "admin_mailtemplates",
    cmd: "auftragsbestaetigunggpermail.txt",
  },
  returnDebitNote: {
    action: "admin_mailtemplates",
    cmd: "ruecklastschriftpermail.txt",
  },
  sepaMandate: {
    action: "admin_mailtemplates",
    cmd: "sepamandatpermail.txt",
  },
  release: {
    action: "admin_mailtemplates",
    cmd: "rechnungsfreigabe.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class AccountingMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
