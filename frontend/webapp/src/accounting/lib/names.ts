/**
 * Resolving a display name out of a `name_translations` blob.
 *
 * The blob is not written with one key shape. The chart of accounts was seeded in
 * 0008 with region-tagged keys (`fa-IR`, `en-US`), the dimensions in 0014 with bare
 * ones (`fa`, `en`), and the panel asks for both under the single locale `fa`.
 *
 * A `->> 'fa'` lookup therefore misses every account name, and the caller falls back
 * to the code — which is why the entry form offered "1101001 — 1101001" instead of
 * the account's name. Matching the language subtag rather than the exact key is what
 * makes one lookup answer for both shapes.
 */
export function pickTranslatedName(
  translations: Record<string, string> | null | undefined,
  locale: string,
  fallback: string
): string {
  if (!translations) return fallback;

  const language = locale.split("-")[0]?.toLowerCase() ?? locale.toLowerCase();

  const byLanguage = (want: string): string | undefined => {
    for (const [key, value] of Object.entries(translations)) {
      if (!value?.trim()) continue;
      if (key.split("-")[0]?.toLowerCase() === want) return value;
    }
    return undefined;
  };

  const first = Object.values(translations).find((value) => Boolean(value?.trim()));

  return byLanguage(language) ?? byLanguage("fa") ?? byLanguage("en") ?? first ?? fallback;
}
