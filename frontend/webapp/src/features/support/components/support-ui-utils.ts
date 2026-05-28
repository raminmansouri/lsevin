import { DEFAULT_SUPPORT_LABELS } from "../constants";
import type { SupportSettings } from "../types";

export function getSupportLabels(settings: SupportSettings, locale?: string) {
  const normalized = locale || "en-US";
  const candidates = [normalized, normalized.replace("_", "-"), normalized.split("-")[0], "en-US", "fa-IR"];
  for (const key of candidates) {
    if (settings.labels?.[key]) return { ...DEFAULT_SUPPORT_LABELS["en-US"], ...settings.labels[key] };
  }
  return DEFAULT_SUPPORT_LABELS["en-US"];
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
