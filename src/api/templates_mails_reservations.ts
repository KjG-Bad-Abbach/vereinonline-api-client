import type { ApiClient } from "./client.ts";
import { MailTemplateBaseApi } from "./templates_mails_base.ts";

const mapping = {
  bookingConfirmation: {
    action: "admin_mailtemplates",
    cmd: "platzbuchung.txt",
  },
  manualBookingConfirmation: {
    action: "admin_mailtemplates",
    cmd: "platzbuchungmanuell.txt",
  },
  cancellation: {
    action: "admin_mailtemplates",
    cmd: "platzbuchungstorno.txt",
  },
  release: {
    action: "admin_mailtemplates",
    cmd: "platzbuchungfreigabe.txt",
  },
  notification: {
    action: "admin_mailtemplates",
    cmd: "platzbuchungnotify.txt",
  },
  reminder: {
    action: "admin_mailtemplates",
    cmd: "platzbuchungerinnerung.txt",
  },
} as const;

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class ReservationMailTemplatesApi
  extends MailTemplateBaseApi<keyof typeof mapping> {
  constructor(client: ApiClient) {
    super(client, mapping);
  }
}
