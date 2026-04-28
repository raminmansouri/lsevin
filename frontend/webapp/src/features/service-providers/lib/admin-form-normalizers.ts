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
    "id",
    "mediaId",
    "media_id",
    "fileId",
    "file_id",
    "assetId",
    "asset_id",
    "storedName",
    "stored_name",
    "storageKey",
    "storage_key",
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
    "key",
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

function normalizeTranslationScalar(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  // LocalizedInput with richText can return the Lexical editor state as an object.
  // The database stores localized values as text, so keep the Lexical JSON as a string.
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function normalizeAdminLocalizedContent(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const source = (value as Record<string, unknown>).translations && typeof (value as Record<string, unknown>).translations === "object"
    ? (value as Record<string, unknown>).translations as Record<string, unknown>
    : value as Record<string, unknown>;

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
  return String(locale || "").trim().replace("_", "-");
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

/**
 * LocalizedInput expects `{ translations: { "fa-IR": "..." } }`, not a raw JSONB map.
 * The database stores raw JSONB maps such as `{ "fa-IR": "..." }`, so this adapter
 * wraps DB values for the form. If an old row uses a base key such as `fa`, it is
 * promoted to the regional key used by the shared component, such as `fa-IR`.
 */
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

  // LocalizedInput renders exactly the keys from SUPPORTED_LOCALE_HEADERS.
  // Some projects use base keys like "fa" while the DB stores "fa-IR".
  // Other projects use regional keys like "fa-IR". Feed the component the
  // configured keys so edit forms never render empty for valid JSONB.
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

/**
 * Before saving, collapse base-locale aliases back to regional DB keys.
 * Example: fa -> fa-IR, en -> en-US.
 */
export function normalizeLocalizedContentForDatabase(value: unknown): Record<string, string> {
  const source = normalizeAdminLocalizedContent(value);
  const result: Record<string, string> = {};

  for (const [key, localeValue] of Object.entries(source)) {
    const normalizedValue = normalizeTranslationScalar(localeValue);
    if (!normalizedValue) continue;

    const normalizedKey = normalizeLocaleKey(key);
    const base = baseLocale(normalizedKey);
    const targetKey = normalizedKey.includes("-")
      ? preferredRegionalLocale(normalizedKey)
      : DEFAULT_REGIONAL_LOCALE_BY_BASE[base] || normalizedKey;

    if (!result[targetKey]) result[targetKey] = normalizedValue;
  }

  return result;
}

export function normalizeOptionalLocalizedContentForDatabase(value: unknown): Record<string, string> | null {
  const normalized = normalizeLocalizedContentForDatabase(value);
  return Object.keys(normalized).length ? normalized : null;
}
