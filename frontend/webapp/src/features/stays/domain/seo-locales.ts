/**
 * Which languages a stays page is indexable in. Dependency-free so the sitemap
 * (and its tests) can import it without pulling in UI or environment modules.
 */
export const STAY_INDEXABLE_LOCALES = ["fa", "en"] as const;

/** A property page is indexable in a language only when its own name exists in it. */
export function propertyLocales(nameKeys: string[]): ("fa" | "en")[] {
  const out: ("fa" | "en")[] = [];
  if (nameKeys.some((k) => k.startsWith("fa"))) out.push("fa");
  if (nameKeys.some((k) => k.startsWith("en"))) out.push("en");
  return out.length ? out : ["fa"];
}
