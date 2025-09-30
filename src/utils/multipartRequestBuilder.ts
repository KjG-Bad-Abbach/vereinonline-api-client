import { Buffer } from "node:buffer";
import { getTextEncoder } from "./textEncoder.ts";

/**
 * Builds a RequestInit with multipart/form-data body,
 * encoded using the given charset (default: utf-8).
 *
 * @param form - The FormData to encode.
 * @param init - Optional RequestInit to merge with.
 * @param charset - The character set to use for encoding (default: "utf-8").
 * @returns An object containing the body as Buffer and the headers with Content-Type set.
 */
export async function buildMultipartRequest(
  form: FormData,
  headers: Headers = new Headers(),
  charset: string = "utf-8",
): Promise<{ body: Buffer<ArrayBuffer>; headers: Headers }> {
  const boundary = "----denoFormBoundary" + crypto.randomUUID();

  // Encoder for given charset (falls back to utf-8 if unsupported)
  const encoder = getTextEncoder(charset);
  charset = encoder.charset;

  // Build the multipart body as Buffer
  const chunks: Buffer[] = [];

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
      chunks.push(Buffer.from(await value.arrayBuffer()));

      // Trailing CRLF
      chunks.push(encoder.encode("\r\n"));
    }
  }

  // Closing boundary
  chunks.push(encoder.encode(`--${boundary}--\r\n`));

  // Concatenate chunks into a single Buffer
  const body = Buffer.concat(chunks);

  // Set the Content-Type header with boundary and charset
  headers.set(
    "Content-Type",
    `multipart/form-data; boundary=${boundary}; charset=${charset}`,
  );

  return {
    body,
    headers,
  };
}
