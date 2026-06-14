export type AdminLocalizedInputValue = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeLocalizedContentForDatabase(
  value: unknown,
  locale = "fa-IR",
  supportedLocales: readonly string[] = ["en-US", "fa-IR"],
): AdminLocalizedInputValue {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isRecord(parsed)) {
        return normalizeLocalizedContentForDatabase(parsed, locale, supportedLocales);
      }
    } catch {
      return { [locale]: trimmed };
    }

    return { [locale]: trimmed };
  }

  if (!isRecord(value)) return {};

  const result: AdminLocalizedInputValue = {};
  for (const key of supportedLocales) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      result[key] = candidate.trim();
    }
  }

  for (const [key, candidate] of Object.entries(value)) {
    if (typeof candidate === "string" && candidate.trim()) {
      result[key] = candidate.trim();
    }
  }

  return result;
}

export function toLocalizedInputValue(
  value: unknown,
  locale = "fa-IR",
  supportedLocales: readonly string[] = ["en-US", "fa-IR"],
): AdminLocalizedInputValue {
  const normalized = normalizeLocalizedContentForDatabase(
    value,
    locale,
    supportedLocales,
  );

  for (const supportedLocale of supportedLocales) {
    if (!(supportedLocale in normalized)) normalized[supportedLocale] = "";
  }

  if (!(locale in normalized)) normalized[locale] = "";

  return normalized;
}

export function parseJsonObject(value?: string | null): Record<string, unknown> {
  const trimmed = value?.trim();
  if (!trimmed) return {};

  const parsed = JSON.parse(trimmed) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("JSON value must be an object.");
  }

  return parsed;
}
