import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Set before importing the module under test: the encryption/hash keys are
// read lazily on first use (not at import time), but setting them up front
// keeps every test in this file deterministic regardless of run order.
beforeAll(() => {
  process.env.PATIENT_IDENTIFIER_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  process.env.PATIENT_IDENTIFIER_HASH_SECRET = randomBytes(32).toString("hex");
});

describe("patient identifier crypto (V0.2)", () => {
  it("round-trips encrypt/decrypt back to the original plaintext", async () => {
    const { encryptIdentifierValue, decryptIdentifierValue } = await import("./crypto");
    const raw = "0123456789";
    const encrypted = encryptIdentifierValue(raw);
    expect(encrypted).not.toContain(raw);
    expect(decryptIdentifierValue(encrypted)).toBe(raw);
  });

  it("produces a different ciphertext each time (random IV) for the same plaintext", async () => {
    const { encryptIdentifierValue } = await import("./crypto");
    const a = encryptIdentifierValue("0123456789");
    const b = encryptIdentifierValue("0123456789");
    expect(a).not.toBe(b);
  });

  it("hashes deterministically -- same input always produces the same hash", async () => {
    const { hashIdentifierValue } = await import("./crypto");
    expect(hashIdentifierValue("0123456789")).toBe(hashIdentifierValue("0123456789"));
    expect(hashIdentifierValue("0123456789")).not.toBe(hashIdentifierValue("0123456788"));
  });

  it("normalizes so formatting differences hash identically (the uniqueness-constraint requirement)", async () => {
    const { normalizeIdentifierValue, hashIdentifierValue } = await import("./crypto");
    const a = normalizeIdentifierValue("012-345 6789");
    const b = normalizeIdentifierValue("0123456789");
    expect(a).toBe(b);
    expect(hashIdentifierValue(a)).toBe(hashIdentifierValue(b));
  });

  it("masks all but the last 4 characters", async () => {
    const { maskIdentifierValue } = await import("./crypto");
    expect(maskIdentifierValue("0123456789")).toBe("******6789");
    expect(maskIdentifierValue("12")).toBe("**");
  });
});

describe("share-link token crypto (V5.3)", () => {
  it("generates a non-guessable, URL-safe token each time", async () => {
    const { generateShareToken } = await import("./crypto");
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it("hashes a token deterministically so the stored hash can be matched on lookup", async () => {
    const { generateShareToken, hashShareSecret } = await import("./crypto");
    const token = generateShareToken();
    expect(hashShareSecret(token)).toBe(hashShareSecret(token));
    expect(hashShareSecret(token)).not.toBe(hashShareSecret(generateShareToken()));
  });
});

describe("patient identifier crypto (V0.2) error paths", () => {
  it("throws a clear error instead of silently using an insecure default when a key env var is missing", async () => {
    const originalKey = process.env.PATIENT_IDENTIFIER_ENCRYPTION_KEY;
    delete process.env.PATIENT_IDENTIFIER_ENCRYPTION_KEY;
    try {
      // Force a fresh module instance so the lazily-cached key from earlier
      // tests in this file doesn't mask the missing-env-var path.
      vi.resetModules();
      const { encryptIdentifierValue } = await import("./crypto");
      expect(() => encryptIdentifierValue("x")).toThrow(/PATIENT_IDENTIFIER_ENCRYPTION_KEY/);
    } finally {
      process.env.PATIENT_IDENTIFIER_ENCRYPTION_KEY = originalKey;
      vi.resetModules();
    }
  });
});
