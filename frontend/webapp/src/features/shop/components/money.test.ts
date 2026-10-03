import { describe, expect, it } from "vitest";

import { currencyLabel, formatAmount } from "./money";

describe("localized shop money", () => {
  it.each(["en", "fa", "ar", "de", "fr", "es", "tr", "ku"])(
    "uses %s number conventions",
    (locale) => {
      expect(formatAmount(1234.5, "USD", locale)).toBe(
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(1234.5)
      );
    }
  );
  it("uses the regional locale for currency names", () => {
    expect(currencyLabel("USD", "de")).toBe(
      new Intl.DisplayNames(["de"], { type: "currency" }).of("USD")
    );
  });
});
