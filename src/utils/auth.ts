import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

// https://www.vereinonline.org/handbuch#1.6.3

export function generateToken(username: string, password: string): string {
  const md5 = encodeHex(
    crypto.subtle.digestSync("MD5", new TextEncoder().encode(password)),
  );
  return `A/${username}/${md5}`;
}
