import type { PermissionStatusValue } from "./types";

type Translate = (key: string, values?: Record<string, unknown>) => string;

export function formatRelativeActivity(value: string | Date, t: Translate): string {
  const input = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - input.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  if (diffMin < 1) return t("relativeTime.activeNow");
  if (diffMin < 60) return t("relativeTime.minutesAgo", { count: diffMin });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return t("relativeTime.hoursAgo", { count: diffHr });
  const diffDay = Math.round(diffHr / 24);
  return t("relativeTime.daysAgo", { count: diffDay });
}

export function formatLocation(city: string | null, country: string | null, fallback: string): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return fallback;
}

export function permissionBadgeLabel(value: PermissionStatusValue, t: Translate): string {
  switch (value) {
    case "granted": return t("badge.granted");
    case "denied": return t("badge.denied");
    case "prompt": return t("badge.prompt");
    case "unsupported": return t("badge.unsupported");
    default: return t("badge.unknown");
  }
}

export function permissionHelpText(kind: "location" | "notification", value: PermissionStatusValue, t: Translate): string {
  if (value === "granted" || value === "denied" || value === "prompt" || value === "unsupported") {
    return t(`helpText.${kind}.${value}`);
  }
  return t("helpText.unknown");
}
