import { LocaleHeaderTypes, LocaleTypes } from "@/types/common";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Text direction type for layout and styling
 */
export type Direction = "ltr" | "rtl";

// =============================================================================
// LOCALE CONFIGURATION
// =============================================================================

/**
 * Supported locales in the application
 */
export const SUPPORTED_LOCALES: LocaleTypes[] = [
  "en",
  "fa",
  "tr",
  "es",
  "ar",
  "ku",
  "de",
  "fr",
] as const;

/**
 * Supported locale headers (used for API communication)
 */
export const SUPPORTED_LOCALE_HEADERS: LocaleHeaderTypes[] = [
  "en-US",
  "fa-IR",
  "tr-TR",
  "es-ES",
  "ar-SA",
  "ku-KU",
  "de-DE",
  "fr-FR",
] as const;

/**
 * Default locale when no preference is set (Persian / Farsi)
 */
export const DEFAULT_LOCALE: LocaleTypes = "fa";

/**
 * Default locale header
 */
export const DEFAULT_LOCALE_HEADER: LocaleHeaderTypes = "fa-IR";

/**
 * Fallback locale for missing translations
 */
export const FALLBACK_LOCALE: LocaleTypes = "en";

/**
 * Fallback locale header for missing translations
 */
export const FALLBACK_LOCALE_HEADER: LocaleHeaderTypes = "en-US";

// =============================================================================
// LOCALE MAPPINGS
// =============================================================================

/**
 * Mapping from locale to locale header
 */
export const LOCALE_TO_HEADER_MAP: Record<LocaleTypes, LocaleHeaderTypes> = {
  en: "en-US",
  fa: "fa-IR",
  tr: "tr-TR",
  es: "es-ES",
  ar: "ar-SA",
  ku: "ku-KU",
  de: "de-DE",
  fr: "fr-FR",
} as const;

/**
 * Mapping from locale header to locale
 */
export const HEADER_TO_LOCALE_MAP: Record<LocaleHeaderTypes, LocaleTypes> = {
  "en-US": "en",
  "fa-IR": "fa",
  "tr-TR": "tr",
  "es-ES": "es",
  "ar-SA": "ar",
  "ku-KU": "ku",
  "de-DE": "de",
  "fr-FR": "fr",
} as const;

/**
 * Display names for locales (in their own language)
 */
export const LOCALE_DISPLAY_NAMES: Record<LocaleHeaderTypes, string> = {
  "en-US": "English",
  "fa-IR": "فارسی",
  "tr-TR": "Türkçe",
  "es-ES": "Español",
  "ar-SA": "العربية",
  "ku-KU": "Kurdish",
  "de-DE": "Deutsch",
  "fr-FR": "Français",
} as const;

/**
 * Alternative display names for locales (shorter versions)
 */
export const LOCALE_SHORT_NAMES: Record<LocaleHeaderTypes, string> = {
  "en-US": "EN",
  "fa-IR": "فا",
  "tr-TR": "TR",
  "es-ES": "ES",
  "ar-SA": "AR",
  "ku-KU": "KU",
  "de-DE": "DE",
  "fr-FR": "FR",
} as const;

/**
 * Currency codes associated with each locale
 */
export const LOCALE_CURRENCY_MAP: Record<LocaleHeaderTypes, string> = {
  "en-US": "USD",
  "fa-IR": "IRR",
  "tr-TR": "TRY",
  "es-ES": "EUR",
  "ar-SA": "SAR",
  "ku-KU": "KWD",
  "de-DE": "EUR",
  "fr-FR": "EUR",
} as const;

/**
 * Number format locales for Intl.NumberFormat
 */
export const LOCALE_NUMBER_FORMAT_MAP: Record<LocaleHeaderTypes, string> = {
  "en-US": "en-US",
  "fa-IR": "fa-IR",
  "tr-TR": "tr-TR",
  "es-ES": "es-ES",
  "ar-SA": "ar-SA",
  "ku-KU": "ku-KU",
  "de-DE": "de-DE",
  "fr-FR": "fr-FR",
} as const;

/**
 * Date format locales for date formatting
 */
export const LOCALE_DATE_FORMAT_MAP: Record<LocaleHeaderTypes, string> = {
  "en-US": "en-US",
  "fa-IR": "fa-IR",
  "tr-TR": "tr-TR",
  "es-ES": "es-ES",
  "ar-SA": "ar-SA",
  "ku-KU": "ku-KU",
  "de-DE": "de-DE",
  "fr-FR": "fr-FR",
} as const;

/**
 * Locales that use Persian calendar
 */
export const PERSIAN_CALENDAR_LOCALES: Set<LocaleTypes> = new Set(["fa"]);

/**
 * Locales that use Persian calendar (header format)
 */
export const PERSIAN_CALENDAR_LOCALE_HEADERS: Set<LocaleHeaderTypes> = new Set([
  "fa-IR",
]);

/**
 * Locales that use Hijri (Islamic) calendar
 */
export const HIJRI_CALENDAR_LOCALES: Set<LocaleTypes> = new Set(["ar"]);

/**
 * Locales that use Hijri (Islamic) calendar (header format)
 */
export const HIJRI_CALENDAR_LOCALE_HEADERS: Set<LocaleHeaderTypes> = new Set([
  "ar-SA",
]);

/**
 * RTL (Right-to-Left) locales
 */
export const RTL_LOCALES: Set<LocaleTypes> = new Set(["fa", "ar", "ku"]);

/**
 * RTL (Right-to-Left) locale headers
 */
export const RTL_LOCALE_HEADERS: Set<LocaleHeaderTypes> = new Set([
  "fa-IR",
  "ar-SA",
  "ku-KU",
]);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert locale to locale header format
 */
export const localeToHeader = (locale: LocaleTypes): LocaleHeaderTypes => {
  return LOCALE_TO_HEADER_MAP[locale] ?? DEFAULT_LOCALE_HEADER;
};

/**
 * Convert locale header to locale format
 */
export const headerToLocale = (header: LocaleHeaderTypes): LocaleTypes => {
  return HEADER_TO_LOCALE_MAP[header] ?? DEFAULT_LOCALE;
};

/**
 * Get display name for a locale header
 */
export const getLocaleDisplayName = (
  localeHeader: LocaleHeaderTypes
): string => {
  return LOCALE_DISPLAY_NAMES[localeHeader] ?? localeHeader;
};

/**
 * Get short display name for a locale header
 */
export const getLocaleShortName = (localeHeader: LocaleHeaderTypes): string => {
  return LOCALE_SHORT_NAMES[localeHeader] ?? localeHeader;
};

/**
 * Get currency code for a locale header
 */
export const getLocaleCurrency = (localeHeader: LocaleHeaderTypes): string => {
  return LOCALE_CURRENCY_MAP[localeHeader] ?? "USD";
};

/**
 * Get number format locale for Intl.NumberFormat
 */
export const getNumberFormatLocale = (
  localeHeader: LocaleHeaderTypes
): string => {
  return LOCALE_NUMBER_FORMAT_MAP[localeHeader] ?? "en-US";
};

/**
 * Get date format locale for date operations
 */
export const getDateFormatLocale = (
  localeHeader: LocaleHeaderTypes
): string => {
  return LOCALE_DATE_FORMAT_MAP[localeHeader] ?? "en-US";
};

/**
 * Check if locale should use Persian calendar
 */
export const shouldUsePersianCalendar = (locale: LocaleTypes): boolean => {
  return PERSIAN_CALENDAR_LOCALES.has(locale);
};

/**
 * Check if locale header should use Persian calendar
 */
export const shouldUsePersianCalendarForHeader = (
  localeHeader: LocaleHeaderTypes
): boolean => {
  return PERSIAN_CALENDAR_LOCALE_HEADERS.has(localeHeader);
};

/**
 * Check if locale should use Hijri calendar
 */
export const shouldUseHijriCalendar = (locale: LocaleTypes): boolean => {
  return HIJRI_CALENDAR_LOCALES.has(locale);
};

/**
 * Check if locale header should use Hijri calendar
 */
export const shouldUseHijriCalendarForHeader = (
  localeHeader: LocaleHeaderTypes
): boolean => {
  return HIJRI_CALENDAR_LOCALE_HEADERS.has(localeHeader);
};

/**
 * Check if locale is RTL
 */
export const isRTL = (locale: LocaleTypes): boolean => {
  return RTL_LOCALES.has(locale);
};

/**
 * Check if locale header is RTL
 */
export const isRTLHeader = (localeHeader: LocaleHeaderTypes): boolean => {
  return RTL_LOCALE_HEADERS.has(localeHeader);
};

/**
 * Get text direction for a locale
 */
export const getDirection = (locale: LocaleTypes): Direction => {
  return isRTL(locale) ? "rtl" : "ltr";
};

/**
 * Get text direction for a locale header
 */
export const getDirectionFromHeader = (
  localeHeader: LocaleHeaderTypes
): Direction => {
  return isRTLHeader(localeHeader) ? "rtl" : "ltr";
};

/**
 * Validate if a string is a supported locale
 */
export const isSupportedLocale = (locale: string): locale is LocaleTypes => {
  return SUPPORTED_LOCALES.includes(locale as LocaleTypes);
};

/**
 * Validate if a string is a supported locale header
 */
export const isSupportedLocaleHeader = (
  localeHeader: string
): localeHeader is LocaleHeaderTypes => {
  return SUPPORTED_LOCALE_HEADERS.includes(localeHeader as LocaleHeaderTypes);
};

/**
 * Get all supported locales
 */
export const getSupportedLocales = (): readonly LocaleTypes[] => {
  return SUPPORTED_LOCALES;
};

/**
 * Get all supported locale headers
 */
export const getSupportedLocaleHeaders = (): readonly LocaleHeaderTypes[] => {
  return SUPPORTED_LOCALE_HEADERS;
};
