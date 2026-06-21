import { routing } from "./routing";

/**
 * Locales that are translated completely enough to switch a visitor into
 * automatically based on their detected location.
 *
 * The app ships message files for every locale in `routing.locales`, but only
 * `fa`, `ar` and `en` are fully translated — `tr`, `es`, `ku`, `de` and `fr`
 * are partial stubs that mostly fall back to English through the shallow message
 * merge in `i18n/request.ts`. Auto-switching a visitor into a half-translated
 * locale is worse than English, so visitors from those regions stay on English
 * until the translation is complete. Promote a locale by simply adding it here
 * once its `messages/<locale>.json` is finished.
 */
export const AUTO_LOCALES = new Set<string>(["fa", "ar", "en"]);

/** Used whenever a country has no fully-translated language we can switch to. */
export const DEFAULT_AUTO_LOCALE = "en";

/**
 * ISO-3166 alpha-2 country code → the app language primarily spoken there.
 * Only languages present in {@link AUTO_LOCALES} actually take effect; every
 * other country resolves to {@link DEFAULT_AUTO_LOCALE} (English). The non-auto
 * entries (tr/de/fr/es countries) are listed so that promoting them later is a
 * one-line change to AUTO_LOCALES rather than a fresh mapping.
 */
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // Persian
  IR: "fa",
  AF: "fa",
  // Arabic-speaking countries
  SA: "ar",
  AE: "ar",
  EG: "ar",
  IQ: "ar",
  JO: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
  LB: "ar",
  SY: "ar",
  YE: "ar",
  PS: "ar",
  DZ: "ar",
  MA: "ar",
  TN: "ar",
  LY: "ar",
  SD: "ar",
  MR: "ar",
  SO: "ar",
  DJ: "ar",
  KM: "ar",
  // Not yet fully translated → currently resolve to English (see AUTO_LOCALES).
  TR: "tr",
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
};

/**
 * The app locale to use for a visitor located in `countryCode`. Returns the
 * country's language when we have a complete translation for it, otherwise
 * English. Always returns a locale that exists in `routing.locales`.
 */
export function localeForCountry(countryCode?: string | null): string {
  const code = (countryCode || "").trim().toUpperCase();
  const language = COUNTRY_TO_LANGUAGE[code];

  if (
    language &&
    AUTO_LOCALES.has(language) &&
    (routing.locales as readonly string[]).includes(language)
  ) {
    return language;
  }

  return DEFAULT_AUTO_LOCALE;
}

// Remembers that the visitor explicitly picked a language from a switcher. Once
// set, location-based auto-switching never overrides their choice.
const EXPLICIT_LOCALE_KEY = "lsevin.locale.explicit.v1";

export function markLocaleChosenExplicitly() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXPLICIT_LOCALE_KEY, "1");
  } catch {
    // Best-effort; if storage is blocked the explicit choice still applies for
    // this navigation via the NEXT_LOCALE cookie, just not across auto-detection.
  }
}

export function hasExplicitLocaleChoice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXPLICIT_LOCALE_KEY) === "1";
  } catch {
    return false;
  }
}
