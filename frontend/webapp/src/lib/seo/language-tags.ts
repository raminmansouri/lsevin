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

const RTL = new Set(["fa", "ar", "ku"]);
export const directionFor = (locale: string) => (RTL.has(locale) ? "rtl" : "ltr");
