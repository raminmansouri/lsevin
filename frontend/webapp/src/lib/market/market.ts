/**
 * The visitor's market: which language a first visit opens in, which currency
 * prices are shown in, and whether the domestic (Iranian) or the international
 * price applies. One place for these rules, read by the middleware, the server
 * price resolver and the client price components.
 *
 * Three things are kept apart on purpose:
 *   - language      — the interface language (the URL's /<locale>);
 *   - display currency — follows the language (Persian -> toman, Turkish -> TRY,
 *     Arabic -> the visitor's Arab-country currency, ...), unless the visitor
 *     picked a currency in that same language;
 *   - price tier    — domestic or international. Decided by who the visitor is
 *     (phone number when signed in, else IP country or Persian UI), never by the
 *     currency they view, so switching language can't change what is charged.
 *
 * Client-safe: no server imports.
 */

import { routing } from "@/i18n/routing";

export type Locale = (typeof routing.locales)[number];
export type PriceTier = "domestic" | "international";

const LOCALES = routing.locales as readonly string[];

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value) && LOCALES.includes(value as string);
}

/**
 * Languages a visitor may be switched into automatically. Turkish joined on
 * 2026-11-14 once its customer-facing strings were complete; the others still
 * fall back to English for large parts of the interface.
 */
export const AUTO_LOCALES = new Set<string>(["fa", "ar", "en", "tr"]);

/** ISO-3166 country -> the app language spoken there. */
const COUNTRY_LANGUAGE: Record<string, string> = {
  IR: "fa", AF: "fa", TJ: "tg",
  TR: "tr", CY: "tr", AZ: "tr",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", QA: "ar", BH: "ar", OM: "ar",
  LB: "ar", SY: "ar", YE: "ar", PS: "ar", DZ: "ar", MA: "ar", TN: "ar", LY: "ar", SD: "ar",
  MR: "ar", SO: "ar", DJ: "ar", KM: "ar",
  DE: "de", AT: "de", CH: "de",
  FR: "fr", BE: "fr", LU: "fr", MC: "fr",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
  CN: "zh",
};

/** The language for a visitor in `country`, if it is one we switch into automatically. */
export function languageForCountry(country: string | null | undefined): string | null {
  const language = COUNTRY_LANGUAGE[(country || "").trim().toUpperCase()];
  return language && AUTO_LOCALES.has(language) && LOCALES.includes(language) ? language : null;
}

/**
 * The first supported language in an Accept-Language header, honouring q-values
 * ("tr-TR,tr;q=0.9,en;q=0.8" -> "tr"). Only automatic languages count.
 */
export function languageFromAcceptLanguage(header: string | null | undefined): string | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((item) => item.tag && item.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    // "ckb" (Sorani) is served as /ku.
    const language = base === "ckb" ? "ku" : base;
    if (AUTO_LOCALES.has(language) && LOCALES.includes(language)) return language;
  }
  return null;
}

/** A trustworthy ISO-3166 alpha-2 code, or null (Cloudflare uses XX and T1 for unknown and Tor). */
export function normalizeCountry(value: string | null | undefined): string | null {
  const code = (value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : null;
}

/**
 * The visitor's country from the edge, never from a third-party lookup:
 *   - lsevincare.com is behind Cloudflare, which sets CF-IPCountry from the
 *     visitor's own address (verified 2026-11-12: the sign-in page defaults to
 *     the caller's country);
 *   - lsevin.ir is behind ArvanCloud; Caddy's GeoIP sets X-Country there.
 * Caddy's X-Country on lsevincare.com is the Cloudflare server's country, so
 * Cloudflare's header always wins.
 */
export function countryFromHeaders(h: { get(name: string): string | null }): string | null {
  return normalizeCountry(h.get("cf-ipcountry")) ?? normalizeCountry(h.get("x-country"));
}

export type LanguageSource = "choice" | "ip" | "browser" | "phone" | "default";

/**
 * The language a visitor without one in the URL opens in. In order:
 *   1. their own choice (the language cookie, written by the switchers and when a
 *      signed-in user's saved preference is applied);
 *   2. the country of their IP;
 *   3. their browser language;
 *   4. the country of the phone number they signed up with;
 *   5. Persian.
 */
export function resolveFirstLanguage(input: {
  chosen?: string | null;
  ipCountry?: string | null;
  acceptLanguage?: string | null;
  phoneCountry?: string | null;
}): { language: string; source: LanguageSource } {
  if (isLocale(input.chosen)) return { language: input.chosen, source: "choice" };
  const fromIp = languageForCountry(normalizeCountry(input.ipCountry));
  if (fromIp) return { language: fromIp, source: "ip" };
  // A country we know but don't translate for (e.g. Germany) still prefers the
  // browser's language, then English over Persian.
  const fromBrowser = languageFromAcceptLanguage(input.acceptLanguage);
  if (fromBrowser) return { language: fromBrowser, source: "browser" };
  const fromPhone = languageForCountry(normalizeCountry(input.phoneCountry));
  if (fromPhone) return { language: fromPhone, source: "phone" };
  if (normalizeCountry(input.ipCountry)) return { language: "en", source: "ip" };
  return { language: routing.defaultLocale, source: "default" };
}

/** Currency of each Arab market; Arabic is a language, not a currency. */
const ARAB_MARKET_CURRENCY: Record<string, string> = {
  AE: "AED", IQ: "IQD", OM: "OMR", SA: "SAR", KW: "KWD", QA: "QAR", BH: "BHD",
};
const DEFAULT_ARABIC_CURRENCY = "AED";

/** Display currency per language (Persian shows toman; payment stays in rial). */
const LANGUAGE_CURRENCY: Record<string, string> = {
  fa: "IRT",
  tr: "TRY",
  en: "USD",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  ru: "RUB",
  zh: "CNY",
  ku: "IQD",
  tg: "USD",
};

/**
 * The currency prices are shown in for this language. An explicit pick made in
 * the same language wins (the shop's currency selector stores the language it
 * was picked in); Arabic follows the visitor's Arab-country market.
 */
export function displayCurrencyFor(input: {
  language: string;
  country?: string | null;
  picked?: { currency: string | null; language: string | null } | null;
}): string {
  const picked = input.picked;
  if (picked?.currency && picked.language === input.language) return picked.currency.toUpperCase();
  if (input.language === "ar") {
    return ARAB_MARKET_CURRENCY[normalizeCountry(input.country) ?? ""] ?? DEFAULT_ARABIC_CURRENCY;
  }
  return LANGUAGE_CURRENCY[input.language] ?? "USD";
}

/** Currency the site falls back to when a display currency has no exchange rate. */
export const FALLBACK_DISPLAY_CURRENCY = "USD";

export type TierSource = "phone" | "ip" | "language" | "default";

/**
 * Domestic (Iranian) or international price, decided by who the visitor is:
 *   1. signed in: the country of their phone number (as checkout uses);
 *   2. guest from an Iranian IP: domestic;
 *   3. guest viewing in Persian: domestic — most Iranians abroad browse through a
 *      VPN, so their IP says Germany; checkout re-decides from the phone number;
 *   4. everyone else: international.
 */
export function resolvePriceTier(input: {
  phoneCountry?: string | null;
  ipCountry?: string | null;
  language?: string | null;
}): { tier: PriceTier; source: TierSource } {
  const phone = normalizeCountry(input.phoneCountry);
  if (phone) return { tier: phone === "IR" ? "domestic" : "international", source: "phone" };
  if (normalizeCountry(input.ipCountry) === "IR") return { tier: "domestic", source: "ip" };
  if (input.language === "fa") return { tier: "domestic", source: "language" };
  return { tier: "international", source: normalizeCountry(input.ipCountry) ? "ip" : "default" };
}
