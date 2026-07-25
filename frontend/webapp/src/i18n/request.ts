import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively overlays a locale bundle on top of the English one.
 *
 * A one-level spread only falls back for namespaces the locale omits *entirely*.
 * The moment a locale declares a namespace it replaces the English one wholesale,
 * so every nested key it happens to be missing renders as a raw MISSING_MESSAGE
 * key path. That is not hypothetical here: de/es/fr/ku/tr each carry ~1,080 of
 * en.json's ~8,750 keys, spread across namespaces they *do* declare.
 *
 * Merging per key instead means a locale supplies whatever it has translated and
 * English fills every remaining gap — so a partially translated bundle degrades to
 * readable English rather than to `Common.buttons.save`.
 */
function mergeMessages(base: Messages, override: Messages): Messages {
  const merged: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = merged[key];

    if (isPlainObject(existing) && isPlainObject(value)) {
      merged[key] = mergeMessages(existing, value);
      continue;
    }

    // An empty string is an untranslated placeholder, not a translation — keep the
    // English text so the UI never renders a blank label.
    if (value === "" || value == null) continue;

    merged[key] = value;
  }

  return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment. Can be undefined for
  // requests outside the [locale] tree (root layout, not-found, some server
  // actions) — fall back to the default locale so we never try to import
  // `messages/undefined.json`, which throws and breaks rendering / sign-in.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const en = (await import(`../../messages/en.json`)).default as Messages;

  if (locale === "en") {
    return { locale, messages: en };
  }

  const current = (await import(`../../messages/${locale}.json`)).default as Messages;

  return {
    locale,
    messages: mergeMessages(en, current),
  };
});
