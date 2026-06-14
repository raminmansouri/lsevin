import type { TranslationMap } from "../types";

export const PORTAL_LOCALES = ["en-US", "fa-IR", "ar-SA", "tr-TR"] as const;

export function emptyTranslations(): TranslationMap {
  return Object.fromEntries(PORTAL_LOCALES.map((locale) => [locale, ""]));
}

export function translationFromFlat(
  en?: string | null,
  fa?: string | null,
  ar?: string | null,
  tr?: string | null,
): TranslationMap {
  const primary = (en || fa || ar || tr || "").trim();

  return {
    "en-US": (en || primary).trim(),
    "fa-IR": (fa || primary).trim(),
    "ar-SA": (ar || primary).trim(),
    "tr-TR": (tr || primary).trim(),
  };
}

export function displayTranslation(
  value?: TranslationMap | null,
  locale = "fa-IR",
  fallback = "-",
) {
  if (!value || typeof value !== "object") return fallback;

  const exact = value[locale]?.trim();
  if (exact) return exact;

  const normalizedLocale = locale.toLowerCase().replace("_", "-");
  const sameLocaleKey = Object.keys(value).find(
    (key) => key.toLowerCase().replace("_", "-") === normalizedLocale,
  );
  if (sameLocaleKey && value[sameLocaleKey]?.trim())
    return value[sameLocaleKey].trim();

  const base = normalizedLocale.split("-")[0];
  const sameBaseKey = Object.keys(value).find(
    (key) => key.toLowerCase().replace("_", "-").split("-")[0] === base,
  );
  if (sameBaseKey && value[sameBaseKey]?.trim())
    return value[sameBaseKey].trim();

  return (
    value["en-US"]?.trim() ||
    value["en"]?.trim() ||
    value["fa-IR"]?.trim() ||
    Object.values(value)
      .find((item) => typeof item === "string" && item.trim())
      ?.trim() ||
    fallback
  );
}

export function splitCsv(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinCsv(value?: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : "";
}

export function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

export function normalizeOptionalString(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : null;
}
