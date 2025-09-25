import type { ApiClient } from "./client.ts";

type KeyedString = `key_${string}`; // custom fields are prefixed with "key_"

/**
 * Represents contribution data (beitragsdaten) for a member.
 */
export type ContributionData = {
  anzahl: string;
  beitragid: string;
  beitraggruppe: string;
  datumstart: string;
  beitragende: string;
  datumerstellt: string;
  gruppenid: string;
  anmerkung: string;
  kategorie: string;
};

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
  constructor(private client: ApiClient) {}

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
        "rollen": string[];
        "gruppen": string[];
        "beitraege": string[];
        "beitraegewert": string[];
        "beitragsdaten": ContributionData[];
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
    const results = await this.client.fetchData("GetMembers", {
      method: "POST",
      body,
    }) as Array<
      Member & {
        rollen?: string;
        gruppen?: string;
        beitraege?: string;
        beitraegewert?: string;
        beitragsdaten?: ContributionData[];
      }
    >;

    return results.map((result) => {
      const base = { ...result };

      // Helper function to transform comma-separated strings to unique arrays
      const transformField = (value: string | undefined) =>
        Array.from(new Set(value ? value.split(", ") : []));

      const arrayFields = {
        rollen: transformField(result.rollen),
        gruppen: transformField(result.gruppen),
        beitraege: transformField(result.beitraege),
        beitraegewert: transformField(result.beitraegewert),
      } as const;

      // Only include fields that are requested
      const transformedFields = Object.fromEntries(
        Object.entries(arrayFields).filter(([key]) =>
          fields?.includes(key as keyof typeof arrayFields)
        ),
      );

      return { ...base, ...transformedFields } as (
        & Pick<
          Member & {
            "rollen": string[];
            "gruppen": string[];
            "beitraege": string[];
            "beitraegewert": string[];
            "beitragsdaten": ContributionData[];
          },
          FIELDS[number]
        >
        & { id: string }
      );
    });
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
    const result = await this.client.fetchData("GetMember", {
      method: "POST",
      body,
    }) as Member & {
      rollen?: string;
      gruppen?: string;
      gruppenids?: string;
      code: string;
      maxmahnstufe: string;
    };

    return {
      ...result,
      rollen: result.rollen ? result.rollen.split(", ") : [],
      gruppen: result.gruppen ? result.gruppen.split(", ") : [],
      gruppenids: result.gruppenids ? result.gruppenids.split(", ") : [],
    };
  }

  /**
   * Updates a member's information.
   * @param memberId The ID of the member to update.
   * @param updates The fields to update.
   * @returns A promise resolving to the update result.
   */
  async update(
    memberId: string,
    updates: Partial<
      Omit<Member, "id"> & {
        addByName: Partial<{
          rollen: string[];
          gruppen: string[];
          beitraege: string[];
          beitragsgruppen: string[];
        }>;
        removeByName: Partial<{
          rollen: string[];
          gruppen: string[];
          beitraege: string[];
          beitragsgruppen: string[];
        }>;
        beitraganzahl: number;
        beitragstart: string;
        beitragende: string;
        einheitKuerzel: string;
      }
    >,
  ): Promise<Member> {
    // Convert add and remove operations to the required format
    if (updates.addByName || updates.removeByName) {
      updates = { ...updates };

      const fields = [
        "rollen",
        "gruppen",
        "beitraege",
        "beitragsgruppen",
      ] as const;

      for (const field of fields) {
        if (updates.addByName?.[field] || updates.removeByName?.[field]) {
          const addItems = updates.addByName?.[field] || [];
          const removeItems = (updates.removeByName?.[field] || []).map((
            item,
          ) => `-${item}`);

          // Check that when adding beitraege or beitragsgruppen, beitraganzahl is also set
          if (
            addItems.length > 0 &&
            !updates.beitraganzahl &&
            (field === "beitraege" || field === "beitragsgruppen")
          ) {
            throw new Error(
              "When adding beitraege or beitragsgruppen, beitraganzahl must also be set.",
            );
          }

          // Special handling: if modifying beitraege or beitragsgruppen and setting
          // beitragstart or beitragende, remove the added items first.
          // Otherwise, the API will not update the dates.
          if (
            addItems.length > 0 &&
            (updates.beitragstart || updates.beitragende) &&
            (field === "beitraege" || field === "beitragsgruppen")
          ) {
            removeItems.push(...addItems.map((item) => `-${item}`));
          }

          (updates as Record<string, unknown>)[field] = [
            ...removeItems, // first remove items
            ...addItems, // then add items
          ].join(",");
        }
      }

      delete updates.addByName;
      delete updates.removeByName;
    }

    // Check that beitraganzahl, beitragstart, and beitragende are only allowed with beitraege or beitragsgruppen
    if (
      (updates.beitraganzahl !== undefined ||
        updates.beitragstart !== undefined ||
        updates.beitragende !== undefined) &&
      !(updates as Record<string, unknown>).beitraege &&
      !(updates as Record<string, unknown>).beitragsgruppen
    ) {
      throw new Error(
        "beitraganzahl, beitragstart, and beitragende can only be set when beitraege or beitragsgruppen are also set.",
      );
    }

    // Convert einheitKuerzel to einheit if provided
    if (updates.einheitKuerzel) {
      updates = { ...updates };
      (updates as Record<string, unknown>).einheit = updates.einheitKuerzel;
      delete updates.einheitKuerzel;
    }

    const body = { id: memberId, ...updates };
    return await this.client.fetchData("UpdateMember", {
      method: "POST",
      body,
    });
  }
}
