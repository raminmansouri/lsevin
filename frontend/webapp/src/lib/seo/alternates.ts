import { env } from "@/config/env/client";
import { routing } from "@/i18n/routing";

/**
 * The app serves the same page under eleven locale prefixes. Without a canonical
 * and an hreflang set, a crawler sees eleven unrelated URLs with near-identical
 * markup and has to guess which one to rank — the textbook duplicate-content
 * split. These helpers emit both from one place so every public page agrees.
 *
 * `path` is always the locale-less path with a leading slash ("" for the home
 * page), e.g. "/consulting" or `/service-providers/${id}`.
 */

const base = env.NEXT_PUBLIC_URL.replace(/\/$/, "");

export const absoluteUrl = (locale: string, path = "") => `${base}/${locale}${path}`;

/**
 * hreflang map for one path across every locale, plus the x-default that tells a
 * crawler which URL to serve when no declared language matches the user.
 */
export const languageAlternates = (path = ""): Record<string, string> => {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return languages;
};

/**
 * Drop into a page's `generateMetadata` return value. The canonical points at the
 * locale actually being rendered — self-referencing canonicals are what let each
 * translation rank in its own market instead of collapsing into one.
 */
export const alternatesFor = (locale: string, path = "") => ({
  canonical: absoluteUrl(locale, path),
  languages: languageAlternates(path),
});
