import { describe, expect, it } from "vitest";

import {
  CreateConsultationRequestSchema,
  composeE164,
  foldDigits,
  isIranianMobile,
  normalizePhone,
} from "./schemas";

/**
 * These assertions exist because getting them wrong does not produce a broken page —
 * it produces an SMS delivered to a real person who never asked for one.
 *
 * `identity.asp_net_users` stores a phone as a bare national number with the ISO
 * country in a separate column (verified against the restored production database:
 * IR "9107826538", TR "5063565571", IQ "7750619310"). A ten-digit number beginning
 * with 9 is an Iranian mobile in Iran — and also an ordinary mobile in Russia. So a
 * normaliser that sees the number without its country has to guess, and the wrong
 * guess rewrites a foreign customer's number into a *different, real* Iranian
 * subscriber, who then receives the confirmation while the callback team dials them.
 */
describe("normalizePhone", () => {
  it("accepts every shape an Iranian customer actually types", () => {
    for (const input of [
      "09123456789",
      "9123456789",
      "+989123456789",
      "00989123456789",
      "0912 345 6789",
      "0912-345-6789",
    ]) {
      expect(normalizePhone(input)).toBe("09123456789");
    }
  });

  it("folds Persian and Arabic-Indic digits", () => {
    expect(foldDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizePhone("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });

  it("does not turn a foreign national number into an Iranian one", () => {
    // The whole point of the country parameter.
    expect(normalizePhone("9161234567", "RU")).toBe("+79161234567");
    expect(normalizePhone("5063565571", "TR")).toBe("+905063565571");
    expect(normalizePhone("7750619310", "IQ")).toBe("+9647750619310");

    expect(isIranianMobile(normalizePhone("9161234567", "RU")!)).toBe(false);
  });

  it("lets an explicit international prefix override the assumed country", () => {
    expect(normalizePhone("+15551234567", "IR")).toBe("+15551234567");
    expect(normalizePhone("+905063565571", "TR")).toBe("+905063565571");
  });

  it("still resolves an Iranian number when the country says IR", () => {
    expect(normalizePhone("9107826538", "IR")).toBe("09107826538");
    expect(isIranianMobile(normalizePhone("9107826538", "IR")!)).toBe(true);
  });

  it("rejects what cannot be a phone number", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("abcdefgh")).toBeNull();
    expect(normalizePhone("1234567890123456789")).toBeNull();
  });
});

describe("composeE164", () => {
  it("recombines the two columns the account stores separately", () => {
    expect(composeE164("9107826538", "IR")).toBe("+989107826538");
    expect(composeE164("5063565571", "TR")).toBe("+905063565571");
    expect(composeE164("7750619310", "IQ")).toBe("+9647750619310");
  });

  it("drops a trunk zero rather than embedding it in E.164", () => {
    expect(composeE164("09107826538", "IR")).toBe("+989107826538");
  });

  it("returns the national part when the country is unknown or absent", () => {
    expect(composeE164("9107826538", null)).toBe("9107826538");
    expect(composeE164("9107826538", "ZZ")).toBe("9107826538");
    expect(composeE164("", "IR")).toBe("");
    expect(composeE164(null, "IR")).toBe("");
  });
});

describe("CreateConsultationRequestSchema", () => {
  const base = {
    firstName: "سارا",
    lastName: "احمدی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
  };

  it("normalises the phone using the submitted country", () => {
    const parsed = CreateConsultationRequestSchema.parse(base);
    expect(parsed.phone).toBe("09123456789");

    const foreign = CreateConsultationRequestSchema.parse({
      ...base,
      phone: "9161234567",
      phoneCountryCode: "ru",
    });
    expect(foreign.phone).toBe("+79161234567");
    expect(foreign.phoneCountryCode).toBe("RU");
  });

  it("applies the documented defaults", () => {
    const parsed = CreateConsultationRequestSchema.parse(base);
    expect(parsed.preferredContactTime).toBe("any");
    expect(parsed.urgency).toBe("normal");
  });

  it("treats empty optional strings as absent rather than as values", () => {
    const parsed = CreateConsultationRequestSchema.parse({
      ...base,
      email: "",
      categoryId: "",
      bookingDraftId: "",
      description: "",
    });
    expect(parsed.email).toBeUndefined();
    expect(parsed.categoryId).toBeUndefined();
    expect(parsed.bookingDraftId).toBeUndefined();
  });

  it("rejects an unusable phone with the translatable code the form maps", () => {
    const result = CreateConsultationRequestSchema.safeParse({ ...base, phone: "123" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("invalidPhone");
  });

  it("requires a real name", () => {
    expect(CreateConsultationRequestSchema.safeParse({ ...base, firstName: "a" }).success).toBe(
      false
    );
  });
});
