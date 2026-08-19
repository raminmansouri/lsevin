import { DEFAULT_PORTAL_LOCALE_HEADER, portalLocaleHeader } from "@core/i18n/config";
import { currentPortalFormatContext } from "@core/i18n/format-context";

function localeHeader(locale?: string | null) {
  return portalLocaleHeader(locale || currentPortalFormatContext().locale || DEFAULT_PORTAL_LOCALE_HEADER);
}

export function formatMoney(amount: number | string | null | undefined, currency = "IRR", locale?: string | null) {
  const value = Number(amount ?? 0);
  const code = String(currency || "IRR").toUpperCase();
  try {
    return new Intl.NumberFormat(localeHeader(locale), {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "IRR" ? 0 : 2,
    }).format(value);
  } catch {
    return `${formatNumber(value, locale)} ${code}`;
  }
}

export function formatDateTime(
  value: string | Date | null | undefined,
  locale?: string | null,
  timeZone = currentPortalFormatContext().timeZone,
) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(localeHeader(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale?: string | null,
  timeZone = currentPortalFormatContext().timeZone,
) {
  if (!value) return "—";
  const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(localeHeader(locale), { dateStyle: "medium", timeZone: dateOnly ? "UTC" : timeZone }).format(date);
}

export function formatNumber(value: number | string | null | undefined, locale?: string | null) {
  return new Intl.NumberFormat(localeHeader(locale)).format(Number(value ?? 0));
}
