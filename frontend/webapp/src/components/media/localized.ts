import { DEFAULT_MEDIA_LOCALES, LocalizedText } from "./types";

export function createEmptyLocalizedContent(
  locales: readonly string[] = DEFAULT_MEDIA_LOCALES
): LocalizedText {
  return locales.reduce<LocalizedText>((acc, locale) => {
    acc[locale] = "";
    return acc;
  }, {});
}

export function normalizeLocalizedFields(
  value: unknown,
  locales: readonly string[] = DEFAULT_MEDIA_LOCALES
): LocalizedText {
  const empty = createEmptyLocalizedContent(locales);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return empty;
  }

  const source = value as Record<string, unknown>;

  for (const locale of locales) {
    const raw = source[locale];
    empty[locale] = typeof raw === "string" ? raw : "";
  }

  for (const [key, raw] of Object.entries(source)) {
    if (!(key in empty) && typeof raw === "string") {
      empty[key] = raw;
    }
  }

  return empty;
}

export function getLocalizedValue(
  value: LocalizedText | null | undefined,
  locale: string,
  fallbackLocales: string[] = ["en", "fa", "ar", "tr"]
): string {
  if (!value) return "";

  const direct = value[locale];
  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  for (const fallback of fallbackLocales) {
    const candidate = value[fallback];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  const first = Object.values(value).find(
    (entry) => typeof entry === "string" && entry.trim()
  );

  return first ?? "";
}

export function isLocalizedTextEmpty(value: LocalizedText | null | undefined): boolean {
  if (!value) return true;
  return Object.values(value).every((entry) => !entry?.trim());
}
