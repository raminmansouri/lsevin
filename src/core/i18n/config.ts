export const PORTAL_LOCALES = [
  { locale: "fa", header: "fa-IR", label: "فارسی", shortLabel: "فا", direction: "rtl" },
  { locale: "en", header: "en-US", label: "English", shortLabel: "EN", direction: "ltr" },
  { locale: "ar", header: "ar-SA", label: "العربية", shortLabel: "AR", direction: "rtl" },
  { locale: "tr", header: "tr-TR", label: "Türkçe", shortLabel: "TR", direction: "ltr" },
  { locale: "es", header: "es-ES", label: "Español", shortLabel: "ES", direction: "ltr" },
  { locale: "ku", header: "ku-KU", label: "کوردی", shortLabel: "KU", direction: "rtl" },
  { locale: "de", header: "de-DE", label: "Deutsch", shortLabel: "DE", direction: "ltr" },
  { locale: "fr", header: "fr-FR", label: "Français", shortLabel: "FR", direction: "ltr" },
] as const;

export type PortalLocale = (typeof PORTAL_LOCALES)[number]["locale"];
export type PortalLocaleHeader = (typeof PORTAL_LOCALES)[number]["header"];
export type PortalDirection = "rtl" | "ltr";

export const DEFAULT_PORTAL_LOCALE: PortalLocale = "fa";
export const DEFAULT_PORTAL_LOCALE_HEADER: PortalLocaleHeader = "fa-IR";
export const FALLBACK_PORTAL_LOCALE: PortalLocale = "en";
export const FALLBACK_PORTAL_LOCALE_HEADER: PortalLocaleHeader = "en-US";
export const PORTAL_LOCALE_COOKIE = "NEXT_LOCALE";

const byLocale = new Map(PORTAL_LOCALES.map((item) => [item.locale, item]));
const byHeader = new Map(PORTAL_LOCALES.map((item) => [item.header.toLowerCase(), item]));

export function normalizePortalLocale(value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return byLocale.get(DEFAULT_PORTAL_LOCALE)!;
  const lower = normalized.toLowerCase().replace("_", "-");
  const base = lower.split("-")[0] as PortalLocale;
  return byHeader.get(lower) ?? byLocale.get(base) ?? byLocale.get(DEFAULT_PORTAL_LOCALE)!;
}

export function portalLocaleHeader(value?: string | null): PortalLocaleHeader {
  return normalizePortalLocale(value).header;
}

export function portalLocaleDirection(value?: string | null): PortalDirection {
  return normalizePortalLocale(value).direction;
}

export function localeFormName(prefix: string, header: PortalLocaleHeader) {
  return `${prefix}__${header}`;
}

export function localeLegacySuffix(header: PortalLocaleHeader) {
  const locale = normalizePortalLocale(header).locale;
  return locale === "fa" ? "fa" : locale === "en" ? "en" : locale === "ar" ? "ar" : locale === "tr" ? "tr" : locale;
}

export function translatedPortalValue(value: Record<string, string> | null | undefined, locale?: string | null, fallback = "") {
  const current = normalizePortalLocale(locale);
  const candidates = [
    current.header,
    current.locale,
    FALLBACK_PORTAL_LOCALE_HEADER,
    FALLBACK_PORTAL_LOCALE,
    DEFAULT_PORTAL_LOCALE_HEADER,
    DEFAULT_PORTAL_LOCALE,
  ];
  for (const key of candidates) {
    const result = String(value?.[key] ?? "").trim();
    if (result) return result;
  }
  return Object.values(value || {}).map((item) => String(item || "").trim()).find(Boolean) || fallback;
}
