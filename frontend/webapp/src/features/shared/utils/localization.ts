import {
  headerToLocale as configHeaderToLocale,
  localeToHeader as configLocaleToHeader,
  FALLBACK_LOCALE_HEADER,
} from "@/config/locales";
import { LocaleHeaderTypes } from "@/types/common";

import {
  LocalizedContent,
  LocalizedContentResponse,
} from "../types/localization";

// Convert between locale formats
export const localeToHeader = configLocaleToHeader;
export const headerToLocale = configHeaderToLocale;

// Create empty localized content
export const createEmptyLocalizedContent = (): LocalizedContent => ({
  translations: {},
});

// Get translation for current locale with fallback
export const getLocalizedValue = (
  content: LocalizedContentResponse | LocalizedContent | undefined,
  locale: LocaleHeaderTypes,
  fallbackLocale: LocaleHeaderTypes = FALLBACK_LOCALE_HEADER
): string => {
  if (!content?.translations) return "";

  return (
    content.translations[locale] ||
    content.translations[fallbackLocale] ||
    Object.values(content.translations)[0] ||
    ""
  );
};

// Check if content has translation for locale
export const hasTranslation = (
  content: LocalizedContent | LocalizedContentResponse,
  locale: LocaleHeaderTypes
): boolean => {
  return !!content.translations[locale]?.trim();
};

// Merge translations from multiple sources
export const mergeTranslations = (
  ...contents: (LocalizedContent | undefined)[]
): LocalizedContent => {
  const merged: Record<string, string> = {};

  contents.forEach((content) => {
    if (content?.translations) {
      Object.entries(content.translations).forEach(([locale, value]) => {
        if (value?.trim()) {
          merged[locale] = value;
        }
      });
    }
  });

  return { translations: merged };
};

// Normalize localized content by removing empty or whitespace-only translations
export const normalizeLocalizedContent = (
  content: LocalizedContent
): LocalizedContent => {
  const normalizedTranslations: Record<string, string> = {};

  Object.entries(content.translations).forEach(([locale, value]) => {
    if (value && value.trim()) {
      normalizedTranslations[locale] = value.trim();
    }
  });

  return { translations: normalizedTranslations };
};

// Normalize multiple localized content fields at once
export const normalizeLocalizedFields = <
  T extends Record<string, LocalizedContent>,
>(
  fields: T
): Record<keyof T, LocalizedContent> => {
  const normalized: Record<string, LocalizedContent> = {};

  Object.entries(fields).forEach(([key, content]) => {
    normalized[key] = normalizeLocalizedContent(content);
  });

  return normalized as Record<keyof T, LocalizedContent>;
};

/**
 * Check if localized content has any translations
 * Returns true if the content has at least one translation key
 */
export const hasAnyTranslations = (
  content: LocalizedContent | LocalizedContentResponse | undefined | null
): boolean => {
  if (!content?.translations) return false;
  return Object.keys(content.translations).length > 0;
};

/**
 * Converts optional localized content to null if it has no translations
 * Use this when sending optional localized fields to the API to avoid sending empty objects
 *
 * @example
 * // Instead of sending { street: { translations: {} } }
 * // Send { street: null }
 * const street = optionalLocalizedContentOrNull(input.street);
 */
export const optionalLocalizedContentOrNull = (
  content: LocalizedContent | undefined | null
): LocalizedContent | null => {
  return hasAnyTranslations(content) ? content! : null;
};
