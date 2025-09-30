import { Buffer } from "node:buffer";
import iconv from "iconv-lite";

/**
 * Gets a TextEncoder for the specified charset.
 * Falls back to UTF-8 if the charset is not supported.
 *
 * @param charset - The character set to use for encoding (e.g., "utf-8", "iso-8859-1").
 * @returns An object containing the encode function and the charset used.
 */
export function getTextEncoder(
  charset: string | null | undefined,
): { encode: (input: string) => Buffer<ArrayBuffer>; charset: string } {
  const utf8Encoder = {
    encode: (input: string) => Buffer.from(new TextEncoder().encode(input)),
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
        encode: (input: string) => Buffer.from(iconv.encode(input, charset)),
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
