export function normalizeMediaPickerValue(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMediaPickerValue(item);
      if (normalized) return normalized;
    }
    return "";
  }

  if (!value || typeof value !== "object") return "";

  const item = value as Record<string, unknown>;
  const directKeys = [
    "fileUrl",
    "file_url",
    "publicUrl",
    "public_url",
    "downloadUrl",
    "download_url",
    "previewUrl",
    "preview_url",
    "thumbnailUrl",
    "thumbnail_url",
    "url",
    "src",
    "href",
    "path",
    "value",
    "storedName",
    "stored_name",
    "storageKey",
    "storage_key",
    "key",
    "id",
    "mediaId",
    "media_id",
    "fileId",
    "file_id",
    "assetId",
    "asset_id",
  ];

  for (const key of directKeys) {
    const candidate = item[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  const nestedKeys = [
    "media",
    "file",
    "asset",
    "selected",
    "item",
    "data",
    "record",
    "attachment",
    "payload",
    "result",
  ];

  for (const key of nestedKeys) {
    const normalized = normalizeMediaPickerValue(item[key]);
    if (normalized) return normalized;
  }

  return "";
}

function parseJsonObjectString(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // This is probably normal text or Lexical JSON content stored as a locale value.
  }

  return null;
}

function normalizeTranslationScalar(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  // LocalizedInput richText can return the Lexical editor state as an object.
  // PostgreSQL localized columns store locale values as text, so keep the
  // Lexical editor state as a JSON string.
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getLocalizedSource(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  // Some PostgreSQL/client layers return jsonb as a JSON string. The edit form
  // must still hydrate from '{"fa-IR":"..."}'.
  if (typeof value === "string") {
    return parseJsonObjectString(value);
  }

  if (Array.isArray(value) || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const translations = record.translations;

  if (typeof translations === "string") {
    return parseJsonObjectString(translations) || null;
  }

  if (translations && typeof translations === "object" && !Array.isArray(translations)) {
    return translations as Record<string, unknown>;
  }

  return record;
}

export function normalizeAdminLocalizedContent(value: unknown): Record<string, string> {
  const source = getLocalizedSource(value);
  if (!source) return {};

  const result: Record<string, string> = {};

  for (const [locale, localeValue] of Object.entries(source)) {
    if (!locale || locale === "translations") continue;
    const normalized = normalizeTranslationScalar(localeValue);
    if (normalized) result[locale] = normalized;
  }

  return result;
}

export function normalizeOptionalAdminLocalizedContent(value: unknown): Record<string, string> | null {
  const normalized = normalizeAdminLocalizedContent(value);
  return Object.keys(normalized).length ? normalized : null;
}

const DEFAULT_REGIONAL_LOCALE_BY_BASE: Record<string, string> = {
  ar: "ar-SA",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fa: "fa-IR",
  fr: "fr-FR",
  ku: "ku-KU",
  tr: "tr-TR",
};

function normalizeLocaleKey(locale: string) {
  return String(locale || "").trim().replaceAll("_", "-");
}

function baseLocale(locale: string) {
  return normalizeLocaleKey(locale).split("-")[0]?.toLowerCase() || "";
}

function preferredRegionalLocale(locale?: string | null) {
  const normalized = normalizeLocaleKey(locale || "");
  if (!normalized) return "en-US";
  if (normalized.includes("-")) {
    const [base, region] = normalized.split("-");
    return `${base.toLowerCase()}-${String(region || "").toUpperCase()}`;
  }
  return DEFAULT_REGIONAL_LOCALE_BY_BASE[normalized.toLowerCase()] || normalized;
}

function findLocaleValue(source: Record<string, unknown>, locale?: string | null) {
  const regional = preferredRegionalLocale(locale);
  const base = baseLocale(regional || locale || "");
  const candidates = [regional, locale ? normalizeLocaleKey(locale) : "", base].filter(Boolean);

  for (const key of candidates) {
    const exact = source[key];
    if (exact !== undefined && exact !== null && String(exact).trim()) return exact;
  }

  const normalizedRegional = regional.toLowerCase();
  const exactKey = Object.keys(source).find((key) => normalizeLocaleKey(key).toLowerCase() === normalizedRegional);
  if (exactKey && source[exactKey] !== undefined && source[exactKey] !== null && String(source[exactKey]).trim()) return source[exactKey];

  if (base) {
    const baseKey = Object.keys(source).find((key) => baseLocale(key) === base);
    if (baseKey && source[baseKey] !== undefined && source[baseKey] !== null && String(source[baseKey]).trim()) return source[baseKey];
  }

  const fallbackKey = Object.keys(source).find((key) => baseLocale(key) === "en");
  if (fallbackKey && source[fallbackKey] !== undefined && source[fallbackKey] !== null && String(source[fallbackKey]).trim()) return source[fallbackKey];

  return Object.values(source).find((value) => value !== undefined && value !== null && String(value).trim());
}

export type AdminLocalizedInputValue = {
  translations: Record<string, string>;
};

function sameLocaleFamily(left: string, right: string) {
  const a = normalizeLocaleKey(left).toLowerCase();
  const b = normalizeLocaleKey(right).toLowerCase();
  if (!a || !b) return false;
  return a === b || baseLocale(a) === baseLocale(b);
}

function localizedInputKeysForSourceKey(
  sourceKey: string,
  supportedLocales?: readonly string[] | null
) {
  const normalizedKey = normalizeLocaleKey(sourceKey);
  const base = baseLocale(normalizedKey);
  const regional = normalizedKey.includes("-")
    ? preferredRegionalLocale(normalizedKey)
    : DEFAULT_REGIONAL_LOCALE_BY_BASE[base] || normalizedKey;

  const keys: string[] = [];

  // LocalizedInput renders exactly supportedLocales. Feed every matching key
  // from the project config so rows stored as fa-IR still render when a project
  // uses fa, and vice versa.
  if (supportedLocales?.length) {
    for (const supportedLocale of supportedLocales) {
      if (sameLocaleFamily(String(supportedLocale), regional)) {
        keys.push(String(supportedLocale));
      }
    }
  }

  keys.push(regional);
  if (base) keys.push(base);

  return Array.from(new Set(keys.filter(Boolean)));
}

export function toLocalizedInputValue(
  value: unknown,
  currentLocale?: string | null,
  supportedLocales?: readonly string[] | null
): AdminLocalizedInputValue {
  const source = normalizeAdminLocalizedContent(value);
  const result: Record<string, string> = {};

  for (const [key, localeValue] of Object.entries(source)) {
    const normalizedValue = normalizeTranslationScalar(localeValue);
    if (!normalizedValue) continue;

    for (const targetKey of localizedInputKeysForSourceKey(key, supportedLocales)) {
      if (!result[targetKey]) result[targetKey] = normalizedValue;
    }
  }

  const currentRegional = preferredRegionalLocale(currentLocale);
  if (currentRegional) {
    const valueForCurrentLocale = findLocaleValue(source, currentLocale);
    if (valueForCurrentLocale !== undefined && valueForCurrentLocale !== null) {
      const normalizedValue = normalizeTranslationScalar(valueForCurrentLocale);
      if (normalizedValue) {
        for (const targetKey of localizedInputKeysForSourceKey(currentRegional, supportedLocales)) {
          if (!result[targetKey]) result[targetKey] = normalizedValue;
        }
      }
    }
  }

  return { translations: result };
}

type LocalizedDatabaseCandidate = {
  sourceKey: string;
  value: string;
  index: number;
  score: number;
};

function localePreferenceScore(
  sourceKey: string,
  index: number,
  currentLocale?: string | null,
  supportedLocales?: readonly string[] | null
) {
  const normalizedSource = normalizeLocaleKey(sourceKey);
  const sourceBase = baseLocale(normalizedSource);
  const currentNorm = normalizeLocaleKey(currentLocale || "");
  const currentRegional = currentNorm ? preferredRegionalLocale(currentNorm) : "";
  const currentBase = baseLocale(currentNorm || currentRegional);

  const supportedNorms = (supportedLocales || [])
    .map((item) => normalizeLocaleKey(String(item)))
    .filter(Boolean);

  // This mirrors LocalizedInput: it renders and writes only supportedLocales.
  // For route locale /fa and supported locale fa-IR, the edited key is fa-IR,
  // not fa. For projects that really support fa, the edited key is fa.
  const activeUiLocale =
    supportedNorms.find((item) => currentNorm && item.toLowerCase() === currentNorm.toLowerCase()) ||
    supportedNorms.find((item) => currentBase && sameLocaleFamily(item, currentBase)) ||
    currentRegional ||
    currentNorm;

  let score = 0;

  if (activeUiLocale && normalizedSource.toLowerCase() === activeUiLocale.toLowerCase()) score += 120;
  if (currentRegional && normalizedSource.toLowerCase() === currentRegional.toLowerCase()) score += 70;
  if (currentNorm && normalizedSource.toLowerCase() === currentNorm.toLowerCase()) score += 60;
  if (currentBase && sourceBase === currentBase) score += 40;

  for (const supportedNorm of supportedNorms) {
    if (normalizedSource.toLowerCase() === supportedNorm.toLowerCase()) score += 40;
    else if (sameLocaleFamily(normalizedSource, supportedNorm)) score += 10;
  }

  // Base aliases such as fa/en can still win when the UI itself is base-keyed.
  if (normalizedSource && !normalizedSource.includes("-")) score += 10;
  score += index / 1000;
  return score;
}

export function normalizeLocalizedContentForDatabase(
  value: unknown,
  currentLocale?: string | null,
  supportedLocales?: readonly string[] | null
): Record<string, string> {
  const source = normalizeAdminLocalizedContent(value);
  const candidatesByTarget: Record<string, LocalizedDatabaseCandidate[]> = {};

  Object.entries(source).forEach(([key, localeValue], index) => {
    const normalizedValue = normalizeTranslationScalar(localeValue);
    if (!normalizedValue) return;

    const normalizedKey = normalizeLocaleKey(key);
    const base = baseLocale(normalizedKey);
    const targetKey = normalizedKey.includes("-")
      ? preferredRegionalLocale(normalizedKey)
      : DEFAULT_REGIONAL_LOCALE_BY_BASE[base] || normalizedKey;

    if (!targetKey) return;

    const candidate: LocalizedDatabaseCandidate = {
      sourceKey: normalizedKey,
      value: normalizedValue,
      index,
      score: localePreferenceScore(normalizedKey, index, currentLocale, supportedLocales),
    };

    candidatesByTarget[targetKey] = candidatesByTarget[targetKey] || [];
    candidatesByTarget[targetKey].push(candidate);
  });

  const result: Record<string, string> = {};
  for (const [targetKey, candidates] of Object.entries(candidatesByTarget)) {
    const winner = [...candidates].sort((a, b) => b.score - a.score)[0];
    if (winner?.value) result[targetKey] = winner.value;
  }

  return result;
}

export function normalizeOptionalLocalizedContentForDatabase(
  value: unknown,
  currentLocale?: string | null,
  supportedLocales?: readonly string[] | null
): Record<string, string> | null {
  const normalized = normalizeLocalizedContentForDatabase(value, currentLocale, supportedLocales);
  return Object.keys(normalized).length ? normalized : null;
}

