/**
 * BCP 47 tags for routed locales where the URL code is not the right public
 * tag. The site's "ku" content is Sorani (Arabic script), whose tag is "ckb";
 * bare "ku" is read as Kurmanji. URLs keep /ku; only hreflang and
 * Content-Language change. Edge-safe: no server-only imports.
 */
const LANGUAGE_TAGS: Record<string, string> = { ku: "ckb" };

export const contentLanguageFor = (locale: string) => LANGUAGE_TAGS[locale] ?? locale;

/** The URL locale for a document language tag (<html lang>): "ckb" -> "ku". */
export const routeLocaleFor = (tag: string) =>
  Object.keys(LANGUAGE_TAGS).find((locale) => LANGUAGE_TAGS[locale] === tag) ?? tag;

/**
 * The hreflang code. Google reads hreflang as an ISO 639-1 language with an
 * optional ISO 15924 script and ISO 3166-1 region (Localized versions guide);
 * "ckb" is ISO 639-3 and is not one of them, so Sorani is announced as Kurdish
 * in Arabic script, "ku-Arab" (2026-11-15). <html lang> and Content-Language
 * keep "ckb", which is the precise BCP 47 tag.
 */
const HREFLANG_TAGS: Record<string, string> = { ku: "ku-Arab" };
export const hreflangFor = (locale: string) => HREFLANG_TAGS[locale] ?? contentLanguageFor(locale);

const RTL = new Set(["fa", "ar", "ku"]);
export const directionFor = (locale: string) => (RTL.has(locale) ? "rtl" : "ltr");
