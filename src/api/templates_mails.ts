import type { ApiClient } from "./client.ts";
import { AccountingMailTemplatesApi } from "./templates_mails_accounting.ts";
import { BlogMailTemplatesApi } from "./templates_mails_blog.ts";
import { ConventionMailTemplatesApi } from "./templates_mails_conventions.ts";
import { DoubleOptInMailTemplatesApi } from "./templates_mails_doubleOptIn.ts";
import { EventMailTemplatesApi } from "./templates_mails_events.ts";
import { FileMailTemplatesApi } from "./templates_mails_files.ts";
import { ForumMailTemplatesApi } from "./templates_mails_forum.ts";
import { LayoutMailTemplatesApi } from "./templates_mails_layout.ts";
import { MemberMailTemplatesApi } from "./templates_mails_members.ts";
import { ReservationMailTemplatesApi } from "./templates_mails_reservations.ts";
import { ShopMailTemplatesApi } from "./templates_mails_shop.ts";
import { TaskMailTemplatesApi } from "./templates_mails_tasks.ts";
import { VoteMailTemplatesApi } from "./templates_mails_votes.ts";

/**
 * MailTemplatesApi class for interacting with the mail templates of VereinOnline.
 * This class provides methods to fetch and update mail templates.
 */
export class MailTemplatesApi {
  constructor(private client: ApiClient) {}

  private membersApi?: MemberMailTemplatesApi;
  get members(): MemberMailTemplatesApi {
    return this.membersApi ??= new MemberMailTemplatesApi(this.client);
  }

  private eventsApi?: EventMailTemplatesApi;
  get events(): EventMailTemplatesApi {
    return this.eventsApi ??= new EventMailTemplatesApi(this.client);
  }

  private votesApi?: VoteMailTemplatesApi;
  get votes(): VoteMailTemplatesApi {
    return this.votesApi ??= new VoteMailTemplatesApi(this.client);
  }

  private conventionsApi?: ConventionMailTemplatesApi;
  get conventions(): ConventionMailTemplatesApi {
    return this.conventionsApi ??= new ConventionMailTemplatesApi(this.client);
  }

  private shopApi?: ShopMailTemplatesApi;
  get shop(): ShopMailTemplatesApi {
    return this.shopApi ??= new ShopMailTemplatesApi(this.client);
  }

  private accountingApi?: AccountingMailTemplatesApi;
  get accounting(): AccountingMailTemplatesApi {
    return this.accountingApi ??= new AccountingMailTemplatesApi(this.client);
  }

  private reservationsApi?: ReservationMailTemplatesApi;
  get reservations(): ReservationMailTemplatesApi {
    return this.reservationsApi ??= new ReservationMailTemplatesApi(
      this.client,
    );
  }

  private forumApi?: ForumMailTemplatesApi;
  get forum(): ForumMailTemplatesApi {
    return this.forumApi ??= new ForumMailTemplatesApi(this.client);
  }

  private tasksApi?: TaskMailTemplatesApi;
  get tasks(): TaskMailTemplatesApi {
    return this.tasksApi ??= new TaskMailTemplatesApi(this.client);
  }

  private filesApi?: FileMailTemplatesApi;
  get files(): FileMailTemplatesApi {
    return this.filesApi ??= new FileMailTemplatesApi(this.client);
  }

  private blogApi?: BlogMailTemplatesApi;
  get blog(): BlogMailTemplatesApi {
    return this.blogApi ??= new BlogMailTemplatesApi(this.client);
  }

  private doubleOptInApi?: DoubleOptInMailTemplatesApi;
  get doubleOptIn(): DoubleOptInMailTemplatesApi {
    return this.doubleOptInApi ??= new DoubleOptInMailTemplatesApi(this.client);
  }

  private layoutApi?: LayoutMailTemplatesApi;
  get layout(): LayoutMailTemplatesApi {
    return this.layoutApi ??= new LayoutMailTemplatesApi(this.client);
  }
}
