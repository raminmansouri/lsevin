import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptPickupCode,
  encryptPickupCode,
  generatePickupCode,
  hashPickupCode,
  issuePickupCode,
  normalizePickupCodeInput,
  pickupCodeMatches,
} from "./pickup-code";

const ORIGINAL_SECRET = process.env.AUTH_SECRET;
beforeEach(() => {
  process.env.AUTH_SECRET = "test-auth-secret-for-pickup-codes";
});
afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = ORIGINAL_SECRET;
});

describe("Lsevin office pickup code", () => {
  it("is always 6 digits, zero-padded", () => {
    for (let i = 0; i < 500; i += 1) expect(generatePickupCode()).toMatch(/^\d{6}$/);
  });

  it("matches only the issued code, for the same order and scope", () => {
    const orderId = randomUUID();
    const sellerId = randomUUID();
    const { code, hash, cipher } = issuePickupCode(orderId, sellerId);
    expect(hash).not.toContain(code);
    expect(cipher).not.toContain(code);
    expect(pickupCodeMatches(orderId, sellerId, code, hash)).toBe(true);
    expect(pickupCodeMatches(orderId.toUpperCase(), sellerId, code, hash)).toBe(true);

    const wrong = code === "000000" ? "000001" : "000000";
    expect(pickupCodeMatches(orderId, sellerId, wrong, hash)).toBe(false);
    // The same code for another order or another scope does not open this one.
    expect(pickupCodeMatches(randomUUID(), sellerId, code, hash)).toBe(false);
    expect(pickupCodeMatches(orderId, randomUUID(), code, hash)).toBe(false);
    // No code issued yet, or a malformed entry.
    expect(pickupCodeMatches(orderId, sellerId, code, null)).toBe(false);
    expect(pickupCodeMatches(orderId, sellerId, `${code}0`, hash)).toBe(false);
    expect(pickupCodeMatches(orderId, sellerId, "", hash)).toBe(false);
  });

  it("accepts the code typed with Persian or Arabic digits and spaces", () => {
    const orderId = randomUUID();
    const sellerId = randomUUID();
    const hash = hashPickupCode(orderId, sellerId, "123456");
    expect(normalizePickupCodeInput("۱۲۳ ۴۵۶")).toBe("123456");
    expect(pickupCodeMatches(orderId, sellerId, "۱۲۳۴۵۶", hash)).toBe(true);
    expect(pickupCodeMatches(orderId, sellerId, "١٢٣-٤٥٦", hash)).toBe(true);
  });

  it("the customer's copy decrypts to the code; a changed secret or a tampered value reads as no code", () => {
    const cipher = encryptPickupCode("042917");
    expect(decryptPickupCode(cipher)).toBe("042917");
    expect(encryptPickupCode("042917")).not.toBe(cipher); // a fresh IV each time
    expect(decryptPickupCode(null)).toBeNull();
    expect(decryptPickupCode("not-base64-ciphertext")).toBeNull();

    const tampered = Buffer.from(cipher, "base64");
    tampered[tampered.length - 1] ^= 1;
    expect(decryptPickupCode(tampered.toString("base64"))).toBeNull();

    process.env.AUTH_SECRET = "another-secret";
    expect(decryptPickupCode(cipher)).toBeNull();
  });

  it("refuses to work without AUTH_SECRET instead of using a weak key", () => {
    delete process.env.AUTH_SECRET;
    expect(() => issuePickupCode(randomUUID(), randomUUID())).toThrow(/AUTH_SECRET/);
  });
});
