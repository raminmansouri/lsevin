import { PANEL_TIME_ZONE } from "../../doctor-panel-types";

/** Persian visitors get the Persian calendar; everyone sees Tehran time. */
function intlLocale(locale: string) {
  return locale.toLowerCase().startsWith("fa") ? "fa-IR-u-ca-persian" : locale;
}

export function formatSessionDate(locale: string, iso: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: PANEL_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatSessionTime(locale: string, iso: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: PANEL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Tehran calendar day, for grouping a list by date. */
export function sessionDayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PANEL_TIME_ZONE }).format(new Date(iso));
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
