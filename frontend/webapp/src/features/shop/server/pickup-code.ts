import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomInt, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Pickup code for an order collected at the Lsevin office: 6 digits, created when an admin marks
 * the order "ready for pickup", sent to the customer and shown on their order page, and typed in
 * by the office before the order can be marked "picked up".
 *
 * Stored twice, never in plain text:
 *  - an HMAC bound to (order, scope), which the office's entry is checked against;
 *  - an AES-256-GCM ciphertext, so the customer's order page can show the code.
 * Both keys are derived from AUTH_SECRET with their own label, so no new secret is needed.
 * Rotating AUTH_SECRET makes the codes already issued unreadable and unverifiable; the admin
 * then issues a new one ("send a new code").
 */

export const PICKUP_CODE_LENGTH = 6;
/** Wrong entries allowed before the code locks; a new code must be issued after that. */
export const PICKUP_CODE_MAX_ATTEMPTS = 5;

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function rootSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set; the pickup code cannot be created or checked.");
  return secret;
}

function derivedKey(label: string): Buffer {
  return createHmac("sha256", rootSecret()).update(`lsevin.shop.pickup-code.${label}.v1`).digest();
}

/** Persian/Arabic-Indic digits to ASCII, spaces and dashes removed ("۱۲۳ ۴۵۶" -> "123456"). */
export function normalizePickupCodeInput(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s-]/g, "");
}

export function isPickupCodeShape(value: string): boolean {
  return new RegExp(`^\\d{${PICKUP_CODE_LENGTH}}$`).test(value);
}

export function generatePickupCode(): string {
  return String(randomInt(0, 10 ** PICKUP_CODE_LENGTH)).padStart(PICKUP_CODE_LENGTH, "0");
}

export function hashPickupCode(orderId: string, scope: string, code: string): string {
  return createHmac("sha256", derivedKey("hash"))
    .update(`${orderId.toLowerCase()}:${scope.toLowerCase()}:${code}`)
    .digest("hex");
}

export function pickupCodeMatches(orderId: string, scope: string, entered: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const code = normalizePickupCodeInput(entered);
  if (!isPickupCodeShape(code)) return false;
  const a = Buffer.from(hashPickupCode(orderId, scope, code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** base64(iv || tag || ciphertext) */
export function encryptPickupCode(code: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", derivedKey("cipher"), iv);
  const ciphertext = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

/** The code, or null when it cannot be read (no code, or the secret changed). Never throws. */
export function decryptPickupCode(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  try {
    const packed = Buffer.from(encoded, "base64");
    const decipher = createDecipheriv("aes-256-gcm", derivedKey("cipher"), packed.subarray(0, IV_LENGTH));
    decipher.setAuthTag(packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    return Buffer.concat([decipher.update(packed.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** A freshly issued code with what to store for it. */
export function issuePickupCode(orderId: string, scope: string) {
  const code = generatePickupCode();
  return { code, hash: hashPickupCode(orderId, scope, code), cipher: encryptPickupCode(code) };
}
