import { describe, expect, it } from "vitest";

import { formatCurrencyAmount, formatMoney, getRialTomanLabel } from "./money";

describe("Iranian currency display", () => {
  it("never prints the raw ISO code for IRR/IRT", () => {
    for (const locale of ["fa", "fa-IR", "en", "en-US", "ar", "tr"]) {
      for (const code of ["IRR", "IRT"]) {
        expect(formatCurrencyAmount(1_100_000_000, code, locale)).not.toMatch(/IRR|IRT/);
        expect(formatMoney({ amount: 1_100_000_000, currencyCode: code }, { locale, showCode: true })).not.toMatch(/IRR|IRT/);
      }
    }
  });

  it("uses the localized rial/toman names", () => {
    expect(getRialTomanLabel("IRR", "fa")).toBe("ریال");
    expect(getRialTomanLabel("IRT", "fa-IR")).toBe("تومان");
    expect(getRialTomanLabel("IRR", "en")).toBe("Rial");
    expect(getRialTomanLabel("IRT", "en-US")).toBe("Toman");
    expect(getRialTomanLabel("USD", "fa")).toBeNull();
  });

  it("formats the amount with the label", () => {
    expect(formatCurrencyAmount(1_100_000_000, "IRR", "en")).toBe("1,100,000,000 Rial");
    expect(formatCurrencyAmount(5000, "irt", "fa")).toMatch(/تومان$/);
  });

  it("still formats other currencies through Intl", () => {
    expect(formatCurrencyAmount(12.5, "USD", "en-US")).toBe("$12.50");
    expect(formatCurrencyAmount(10, "NOPE1", "en")).toContain("NOPE1");
  });
});
