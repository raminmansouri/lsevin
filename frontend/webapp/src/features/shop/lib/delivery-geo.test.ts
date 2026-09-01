import { describe, expect, it } from "vitest";

import { applyGeoRules } from "./delivery-geo";

const base = { baseFee: 5, etaMin: 3, etaMax: 6, rules: {} as unknown };

describe("applyGeoRules (SHP-V03-012)", () => {
  it("no rules → served everywhere, fee/ETA unchanged", () => {
    expect(applyGeoRules(base, { country: "IR" })).toEqual({ baseFee: 5, etaMin: 3, etaMax: 6 });
  });

  it("no destination yet → method stays visible even with an allow-list", () => {
    const m = { ...base, rules: { geo: { includeCountries: ["IR"] } } };
    expect(applyGeoRules(m, {})).not.toBeNull();
  });

  it("excludeCountries wins and is case-insensitive", () => {
    const m = { ...base, rules: { geo: { excludeCountries: ["ru"] } } };
    expect(applyGeoRules(m, { country: "RU" })).toBeNull();
    expect(applyGeoRules(m, { country: "IR" })).not.toBeNull();
  });

  it("includeCountries allow-list blocks everything else", () => {
    const m = { ...base, rules: { geo: { includeCountries: ["IR", "TR"] } } };
    expect(applyGeoRules(m, { country: "TR" })).not.toBeNull();
    expect(applyGeoRules(m, { country: "AE" })).toBeNull();
  });

  it("includeRegions only filters when a region is supplied", () => {
    const m = { ...base, rules: { geo: { includeRegions: ["Tehran"] } } };
    expect(applyGeoRules(m, { country: "IR" })).not.toBeNull(); // no region → pass
    expect(applyGeoRules(m, { country: "IR", region: "Tehran" })).not.toBeNull();
    expect(applyGeoRules(m, { country: "IR", region: "Fars" })).toBeNull();
  });

  it("surcharge adds to base fee for matching country", () => {
    const m = { ...base, rules: { geo: { surcharges: [{ countries: ["GB"], amount: 8 }] } } };
    expect(applyGeoRules(m, { country: "GB" })?.baseFee).toBe(13);
    expect(applyGeoRules(m, { country: "IR" })?.baseFee).toBe(5);
  });

  it("etaOverrides replaces the ETA window for matching country", () => {
    const m = { ...base, rules: { geo: { etaOverrides: [{ countries: ["GB"], minDays: 7, maxDays: 14 }] } } };
    expect(applyGeoRules(m, { country: "GB" })).toEqual({ baseFee: 5, etaMin: 7, etaMax: 14 });
  });
});
