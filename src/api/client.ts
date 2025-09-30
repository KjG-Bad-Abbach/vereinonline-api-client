import { MembersApi } from "./members.ts";
import { GroupsApi } from "./groups.ts";
import { TemplatesApi } from "./templates.ts";
import { generateToken } from "../utils/auth.ts";
import type { Buffer } from "node:buffer";
import { fixJsonStringDoubleEncoding } from "../utils/fixJsonStringDoubleEncoding.ts";
import { getTextEncoder } from "../utils/textEncoder.ts";
import { buildMultipartRequest } from "../utils/multipartRequestBuilder.ts";

/**
 * ApiClient class for interacting with the VereinOnline API.
 * This class handles authentication and provides methods to access different API endpoints.
 */
export class ApiClient {
  private token: string | null = null;
  private baseUrl: string;

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
   * @throws Will throw an error if the request fails or if the response is not valid.
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
    const response = await fetch(url, {
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
      const errorMsg = fixJsonStringDoubleEncoding(
        (data as { error: string }).error,
        new TextDecoder("UTF-8"),
      ) ||
        "An error occurred while fetching data.";
      throw new Error(errorMsg);
    }

    // Return the parsed data
    return data as T;
  }

  private async fetchWithTokenInRedirect(
    url: URL,
    options: RequestInit,
  ): Promise<Response> {
    options = { ...options };
    options.redirect = "manual";
    const response = await fetch(url, options);
    if (response.status === 302) {
      const location = response.headers.get("location");
      // Do the redirect manually with the token
      if (location) {
        const redirectUrl = new URL(location, this.baseUrl);
        if (this.token) {
          redirectUrl.searchParams.set("token", this.token);
        }
        return this.fetchWithTokenInRedirect(redirectUrl, {
          ...options,
          method: "GET",
          body: null,
        });
      }
    }
    return response;
  }

  /**
   * Fetches data from the API with authentication.
   * @param endpoint - The API endpoint to fetch data from.
   * @param params - The parameters to include in the request.
   * @returns The response data from the API.
   * @throws Will throw an error if the request fails or if the response is not valid.
   */
  async fetchHtml(
    path: string,
    { method = "GET", params, headers, body, contentType, charset = "utf-8" }: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      params?: Record<string, string> | null;
      headers?: Headers;
      body?: string | Record<string, unknown> | unknown[] | FormData | null;
      contentType?:
        | "application/x-www-form-urlencoded"
        | "multipart/form-data"
        | "text/plain"
        | "application/json";
      charset?: string;
    },
  ): Promise<{ content: string; headers: Headers }> {
    const url = new URL(path, this.baseUrl);
    if (this.token) {
      url.searchParams.set("token", this.token);
    }
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    headers ??= new Headers();
    headers.set(
      "Accept",
      [
        "text/html",
        "application/xhtml+xml",
        "application/xml;q=0.9",
        "*/*;q=0.8",
      ].join(","),
    );
    let bodyData: Buffer<ArrayBuffer> | null = null;
    if (body !== null && body !== undefined) {
      if (typeof body === "string") {
        const encoder = getTextEncoder(charset);
        headers.set("Content-Type", "text/plain; charset=" + encoder.charset);
        bodyData = encoder.encode(body);
      } else if (body instanceof FormData) {
        const { body: multipartBody } = await buildMultipartRequest(
          body,
          headers,
          charset,
        );
        // The correct Content-Type with boundary was set by buildMultipartRequest
        bodyData = multipartBody;
      } else if (typeof body === "object" || Array.isArray(body)) {
        if (contentType === "application/x-www-form-urlencoded") {
          // Prepare form data as application/x-www-form-urlencoded
          const urlSearchParams = new URLSearchParams();
          for (const [key, value] of Object.entries(body)) {
            urlSearchParams.append(key, String(value));
          }
          const encoder = getTextEncoder(charset);
          headers.set(
            "Content-Type",
            "application/x-www-form-urlencoded; charset=" + encoder.charset,
          );
          bodyData = encoder.encode(urlSearchParams.toString());
        } else if (contentType === "multipart/form-data") {
          // Prepare form data as multipart/form-data
          const formData = new FormData();
          for (const [key, value] of Object.entries(body)) {
            formData.append(key, String(value));
          }
          const { body: multipartBody } = await buildMultipartRequest(
            formData,
            headers,
            charset,
          );
          // The correct Content-Type with boundary was set by buildMultipartRequest
          bodyData = multipartBody;
        } else {
          // Default to application/json
          const json = JSON.stringify(body);
          const encoder = getTextEncoder(charset);
          headers.set(
            "Content-Type",
            "application/json; charset=" + encoder.charset,
          );
          bodyData = encoder.encode(json);
        }
      }
    }
    const response = await this.fetchWithTokenInRedirect(url, {
      method,
      headers,
      body: bodyData,
    });

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching html: ${response.statusText} - ${errorText}`,
      );
    }

    // Parse the response as JSON
    const bytes = await response.bytes();
    if (!bytes) {
      throw new Error("No data received from the server.");
    }
    // Extract charset from Content-Type header, fallback to windows-1252
    const responseContentType = response.headers.get("content-type") || "";
    const responseCharsetMatch = responseContentType.match(/charset=([^;]+)/i);
    const responseCharset = responseCharsetMatch
      ? responseCharsetMatch[1].trim()
      : "windows-1252";

    // Decode bytes using the detected charset
    const text = new TextDecoder(responseCharset).decode(bytes);

    // Check if the response contains an error object
    const isErrorObject = typeof text === "object" &&
      text !== null &&
      "error" in text;
    if (isErrorObject) {
      const errorMsg = fixJsonStringDoubleEncoding(
        (text as { error: string }).error,
        new TextDecoder("UTF-8"),
      ) ||
        "An error occurred while fetching data.";
      throw new Error(errorMsg);
    }

    // If data is not a string, throw
    if (
      typeof text !== "string" || text === null ||
      text === undefined
    ) {
      throw new Error(`Expected a string, but got ${typeof text}`);
    }

    // Return the parsed data
    return {
      content: text,
      headers: response.headers,
    };
  }

  /**
   * Logs in the user and stores the token.
   * @param username - The username for authentication.
   * @param password - The password for authentication.
   * @param shouldVerifyLogin - Whether to verify the login by making a test request (default: true).
   * @throws Will throw an error if the login fails.
   */
  async login(
    username: string,
    password: string,
    shouldVerifyLogin: boolean = true,
  ): Promise<void> {
    this.token = generateToken(username, password);

    if (!shouldVerifyLogin) {
      return;
    }

    // Verify login by making a test request
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

  private membersApi?: MembersApi;
  get members(): MembersApi {
    return this.membersApi ??= new MembersApi(this);
  }

  private groupsApi?: GroupsApi;
  get groups(): GroupsApi {
    return this.groupsApi ??= new GroupsApi(this);
  }

  private templatesApi?: TemplatesApi;
  get templates(): TemplatesApi {
    return this.templatesApi ??= new TemplatesApi(this);
  }
}
