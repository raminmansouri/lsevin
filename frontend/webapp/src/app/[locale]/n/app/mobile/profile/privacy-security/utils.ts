import type { PermissionStatusValue } from "./types";

export function formatRelativeActivity(value: string | Date): string {
  const input = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - input.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  if (diffMin < 1) return "Active now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export function formatLocation(city: string | null, country: string | null, fallback = "Unknown location"): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return fallback;
}

export function permissionBadgeLabel(value: PermissionStatusValue): string {
  switch (value) {
    case "granted": return "Allowed";
    case "denied": return "Blocked";
    case "prompt": return "Ask";
    case "unsupported": return "Unsupported";
    default: return "Unknown";
  }
}

export function permissionHelpText(kind: "location" | "notification", value: PermissionStatusValue): string {
  if (value === "granted") return kind === "location" ? "Browser location access is enabled on this device." : "Browser notifications are enabled on this device.";
  if (value === "denied") return kind === "location" ? "Location access is blocked in the browser or OS settings." : "Notifications are blocked in the browser or OS settings.";
  if (value === "prompt") return kind === "location" ? "The browser can still ask for location access." : "The browser can still ask for notification access.";
  if (value === "unsupported") return kind === "location" ? "This browser does not expose location permission status." : "This browser does not support the Notification API.";
  return "Permission state has not been read yet on this device.";
}
