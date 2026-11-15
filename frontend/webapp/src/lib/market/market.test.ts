import { describe, expect, it } from "vitest";

import {
  countryFromHeaders,
  displayCurrencyFor,
  languageFromAcceptLanguage,
  normalizeCountry,
  resolveFirstLanguage,
  resolvePriceTier,
} from "./market";

const headers = (values: Record<string, string>) => new Headers(values);

describe("first language of a visitor at the site root", () => {
  it("their own choice always wins", () => {
    expect(resolveFirstLanguage({ chosen: "fa", ipCountry: "TR", acceptLanguage: "tr" })).toEqual({ language: "fa", source: "choice" });
  });

  // Reported 2026-11-14: a Turkish visitor in a private window got Persian.
  it("then the IP country: Turkey -> Turkish, Iran -> Persian, Arab countries -> Arabic", () => {
    expect(resolveFirstLanguage({ ipCountry: "TR" })).toEqual({ language: "tr", source: "ip" });
    expect(resolveFirstLanguage({ ipCountry: "IR", acceptLanguage: "en-US" })).toEqual({ language: "fa", source: "ip" });
    for (const country of ["AE", "IQ", "OM", "SA", "KW", "QA", "BH"]) {
      expect(resolveFirstLanguage({ ipCountry: country }).language).toBe("ar");
    }
  });

  it("IP beats the browser language (browser Persian, network Turkey -> Turkish)", () => {
    expect(resolveFirstLanguage({ ipCountry: "TR", acceptLanguage: "fa-IR,fa;q=0.9" }).language).toBe("tr");
    expect(resolveFirstLanguage({ ipCountry: "AE", acceptLanguage: "en-US" }).language).toBe("ar");
  });

  it("a country we don't switch into falls to the browser language, then the phone, then English", () => {
    expect(resolveFirstLanguage({ ipCountry: "DE", acceptLanguage: "fa,en;q=0.5" })).toEqual({ language: "fa", source: "browser" });
    expect(resolveFirstLanguage({ ipCountry: "DE", acceptLanguage: "de-DE", phoneCountry: "IR" })).toEqual({ language: "fa", source: "phone" });
    expect(resolveFirstLanguage({ ipCountry: "DE", acceptLanguage: "de-DE" })).toEqual({ language: "en", source: "ip" });
  });

  it("unknown country (Cloudflare XX / Tor T1) and nothing else -> Persian", () => {
    expect(resolveFirstLanguage({ ipCountry: "XX" })).toEqual({ language: "fa", source: "default" });
    expect(resolveFirstLanguage({ ipCountry: "T1", acceptLanguage: "" })).toEqual({ language: "fa", source: "default" });
  });

  it("reads Accept-Language by q-value", () => {
    expect(languageFromAcceptLanguage("de;q=1,tr;q=0.8,en;q=0.9")).toBe("en");
    expect(languageFromAcceptLanguage("ar-AE")).toBe("ar");
    expect(languageFromAcceptLanguage("xx, yy")).toBeNull();
  });
});

describe("country from the edge", () => {
  it("prefers Cloudflare's visitor country over Caddy's (which is Cloudflare's own)", () => {
    expect(countryFromHeaders(headers({ "cf-ipcountry": "TR", "x-country": "DE" }))).toBe("TR");
    expect(countryFromHeaders(headers({ "x-country": "IR" }))).toBe("IR");
    expect(countryFromHeaders(headers({ "cf-ipcountry": "XX", "x-country": "IR" }))).toBe("IR");
    expect(countryFromHeaders(headers({}))).toBeNull();
    expect(normalizeCountry("t1")).toBeNull();
  });
});

describe("display currency follows the language", () => {
  it("Persian toman, Turkish lira, English dollar", () => {
    expect(displayCurrencyFor({ language: "fa", country: "TR" })).toBe("IRT");
    expect(displayCurrencyFor({ language: "tr", country: "IR" })).toBe("TRY");
    expect(displayCurrencyFor({ language: "en", country: "AE" })).toBe("USD");
  });

  it("Arabic is a language, not a currency: the Arab market decides", () => {
    expect(displayCurrencyFor({ language: "ar", country: "AE" })).toBe("AED");
    expect(displayCurrencyFor({ language: "ar", country: "IQ" })).toBe("IQD");
    expect(displayCurrencyFor({ language: "ar", country: "OM" })).toBe("OMR");
    expect(displayCurrencyFor({ language: "ar", country: "TR" })).toBe("AED");
  });

  it("a currency picked in the same language wins; one picked in another language does not", () => {
    expect(displayCurrencyFor({ language: "tr", picked: { currency: "eur", language: "tr" } })).toBe("EUR");
    expect(displayCurrencyFor({ language: "fa", picked: { currency: "EUR", language: "tr" } })).toBe("IRT");
  });
});

describe("price tier does not follow the currency", () => {
  it("signed in: the phone country decides", () => {
    expect(resolvePriceTier({ phoneCountry: "IR", ipCountry: "DE", language: "tr" })).toEqual({ tier: "domestic", source: "phone" });
    expect(resolvePriceTier({ phoneCountry: "TR", ipCountry: "IR", language: "fa" })).toEqual({ tier: "international", source: "phone" });
  });

  it("guest: Iranian IP or Persian page is domestic; anyone else international", () => {
    expect(resolvePriceTier({ ipCountry: "IR", language: "en" }).tier).toBe("domestic");
    expect(resolvePriceTier({ ipCountry: "DE", language: "fa" }).tier).toBe("domestic");
    expect(resolvePriceTier({ ipCountry: "TR", language: "tr" }).tier).toBe("international");
    expect(resolvePriceTier({ language: "en" }).tier).toBe("international");
  });
});
