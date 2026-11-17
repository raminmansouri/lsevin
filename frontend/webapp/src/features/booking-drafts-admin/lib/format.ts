import { formatCurrencyAmount } from "@/features/finance/lib/money";

/** Same locale map the customer invoice uses: fa -> fa-IR gives Persian digits and the Jalali calendar. */
export function resolveIntlLocale(locale?: string | null) {
  const map: Record<string, string> = {
    fa: "fa-IR", en: "en-US", ar: "ar-SA", tr: "tr-TR", de: "de-DE", fr: "fr-FR",
    es: "es-ES", ku: "ku-KU", ru: "ru-RU", tg: "tg-TJ", zh: "zh-CN",
  };
  const normalized = (locale || "fa").trim().toLowerCase();
  return map[normalized] || normalized || "fa-IR";
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, locale: string) {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return null;
  return formatCurrencyAmount(Number(amount), (currency || "USD").toUpperCase(), resolveIntlLocale(locale), { maximumFractionDigits: 2 });
}

export function formatNumber(value: number | null | undefined, locale: string) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number(value).toLocaleString(resolveIntlLocale(locale));
}

/** A plain YYYY-MM-DD is a calendar day: format it in UTC so no time zone moves it a day. */
export function formatDay(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** "HH:MM" wall-clock time, with locale digits. */
export function formatClock(value: string | null | undefined, locale: string) {
  if (!value || !/^\d{2}:\d{2}/.test(value)) return value || null;
  const date = new Date(`1970-01-01T${value.slice(0, 5)}:00Z`);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }).format(date);
}
