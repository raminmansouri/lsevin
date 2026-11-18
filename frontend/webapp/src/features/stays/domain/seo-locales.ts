import { STAY_UI_LOCALES, type StayUiLocale } from "./locales";

/**
 * Which languages a stays page is indexable in. Dependency-free so the sitemap
 * (and its tests) can import it without pulling in UI or environment modules.
 * The app (all labels, cities, amenities) is translated into every platform language.
 */
export const STAY_INDEXABLE_LOCALES = STAY_UI_LOCALES;

/** A property page is indexable in a language only when its own name exists in it. */
export function propertyLocales(nameKeys: string[]): StayUiLocale[] {
  const bases = new Set(nameKeys.map((k) => k.toLowerCase().split("-")[0]));
  const out = STAY_UI_LOCALES.filter((l) => bases.has(l));
  return out.length ? out : ["fa"];
}
