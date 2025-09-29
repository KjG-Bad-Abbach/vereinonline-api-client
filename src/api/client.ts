import { MembersApi } from "./members.ts";
import { GroupsApi } from "./groups.ts";
import { TemplatesApi } from "./templates.ts";
import { generateToken } from "../utils/auth.ts";
import iconv from "iconv-lite";

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
   * Gets a TextEncoder for the specified charset.
   * Falls back to UTF-8 if the charset is not supported.
   *
   * @param charset - The character set to use for encoding (e.g., "utf-8", "iso-8859-1").
   * @returns An object containing the encode function and the charset used.
   */
  getTextEncoder(
    charset: string | null | undefined,
  ): { encode: (input: string) => Uint8Array; charset: string } {
    const utf8Encoder = {
      encode: (input: string) => new TextEncoder().encode(input),
      charset: "utf-8",
    };
    if (
      charset === null ||
      charset === undefined ||
      charset.trim() === "" ||
      charset.toLowerCase() === "utf-8" ||
      charset.toLowerCase() === "utf8"
    ) {
      return utf8Encoder;
    }

    // Try to load iconv-lite for other charsets
    try {
      if (iconv.encodingExists(charset)) {
        // Create a custom encoder using iconv-lite
        return {
          encode: (input: string) =>
            new Uint8Array(iconv.encode(input, charset)),
          charset: charset,
        };
      } else {
        console.warn(
          `Charset "${charset}" not supported by iconv-lite, falling back to utf-8`,
        );
        return utf8Encoder;
      }
    } catch {
      // iconv-lite not available, fallback to TextEncoder
      console.warn(
        `iconv-lite not available and charset "${charset}" not supported, falling back to utf-8`,
      );
      return utf8Encoder;
    }
  }

  /**
   * Builds a RequestInit with multipart/form-data body,
   * encoded using the given charset (default: utf-8).
   *
   * @param form - The FormData to encode.
   * @param init - Optional RequestInit to merge with.
   * @param charset - The character set to use for encoding (default: "utf-8").
   * @returns An object containing the body as Uint8Array and the headers with Content-Type set.
   */
  async buildMultipartRequest(
    form: FormData,
    headers: Headers = new Headers(),
    charset: string = "utf-8",
  ): Promise<{ body: Uint8Array; headers: Headers }> {
    const boundary = "----denoFormBoundary" + crypto.randomUUID();

    // Encoder for given charset (falls back to utf-8 if unsupported)
    const encoder = this.getTextEncoder(charset);
    charset = encoder.charset;

    // Build the multipart body as Uint8Array
    const chunks: Uint8Array[] = [];

    for (const [name, value] of form.entries()) {
      let part = `--${boundary}\r\n`;

      if (typeof value === "string") {
        // Normal text field
        part += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
        chunks.push(encoder.encode(part + value + "\r\n"));
      } else {
        // File (Blob)
        const filename = value.name || "blob";
        const contentType = value.type ||
          `application/octet-stream; charset=${charset}`;

        part +=
          `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`;
        part += `Content-Type: ${contentType}\r\n\r\n`;

        // Header first
        chunks.push(encoder.encode(part));

        // Then the file content as-is (no charset re-encode for binary)
        chunks.push(new Uint8Array(await value.arrayBuffer()));

        // Trailing CRLF
        chunks.push(encoder.encode("\r\n"));
      }
    }

    // Closing boundary
    chunks.push(encoder.encode(`--${boundary}--\r\n`));

    // Concatenate chunks into a single Uint8Array
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      body.set(c, offset);
      offset += c.length;
    }

    // Clone headers (case-insensitive)
    headers.set(
      "Content-Type",
      `multipart/form-data; boundary=${boundary}; charset=${charset}`,
    );

    return {
      body,
      headers,
    };
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

  private async fetchWithTokenInRedirect(
    url: URL,
    options: RequestInit,
  ): Promise<Response> {
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
    let bodyData: Uint8Array | null = null;
    if (body !== null && body !== undefined) {
      if (typeof body === "string") {
        const encoder = this.getTextEncoder(charset);
        headers.set("Content-Type", "text/plain; charset=" + encoder.charset);
        bodyData = encoder.encode(body);
      } else if (body instanceof FormData) {
        const { body: multipartBody } = await this.buildMultipartRequest(
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
          const encoder = this.getTextEncoder(charset);
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
          const { body: multipartBody } = await this.buildMultipartRequest(
            formData,
            headers,
            charset,
          );
          // The correct Content-Type with boundary was set by buildMultipartRequest
          bodyData = multipartBody;
        } else {
          // Default to application/json
          const json = JSON.stringify(body);
          const encoder = this.getTextEncoder(charset);
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
      body: bodyData
        ? new ReadableStream({
          start(controller) {
            controller.enqueue(bodyData);
            controller.close();
          },
        })
        : null,
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
      const errorMsg = this.fixJsonStringDoubleEncoding(
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
