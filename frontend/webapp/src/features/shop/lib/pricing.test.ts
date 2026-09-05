import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for the Shop pricing-resolution rules (§4.4). Finance's
 * convert_money / currency catalogue is mocked — those are the platform's and
 * are tested elsewhere; here we assert Shop's mode logic, de-duplication and
 * unavailable-rate handling.
 */

const convertMoney = vi.fn();
const getActiveCurrencies = vi.fn();
const getDefaultCurrencyForCountry = vi.fn();
const createFxQuote = vi.fn();

vi.mock("@/features/finance/lib/server/currency-queries", () => ({
  convertMoney: (...a: unknown[]) => convertMoney(...a),
  getActiveCurrencies: (...a: unknown[]) => getActiveCurrencies(...a),
  getDefaultCurrencyForCountry: (...a: unknown[]) => getDefaultCurrencyForCountry(...a),
  createFxQuote: (...a: unknown[]) => createFxQuote(...a),
}));

const settingsRows: Record<string, string> = {};
vi.mock("@/config/database/db", () => ({
  default: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join(" ");
      if (text.includes("finance.settings")) {
        const key = values.find((v) => typeof v === "string" && v.startsWith("shop_")) as string | undefined;
        return Promise.resolve(key && settingsRows[key] ? [{ value: settingsRows[key] }] : []);
      }
      return Promise.resolve([]);
    },
    { json: (v: unknown) => v }
  ),
}));

import {
  getShopPricingMode,
  resolveDisplayCurrency,
  resolvePrices,
  resolvePrice,
} from "./pricing";

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(settingsRows)) delete settingsRows[k];
  getActiveCurrencies.mockResolvedValue([
    { code: "USD", symbol: "$", name: "US Dollar", decimalDigits: 2, isDisplayEnabled: true },
    { code: "TRY", symbol: "₺", name: "Turkish Lira", decimalDigits: 2, isDisplayEnabled: true },
    { code: "EUR", symbol: "€", name: "Euro", decimalDigits: 2, isDisplayEnabled: true },
  ]);
});

describe("getShopPricingMode", () => {
  it("defaults to market_default_with_selector", async () => {
    await expect(getShopPricingMode()).resolves.toBe("market_default_with_selector");
  });
  it("honours a stored market_default", async () => {
    settingsRows.shop_pricing_mode = "market_default";
    await expect(getShopPricingMode()).resolves.toBe("market_default");
  });
});

describe("resolveDisplayCurrency", () => {
  it("market_default: uses the country default and ignores any selected currency", async () => {
    settingsRows.shop_pricing_mode = "market_default";
    getDefaultCurrencyForCountry.mockResolvedValue("TRY");
    const r = await resolveDisplayCurrency({ countryCode: "TR", selectedCurrencyCode: "USD" });
    expect(r.currency).toBe("TRY");
    expect(r.selectable).toHaveLength(0); // no switcher exposed
  });

  it("market_default_with_selector: a valid selected currency wins over the market default", async () => {
    settingsRows.shop_pricing_mode = "market_default_with_selector";
    getDefaultCurrencyForCountry.mockResolvedValue("TRY");
    const r = await resolveDisplayCurrency({ countryCode: "TR", selectedCurrencyCode: "EUR" });
    expect(r.currency).toBe("EUR");
    expect(r.selectable.map((s) => s.code)).toContain("EUR");
  });

  it("ignores a selected currency that is not display-enabled", async () => {
    settingsRows.shop_pricing_mode = "market_default_with_selector";
    getDefaultCurrencyForCountry.mockResolvedValue("TRY");
    const r = await resolveDisplayCurrency({ countryCode: "TR", selectedCurrencyCode: "GBP" });
    expect(r.currency).toBe("TRY");
  });

  it("falls back to the configured default when the country has no mapping", async () => {
    settingsRows.shop_default_currency = "USD";
    getDefaultCurrencyForCountry.mockResolvedValue(null);
    const r = await resolveDisplayCurrency({ countryCode: null, selectedCurrencyCode: null });
    expect(r.currency).toBe("USD");
  });
});

describe("resolvePrices", () => {
  it("de-duplicates conversions to one call per source currency and scales linearly", async () => {
    convertMoney.mockResolvedValue({ appliedRate: 40, targetAmount: 40 });
    const out = await resolvePrices(
      [
        { amount: 100, sourceCurrency: "USD" },
        { amount: 5, sourceCurrency: "USD" },
        { amount: 200, sourceCurrency: "USD", compareAtAmount: 250 },
      ],
      "TRY"
    );
    // one rate lookup for USD->TRY regardless of row count
    expect(convertMoney).toHaveBeenCalledTimes(1);
    expect(out[0].price.amount).toBe(4000);
    expect(out[1].price.amount).toBe(200);
    expect(out[2].price.amount).toBe(8000);
    expect(out[2].compareAtPrice?.amount).toBe(10000);
    expect(out[0].price.converted).toBe(true);
  });

  it("falls back to the source currency (exact amount, never blocked) when Finance has no rate", async () => {
    convertMoney.mockRejectedValue(new Error("No active exchange rate"));
    const out = await resolvePrices([{ amount: 100, sourceCurrency: "IRR" }], "TRY");
    // Not blocked — the cart/checkout keeps working; the amount is exact and
    // shown under its own (source) currency, not a wrong number under TRY.
    expect(out[0].price.unavailable).toBe(false);
    expect(out[0].price.fellBackToSource).toBe(true);
    expect(out[0].price.currency).toBe("IRR");
    expect(out[0].price.amount).toBe(100);
  });

  it("does not convert when source === display", async () => {
    const out = await resolvePrices([{ amount: 12.34, sourceCurrency: "USD" }], "USD");
    expect(convertMoney).not.toHaveBeenCalled();
    expect(out[0].price.amount).toBeCloseTo(12.34, 2);
    expect(out[0].price.converted).toBe(false);
  });
});

describe("resolvePrice", () => {
  it("resolves a single price + compare-at through Finance", async () => {
    convertMoney.mockResolvedValue({ appliedRate: 0.9, targetAmount: 9 });
    const r = await resolvePrice({ amount: 10, sourceCurrency: "USD", compareAtAmount: 20, displayCurrency: "EUR" });
    expect(r.price.amount).toBe(9);
    expect(r.compareAtPrice?.amount).toBe(9); // mock returns fixed targetAmount
    expect(r.price.sourceCurrency).toBe("USD");
  });
});
