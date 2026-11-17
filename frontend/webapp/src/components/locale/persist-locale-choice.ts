import { markLocaleChosenExplicitly } from "@/i18n/locale-by-country";

/**
 * Remember a language the visitor picked themselves, so the middleware keeps
 * them on it (an explicit choice outranks IP and browser language, see
 * src/lib/market/market.ts) and location-based switching leaves it alone.
 */
export function persistLocaleChoice(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
  const host = window.location.hostname;
  const sharedDomain = host === "lsevin.com" || host.endsWith(".lsevin.com") ? ";domain=.lsevin.com" : "";
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = `LSEVIN_LOCALE=${locale};path=/;max-age=31536000;samesite=lax${sharedDomain}${secure}`;
  markLocaleChosenExplicitly();
}
