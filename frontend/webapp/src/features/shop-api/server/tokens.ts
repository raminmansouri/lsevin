import "server-only";

import { createHash, randomBytes } from "node:crypto";

/** Every token starts with this, so a leaked one is easy to recognise (and to search for). */
export const SHOP_API_TOKEN_PREFIX = "lsv_";
const TOKEN_PATTERN = /^lsv_[A-Za-z0-9_-]{43}$/;
/** How much of the token the admin list shows to tell tokens apart. */
const DISPLAY_PREFIX_LENGTH = 12;

/** A new secret: "lsv_" + 32 random bytes (256 bits) in base64url. Shown to the admin once. */
export function generateShopApiToken(): { token: string; prefix: string; hash: string } {
  const token = `${SHOP_API_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { token, prefix: token.slice(0, DISPLAY_PREFIX_LENGTH), hash: hashShopApiToken(token) };
}

/**
 * Only this hash is stored. A plain SHA-256 is enough here (unlike passwords): the token is
 * 256 random bits, so there is nothing to brute-force from the hash.
 */
export function hashShopApiToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function looksLikeShopApiToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}
