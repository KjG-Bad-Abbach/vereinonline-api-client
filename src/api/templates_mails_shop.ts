import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  orderInfo: {
    action: "admin_mailtemplates",
    cmd: "shopkaufmail.txt",
  },
  deliveryNote: {
    action: "admin_mailtemplates",
    cmd: "lieferscheinpermail.txt",
  },
  reservationConfirmation: {
    action: "admin_mailtemplates",
    cmd: "vormerkungpermail.txt",
  },
  goodsDispatched: {
    action: "admin_mailtemplates",
    cmd: "wareverschicktpermail.txt",
  },
  deliveryNoteToStorageLocation: {
    action: "admin_mailtemplates",
    cmd: "lieferscheinlagerortmail.txt",
  },
  voucherCode: {
    action: "admin_mailtemplates",
    cmd: "shopgutscheincode.txt",
  },
  participantTickets: {
    action: "admin_mailtemplates",
    cmd: "eventtickets.txt",
  },
  donation: {
    action: "admin_mailtemplates",
    cmd: "spendepermail.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class ShopMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
