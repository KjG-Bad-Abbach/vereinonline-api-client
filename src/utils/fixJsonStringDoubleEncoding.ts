import { Buffer } from "node:buffer";

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
export function fixJsonStringDoubleEncoding<T>(
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
    const bytes = Buffer.from(
      [...obj].map((char) => char.charCodeAt(0)),
    );
    return decoder.decode(bytes) as T;
  } else if (Array.isArray(obj)) {
    return obj.map((item) => fixJsonStringDoubleEncoding(item, decoder)) as T;
  } else if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fixJsonStringDoubleEncoding(
        value,
        decoder,
      );
    }
    return result as T;
  }
  return obj;
}
