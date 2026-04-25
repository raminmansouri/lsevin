import type { AdminFieldConfig } from "../types";

export const DEFAULT_LOCALIZED_CONTENT: Record<string, string> = {
  "ar-SA": "",
  "de-DE": "",
  "en-US": "",
  "es-ES": "",
  "fa-IR": "",
  "fr-FR": "",
  "ku-KU": "",
  "tr-TR": "",
};

function looksLikeRichLocalizedColumn(name: string) {
  const lower = name.toLowerCase();
  return lower.includes("description") || lower.includes("biography") || lower.includes("detail") || lower.includes("body") || lower.includes("content");
}

export function getFieldKind(field: AdminFieldConfig) {
  if (field.kind) return field.kind;
  const name = field.name.toLowerCase();
  if (name.endsWith("_translations")) return looksLikeRichLocalizedColumn(name) ? "localized-rich" : "localized";
  if (name.includes("image") || name.includes("thumbnail")) return "media-single";
  if (name.includes("video")) return "media-single";
  if (name.includes("file") || name.includes("url") || name.includes("media")) return "media-single";
  if (name.endsWith("_at") || name.endsWith("_date") || name.includes("created") || name.includes("modified")) return "datetime";
  if (name.startsWith("is_") || name.endsWith("_enabled")) return "boolean";
  return "text";
}

export function isLocalizedField(field: AdminFieldConfig) {
  const kind = getFieldKind(field);
  return kind === "localized" || kind === "localized-rich";
}

export function normalizeLocalizedValue(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...DEFAULT_LOCALIZED_CONTENT, ...(raw as Record<string, unknown>) };
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...DEFAULT_LOCALIZED_CONTENT, ...(parsed as Record<string, unknown>) };
      }
    } catch {
      return { ...DEFAULT_LOCALIZED_CONTENT, "en-US": raw };
    }
  }

  return { ...DEFAULT_LOCALIZED_CONTENT };
}

export function serializeDefaultValue(field: AdminFieldConfig) {
  if (field.defaultValue !== undefined) {
    return isLocalizedField(field) ? normalizeLocalizedValue(field.defaultValue) : field.defaultValue;
  }

  const kind = getFieldKind(field);
  if (kind === "boolean") return false;
  if (kind === "localized" || kind === "localized-rich") return { ...DEFAULT_LOCALIZED_CONTENT };
  if (kind === "json") return "{}";
  if (kind === "array") return "";
  return "";
}

export function coerceFieldValue(field: AdminFieldConfig, raw: unknown) {
  const kind = getFieldKind(field);
  if (raw === undefined) return undefined;

  if (kind === "localized" || kind === "localized-rich") {
    return normalizeLocalizedValue(raw);
  }

  if (raw === "" || raw === null) {
    return field.required ? raw : null;
  }

  if (kind === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  if (kind === "boolean") {
    return raw === true || raw === "true" || raw === "on" || raw === "1";
  }

  if (kind === "json") {
    if (typeof raw !== "string") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`${field.name} must be valid JSON.`);
    }
  }

  if (kind === "array") {
    if (Array.isArray(raw)) return raw;
    return String(raw)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return raw;
}

export function rowToFormValues(fields: AdminFieldConfig[], row?: Record<string, unknown>) {
  return Object.fromEntries(
    fields
      .filter((field) => !field.hidden)
      .map((field) => {
        const raw = row?.[field.name];
        const kind = getFieldKind(field);
        if (raw === null || raw === undefined) return [field.name, serializeDefaultValue(field)];
        if (kind === "localized" || kind === "localized-rich") return [field.name, normalizeLocalizedValue(raw)];
        if (kind === "json") return [field.name, JSON.stringify(raw, null, 2)];
        if (kind === "array" && Array.isArray(raw)) return [field.name, raw.join(", ")];
        if (kind === "datetime") return [field.name, String(raw).slice(0, 16)];
        return [field.name, raw];
      })
  );
}

function normalizeLocale(locale: string) {
  return locale.toLowerCase().replace("_", "-");
}

function baseLocale(locale: string) {
  return normalizeLocale(locale).split("-")[0];
}

export function getLocalizedDisplayValue(value: unknown, locale = "en-US", fallbackLocale = "fa-IR") {
  const translations = normalizeLocalizedValue(value);
  const direct = translations[locale];
  if (direct !== null && direct !== undefined && String(direct).trim()) return direct;

  const normalized = normalizeLocale(locale);
  const normalizedMatch = Object.entries(translations).find(([key, entry]) => normalizeLocale(key) === normalized && entry !== null && entry !== undefined && String(entry).trim());
  if (normalizedMatch) return normalizedMatch[1];

  const base = baseLocale(locale);
  const baseMatch = Object.entries(translations).find(([key, entry]) => baseLocale(key) === base && entry !== null && entry !== undefined && String(entry).trim());
  if (baseMatch) return baseMatch[1];

  const fallback = translations[fallbackLocale];
  if (fallback !== null && fallback !== undefined && String(fallback).trim()) return fallback;

  const fallbackBase = baseLocale(fallbackLocale);
  const fallbackBaseMatch = Object.entries(translations).find(([key, entry]) => baseLocale(key) === fallbackBase && entry !== null && entry !== undefined && String(entry).trim());
  if (fallbackBaseMatch) return fallbackBaseMatch[1];

  const first = Object.values(translations).find((entry) => entry !== null && entry !== undefined && String(entry).trim());
  return first ?? "";
}
