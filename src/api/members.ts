import type { ApiClient } from "./client.ts";

type KeyedString = `key_${string}`; // custom fields are prefixed with "key_"

/**
 * Represents a member in the VereinOnline API.
 * The fields are based on the API documentation.
 */
export type Member = {
  id: string;
  name?: string | null;
  mandant?: string | null;
  mitgliedsnummer?: string | null;
  vorname?: string | null;
  nachname?: string | null;
  anrede?: string | null;
  titel?: string | null;
  firma?: string | null;
  g_co?: string | null;
  g_strasse?: string | null;
  g_land?: string | null;
  g_plz?: string | null;
  g_ort?: string | null;
  g_postfach?: string | null;
  g_land_postfach?: string | null;
  g_plz_postfach?: string | null;
  g_ort_postfach?: string | null;
  g_telefon?: string | null;
  g_fax?: string | null;
  g_mobil?: string | null;
  g_email?: string | null;
  g_homepage?: string | null;
  g_freigabe?: string | null;
  berufsstatus?: string | null;
  berufsfunktion?: string | null;
  mitarbeiter?: string | null;
  umsatz?: string | null;
  suchwoerter?: string | null;
  beschreibung?: string | null;
  p_co?: string | null;
  p_strasse?: string | null;
  p_land?: string | null;
  p_plz?: string | null;
  p_ort?: string | null;
  p_telefon?: string | null;
  p_fax?: string | null;
  p_mobil?: string | null;
  p_email?: string | null;
  p_homepage?: string | null;
  p_familienstand?: string | null;
  p_freigabe?: string | null;
  geburtstag?: string | null;
  geburtsname?: string | null;
  geburtsort?: string | null;
  staatsangehoerigkeit?: string | null;
  einzugsermaechtigung?: string | null;
  konto_inhaber?: string | null;
  konto_nr?: string | null;
  blz?: string | null;
  bank?: string | null;
  konto_iban?: string | null;
  konto_bic?: string | null;
  kontodaten?: string | null;
  bemerkung?: string | null;
  aufnahmeinteressent?: string | null;
  aufnahmegast?: string | null;
  aufnahmemitglied?: string | null;
  modified?: string | null;
  foto?: string | null;
  freigabe?: string | null;
  postgp?: string | null;
  emailgp?: string | null;
  rechnunggp?: string | null;
  userlogin?: string | null;
  userpwd?: string | null;
  geloescht?: string | null;
  geloeschtdatum?: string | null;
  lastlogin?: string | null;
  lastloginintranet?: string | null;
  loginintranetcount?: string | null;
  logincount?: string | null;
  loginerrors?: string | null;
  ichbeiwj?: string | null;
  ichbiete?: string | null;
  ichsuche?: string | null;
  freigabe_i?: string | null;
  freigabe_j?: string | null;
  branche?: string | null;
  funktion?: string | null;
  r_firma?: string | null;
  r_co?: string | null;
  r_strasse?: string | null;
  r_land?: string | null;
  r_plz?: string | null;
  r_ort?: string | null;
  r_email?: string | null;
  passwortreset?: string | null;
  ansprache?: string | null;
  attachments?: string | null;
  gekuendigt?: string | null;
  austrittsgrund?: string | null;
  leserechte?: string | null;
  hauptfreigabe?: string | null;
  signatur?: string | null;
  zustellung?: string | null;
  beitragszahler?: string | null;
  mitgliedstyp?: string | null;
  hauptmitglied?: string | null;
  sprache?: string | null;
  mandatsreferenz?: string | null;
  mandatsdatum?: string | null;
  authsecret?: string | null;
  kvp?: string | null;
  linkmandanten?: string | null;
  linkid?: string | null;
  linkexclude?: string | null;
  appuserid?: string | null;
  emailapp?: string | null;
  emailverband?: string | null;
  emailconfig?: string | null;
  webdav?: string | null;
  [key: KeyedString]: string | null | undefined; // custom fields can be added here
};

/**
 * MembersApi class for interacting with the members endpoint of the VereinOnline API.
 * This class provides methods to fetch and update members.
 */
export class MembersApi {
  private client: ApiClient;

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Fetches members by a search term.
   * @param searchTerm The term to search for.
   * @param filter Additional search parameters.
   * @param fields The fields to include in the response.
   * @returns A promise resolving to the list of members.
   */
  async get<
    FIELDS extends readonly (
      | keyof Member
      | "rollen"
      | "gruppen"
      | "beitraege"
      | "beitraegewert"
      | "beitragsdaten"
    )[],
  >(
    { searchTerm, role, group, filter, fields, sort, includeDeleted }: {
      searchTerm?: string;
      role?: string;
      group?: string;
      filter?: string; // Partial<Omit<Member, "id">>;
      fields?: FIELDS;
      sort?: (keyof Member)[];
      includeDeleted?: boolean;
    },
  ): Promise<(
    & Pick<
      Member & {
        "rollen": string;
        "gruppen": string;
        "beitraege": string;
        "beitraegewert": string;
        "beitragsdaten": string;
      },
      FIELDS[number]
    >
    & { id: string }
  )[]> {
    const body = {
      suche: searchTerm,
      rolle: role,
      gruppe: group,
      filter,
      sort: sort ? sort.join(",") : undefined,
      felder: fields ? fields.join(",") : undefined,
      geloescht: includeDeleted ? "a" : undefined,
    };
    return await this.client.fetchData("GetMembers", { method: "POST", body });
  }

  /**
   * Fetches all data of a member by their ID.
   * @param memberId The ID of the member to fetch.
   * @returns A promise resolving to the member's data.
   */
  async getById(memberId: string): Promise<
    Member & {
      rollen: string[];
      gruppen: string[];
      gruppenids: string[];
      code: string;
      maxmahnstufe: string;
    }
  > {
    const body = { id: memberId };
    return await this.client.fetchData("GetMember", {
      method: "POST",
      body,
    });
  }

  /**
   * Updates a member's information.
   * @param memberId The ID of the member to update.
   * @param updates The fields to update.
   * @returns A promise resolving to the update result.
   */
  async update(
    memberId: string,
    updates: Partial<Omit<Member, "id">>,
  ): Promise<Member> {
    const body = { id: memberId, ...updates };
    return await this.client.fetchData("UpdateMember", {
      method: "POST",
      body,
    });
  }
}
