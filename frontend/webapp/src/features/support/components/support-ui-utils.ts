import { DEFAULT_SUPPORT_LABELS } from "../constants";
import type { SupportSettings } from "../types";

export function getSupportLabels(settings: SupportSettings, locale?: string) {
  const normalized = (locale || "en-US").replace("_", "-");
  const baseLocale = normalized.split("-")[0];
  const regionalFallback = baseLocale === "fa" ? "fa-IR" : baseLocale === "ar" ? "ar-SA" : undefined;
  const defaultKey = regionalFallback && regionalFallback in DEFAULT_SUPPORT_LABELS ? regionalFallback : "en-US";
  const defaults = DEFAULT_SUPPORT_LABELS[defaultKey as keyof typeof DEFAULT_SUPPORT_LABELS] || DEFAULT_SUPPORT_LABELS["en-US"];
  const candidates = [normalized, baseLocale, regionalFallback, "en-US", "fa-IR", "ar-SA"].filter(Boolean) as string[];
  for (const key of candidates) {
    if (settings.labels?.[key]) return { ...defaults, ...settings.labels[key] };
  }
  return defaults;
}

export function isRtlLocale(locale?: string) {
  return ["fa", "fa-IR", "ar", "ar-SA", "ku", "ku-KU"].includes(locale || "");
}

export function formatSupportTime(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getInitials(name?: string | null) {
  const clean = String(name || "Guest").trim();
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";
}
