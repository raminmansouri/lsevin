import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Patient identifier crypto (V0.2). No general "encrypt a DB column" helper
 * existed in this codebase before this feature -- everything crypto-related
 * elsewhere is password hashing (scrypt, non-deterministic) or HMAC-signed
 * SSO tokens. National IDs/passports need the opposite of password hashing:
 * reversible (staff can reveal with permission) and deterministic-hashable
 * (so an exact-match lookup/uniqueness constraint works without decrypting
 * every row). AES-256-GCM + a separate HMAC-SHA256 lookup hash is the
 * standard shape for that; both use Node's built-in `node:crypto`, matching
 * the rest of this codebase's "stdlib only, no crypto npm packages" pattern.
 */

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function loadKey(envVar: string): Buffer {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(
      `${envVar} is not set. Set it to a 64-character hex string or a base64-encoded 32-byte key before storing or reading patient identifiers.`
    );
  }
  const buffer = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buffer.length !== 32) {
    throw new Error(`${envVar} must decode to exactly 32 bytes (got ${buffer.length}).`);
  }
  return buffer;
}

let encryptionKey: Buffer | null = null;
function getEncryptionKey(): Buffer {
  encryptionKey ??= loadKey("PATIENT_IDENTIFIER_ENCRYPTION_KEY");
  return encryptionKey;
}

let hashSecret: Buffer | null = null;
function getHashSecret(): Buffer {
  hashSecret ??= loadKey("PATIENT_IDENTIFIER_HASH_SECRET");
  return hashSecret;
}

/** Returns base64(iv || authTag || ciphertext). */
export function encryptIdentifierValue(rawValue: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(rawValue, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptIdentifierValue(encoded: string): string {
  const packed = Buffer.from(encoded, "base64");
  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(AES_ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Deterministic (same input -> same output), for exact-match lookup/uniqueness. */
export function hashIdentifierValue(value: string): string {
  return createHmac("sha256", getHashSecret()).update(value).digest("hex");
}

/** Strips everything but letters/digits and uppercases, so "12-345 678" and
 * "12345678" hash identically for matching/uniqueness. */
export function normalizeIdentifierValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Keeps the last 4 characters, masks the rest. Safe to render in ordinary
 * UI without an unmask permission (spec V0.2). */
export function maskIdentifierValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "*".repeat(trimmed.length);
  return "*".repeat(trimmed.length - 4) + trimmed.slice(-4);
}
