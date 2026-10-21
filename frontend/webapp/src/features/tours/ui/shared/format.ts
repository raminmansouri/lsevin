/**
 * Client-safe formatting helpers shared by the customer and admin tours UIs.
 *
 * Every number goes through Intl with the UI locale, so Persian screens show
 * Persian digits, Arabic screens Arabic-Indic digits and other locales Latin
 * digits (S-033, S-052). Amounts are never converted here: the currency passed
 * in is the currency that is actually charged.
 */

/** UI locale ("fa") → Intl locale tag. Persian is pinned to Persian digits. */
export function intlLocale(locale: string): string {
  const base = String(locale || "en").toLowerCase().split("-")[0];
  if (base === "fa") return "fa-IR";
  if (base === "ar") return "ar-SA";
  if (base === "ku") return "ckb-IQ";
  return locale || "en";
}

const moneyCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number | null | undefined, currency: string, locale: string, decimals?: number): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const tag = intlLocale(locale);
  const key = `${tag}|${currency}|${decimals ?? "d"}`;
  let nf = moneyCache.get(key);
  if (!nf) {
    try {
      nf = new Intl.NumberFormat(tag, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
        ...(decimals != null ? { minimumFractionDigits: 0, maximumFractionDigits: decimals } : {}),
      });
    } catch {
      nf = new Intl.NumberFormat(tag, { maximumFractionDigits: decimals ?? 2 });
    }
    moneyCache.set(key, nf);
  }
  return nf.format(amount);
}

export function formatNumber(value: number | null | undefined, locale: string, opts?: Intl.NumberFormatOptions): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), opts).format(value);
}

/** Formats an ISO instant (or HH:MM time-of-day) as a short clock time in a zone. */
export function formatClock(value: string, locale: string, timeZone?: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    return new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(
      new Date(Date.UTC(2000, 0, 1, h, m)),
    );
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit", timeZone }).format(d);
}

/** Display name of a language tag in the UI language ("en-US" → "English"). */
export function languageName(tag: string, uiLocale: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(uiLocale)], { type: "language" }).of(String(tag).split("-")[0]) ?? tag;
  } catch {
    return tag;
  }
}

/** Display name of a region code ("IR" → "Iran"). */
export function regionName(code: string, uiLocale: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(uiLocale)], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function currencyName(code: string, uiLocale: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(uiLocale)], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** A relative "x minutes ago" for freshness labels. */
export function formatRelative(instant: string, locale: string, now = Date.now()): string {
  const diff = (new Date(instant).getTime() - now) / 1000;
  if (!Number.isFinite(diff)) return "—";
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

/** Splits a provider-authored multi-line field ("a\nb\nc") into list items. */
export function lines(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}
