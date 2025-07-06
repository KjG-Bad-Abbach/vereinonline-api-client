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
   * Fixes double-encoded JSON strings, particularly those with UTF-8 characters
   * that have been incorrectly encoded as sequences like "\u00c3\u00bc" instead of "\u00fc".
   *
   * This method recursively traverses the input object, detecting string values that may be
   * double-encoded, and decodes them using the specified charset (default: "UTF-8").
   * It handles strings, arrays, and objects, returning a new object with corrected encodings.
   *
   * @template T The type of the input and output object.
   * @param obj - The object or string to fix.
   * @param decoder - Optional TextDecoder instance to use for decoding.
   * @param charset - The character set to use for decoding (default: "UTF-8"; not used when decoder is provided).
   * @returns The object or string with corrected encoding.
   */
  fixJsonStringDoubleEncoding<T>(
    obj: T,
    decoder?: TextDecoder,
    charset: string = "UTF-8",
  ): T {
    if (!decoder) {
      decoder = new TextDecoder(charset);
    }

    // VereinOnline sometimes returns JSON strings that are double-encoded,
    // meaning that characters like "ü" and "ß" are encoded as
    // "f\u00c3\u00bcr" and "gro\u00c3\u009f" instead of "f\u00fcr" and "gro\u00df".
    // Wrongly encoded example:
    // {"text":"f\u00c3\u00bcr --- gro\u00c3\u009f"}
    // Correctly encoded example:
    // {"text":"f\u00fcr --- gro\u00df"}
    // Decoded example:
    // {"text":"für --- groß"}

    if (typeof obj === "string") {
      // Re-encode as bytes, then decode using the correct charset
      const bytes = Uint8Array.from(
        [...obj].map((char) => char.charCodeAt(0)),
      );
      return decoder.decode(bytes) as T;
    } else if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.fixJsonStringDoubleEncoding(item, decoder)
      ) as T;
    } else if (obj && typeof obj === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.fixJsonStringDoubleEncoding(
          value,
          decoder,
        );
      }
      return result as T;
    }
    return obj;
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

    // Parse the response as JSON
    const data = await response.json();

    // If data is not an object, throw
    if (
      typeof data !== "object" || data === null ||
      data === undefined
    ) {
      throw new Error(`Expected an object, but got ${typeof data}`);
    }

    // Check if the response contains an error object
    const isErrorObject = typeof data === "object" &&
      data !== null &&
      "error" in data;
    if (isErrorObject) {
      const errorMsg = this.fixJsonStringDoubleEncoding(
        (data as { error: string }).error,
        new TextDecoder("UTF-8"),
      ) ||
        "An error occurred while fetching data.";
      throw new Error(errorMsg);
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
    try {
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
      if (isEmptyArray) {
        const errorMsg = "Invalid username or password.";
        throw new Error(errorMsg);
      }
    } catch (error) {
      this.token = null; // Clear token on error
      throw new Error(
        `Login failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
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
