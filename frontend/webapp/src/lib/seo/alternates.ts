import "server-only";
import { routing } from "@/i18n/routing";
import { seoOrigin } from "./origin";

export type SeoLocale = (typeof routing.locales)[number];

function assertLocale(locale: string): asserts locale is SeoLocale {
  if (!(routing.locales as readonly string[]).includes(locale)) throw new Error("Unsupported SEO locale");
}

/** Locale-less path; strips tracking and fragments and encodes each segment once. */
export function normalizeSeoPath(path: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//") || path.includes("\\")) {
    throw new Error("SEO path must be a local locale-less path");
  }
  const segments = path.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  return segments.map(segment => {
    let decoded: string;
    try { decoded = decodeURIComponent(segment); } catch { throw new Error("Invalid SEO path encoding"); }
    if (decoded === "." || decoded === ".." || /[\u0000-\u001f\u007f]/u.test(decoded)) throw new Error("Invalid SEO path segment");
    return `/${encodeURIComponent(decoded)}`;
  }).join("");
}

export function absoluteUrl(locale: string, path = ""): string {
  assertLocale(locale);
  return `${seoOrigin()}/${locale}${normalizeSeoPath(path)}`;
}

/** Existing callers retain routed locales; provenance-aware callers can narrow eligibility. */
export function languageAlternates(path = "", eligibleLocales: readonly SeoLocale[] = routing.locales): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of eligibleLocales) languages[locale] = absoluteUrl(locale, path);
  if (eligibleLocales.includes(routing.defaultLocale)) languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return languages;
}

export const alternatesFor = (locale: string, path = "", eligibleLocales?: readonly SeoLocale[]) => ({
  canonical: absoluteUrl(locale, path),
  languages: languageAlternates(path, eligibleLocales),
});
