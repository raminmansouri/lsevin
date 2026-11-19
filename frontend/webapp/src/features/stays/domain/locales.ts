/**
 * Every language the platform serves (routing.locales) and its content tag. Stays content
 * (names, descriptions, amenities, cities...) is edited and shown in all of them; a field
 * missing in a language falls back to English, then Persian — never Persian first, so a
 * Turkish or Russian visitor does not see Persian text where a translation is missing.
 * Dependency-free: imported by the sitemap, server code and client components alike.
 */
export const STAY_UI_LOCALES = ["fa", "en", "ar", "tr", "es", "ku", "de", "fr", "ru", "tg", "zh"] as const;
export type StayUiLocale = (typeof STAY_UI_LOCALES)[number];

/** Content tags in the order the admin editor shows them (Persian is the source language). */
export const STAY_CONTENT_LOCALES = ["fa-IR", "en-US", "ar-SA", "tr-TR", "es-ES", "ku-KU", "de-DE", "fr-FR", "ru-RU", "tg-TJ", "zh-CN"] as const;

/** Order tried when the requested language has no text. */
export const STAY_CONTENT_FALLBACKS = ["en-US", "fa-IR"];

/** Separator between items written inline ("Double room, breakfast"): Arabic-script, Chinese or Latin comma. */
export function listSeparator(locale: string): string {
  const base = locale.toLowerCase().split("-")[0];
  if (base === "fa" || base === "ar" || base === "ku") return "، ";
  if (base === "zh") return "，";
  return ", ";
}
