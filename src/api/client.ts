import { MembersApi } from "./members.ts";
import { GroupsApi } from "./groups.ts";
import { generateToken } from "../utils/auth.ts";

/**
 * ApiClient class for interacting with the VereinOnline API.
 * This class handles authentication and provides methods to access different API endpoints.
 */
export class ApiClient {
  private token: string | null = null;
  private baseUrl: string;
  private membersApi: MembersApi = new MembersApi(this);
  private groupsApi: GroupsApi = new GroupsApi(this);

  /**
   * Constructor for the ApiClient class.
   * @param baseUrl - The base URL for the API. For example: "https://www.vereinonline.org/IHRVEREIN/"
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches data from the API with authentication.
   * @param endpoint - The API endpoint to fetch data from.
   * @param params - The parameters to include in the request.
   * @returns The response data from the API.
   */
  async fetchData<T>(
    endpoint: string,
    { method = "GET", body }: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: string | Record<string, unknown> | unknown[] | null;
    },
  ): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("api", endpoint);
    if (this.token) {
      url.searchParams.set("token", this.token);
    }
    const headers = new Headers({
      "Accept": "application/json",
    });
    let bodyStr: string | null = null;
    if (body !== null && body !== undefined) {
      if (typeof body === "string") {
        headers.set("Content-Type", "text/plain");
        bodyStr = body;
      } else if (typeof body === "object" || Array.isArray(body)) {
        headers.set("Content-Type", "application/json");
        bodyStr = JSON.stringify(body);
      }
    }
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: bodyStr,
    });

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching data: ${response.statusText} - ${errorText}`,
      );
    }

    // Parse the response text as JSON
    // Recursively decode all strings in the object using the specified charset
    function fixVereinOnlineJsonStringDoubleEncoding(
      obj: unknown,
      decoder: TextDecoder,
    ): unknown {
      if (typeof obj === "string") {
        // Re-encode as bytes, then decode using the correct charset
        const bytes = Uint8Array.from(
          [...obj].map((char) => char.charCodeAt(0)),
        );
        return decoder.decode(bytes);
      } else if (Array.isArray(obj)) {
        return obj.map((item) =>
          fixVereinOnlineJsonStringDoubleEncoding(item, decoder)
        );
      } else if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = fixVereinOnlineJsonStringDoubleEncoding(value, decoder);
        }
        return result;
      }
      return obj;
    }

    const dataWithDoubleEncoding = await response.json();
    // VereinOnline returns JSON strings that are double-encoded,
    // meaning that characters like "ü" and "ß" are encoded as
    // "f\u00c3\u00bcr" and "gro\u00c3\u009f" instead of "f\u00fcr" and "gro\u00df".
    // Wrongly encoded example:
    // {"text":"f\u00c3\u00bcr --- gro\u00c3\u009f"}
    // Correctly encoded example:
    // {"text":"f\u00fcr --- gro\u00df"}
    // Decoded example:
    // {"text":"für --- groß"}
    const data = fixVereinOnlineJsonStringDoubleEncoding(
      dataWithDoubleEncoding,
      new TextDecoder("UTF-8"),
    );

    // If data is not an object, throw
    if (
      typeof data !== "object" || data === null ||
      data === undefined
    ) {
      throw new Error(`Expected an object, but got ${typeof data}`);
    }

    // Return the parsed data
    return data as T;
  }

  /**
   * Logs in the user and stores the token.
   * @param username - The username for authentication.
   * @param password - The password for authentication.
   */
  async login(username: string, password: string): Promise<void> {
    this.token = generateToken(username, password);
    const result = await this.fetchData("VerifyLogin", {
      method: "POST",
      body: {
        user: username,
        password: password,
        result: "id",
      },
    }) as string[];
    const isEmptyArray = Array.isArray(result) &&
      (result.length === 0 || !result[0]);
    const isErrorObject = typeof result === "object" && result !== null &&
      "error" in result;
    if (isEmptyArray || isErrorObject) {
      const errorMsg = isErrorObject
        ? `Login failed: ${(result as { error: string }).error}`
        : "Login failed. Invalid username or password.";
      throw new Error(errorMsg);
    }
  }

  /**
   * Logs out the user by clearing the token.
   */
  logout(): void {
    this.token = null;
  }

  /**
   * Creates an instance of the Members API.
   */
  get members(): MembersApi {
    return this.membersApi;
  }

  /**
   * Creates an instance of the Groups API.
   */
  get groups(): GroupsApi {
    return this.groupsApi;
  }
}
