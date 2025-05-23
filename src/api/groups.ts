import type { ApiClient } from "./client.ts";

/**
 * Represents a group in the VereinOnline API.
 * The fields are based on the API documentation.
 */
export type Group = {
  id: string;
  mandant: string;
  name: string;
  beschreibung?: string | null;
  farbe?: string | null;
  vfarbe?: string | null;
  typ_v?: string | null;
  typ_m?: string | null;
  typ_i?: string | null;
  typ_d?: string | null;
  dms?: string | null;
  dateien?: string | null;
  bytes?: string | null;
  standard?: string | null;
  acl?: string | null;
  email?: string | null;
  autoregeln?: string | null;
  parentid?: string | null;
  public?: string | null;
  stunden?: string | null;
  sichtbarkeit?: string | null;
  typ_a?: string | null;
  appgruppenid?: string | null;
  bild?: string | null;
  pos?: string | null;
};

/**
 * GroupsApi class for interacting with the groups endpoint of the VereinOnline API.
 * This class provides methods to fetch groups.
 */
export class GroupsApi {
  private client: ApiClient;

  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Fetches groups from the API.
   * @returns A promise resolving to the list of groups.
   */
  async get(): Promise<Group[]> {
    return await this.client.fetchData("GetGroups", {});
  }
}
