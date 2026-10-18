import { describe, expect, it } from "vitest";

import { normalizePayoutAccountInput, PayoutAccountRuleError } from "./payout-accounts.service";

/** What the accountant types on the provider payouts card, before it reaches the database. */
describe("normalizePayoutAccountInput", () => {
  it("accepts Persian digits and spaces, and adds IR to a bare 24-digit Sheba", () => {
    const out = normalizePayoutAccountInput({
      holderName: " کلینیک ماه نو ",
      cardNumber: "۶۰۳۷ ۹۹۱۲ ۳۴۵۶ ۷۸۹۰",
      iban: "120170000000123456789012",
      accountNumber: "0123456789",
    });
    expect(out).toMatchObject({
      holderName: "کلینیک ماه نو",
      cardNumber: "6037991234567890",
      iban: "IR120170000000123456789012",
      accountNumber: "0123456789",
      last4: "6789",
    });
  });

  it("needs a holder name and at least one number", () => {
    expect(() => normalizePayoutAccountInput({ holderName: "", iban: "IR120170000000123456789012" })).toThrow(
      PayoutAccountRuleError
    );
    expect(() => normalizePayoutAccountInput({ holderName: "A" })).toThrow(/card, Sheba or account/);
  });

  it("rejects a short card and a malformed Sheba", () => {
    expect(() => normalizePayoutAccountInput({ holderName: "A", cardNumber: "6037 9912" })).toThrow(/16 digits/);
    expect(() => normalizePayoutAccountInput({ holderName: "A", iban: "IR12" })).toThrow(/IR followed by 24/);
  });
});
