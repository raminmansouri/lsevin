import { AUTO_LOCALES, languageForCountry } from "@/lib/market/market";

/**
 * Country -> language rules live in src/lib/market/market.ts (one place for the
 * middleware, prices and the client). Kept here for existing imports.
 */
export { AUTO_LOCALES };

/** Used whenever a country has no language we switch into automatically. */
export const DEFAULT_AUTO_LOCALE = "en";

/** The app locale for a visitor located in `countryCode` (English when none). */
export function localeForCountry(countryCode?: string | null): string {
  return languageForCountry(countryCode) ?? DEFAULT_AUTO_LOCALE;
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
