import { z } from "zod/v4";

import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocaleHeaderTypes } from "@/types/common";

export const LocalizedContentSchema = z
  .object({
    translations: z.record(z.string(), z.string()),
  })
  .refine((data) => Object.keys(data.translations).length > 0, {
    params: { code: "required" },
  })
  .refine(
    (data) => Object.values(data.translations).some((v) => v.trim().length > 0),
    { params: { code: "required" } }
  )
  .refine(
    (data) => {
      return Object.keys(data.translations).every((locale) =>
        SUPPORTED_LOCALE_HEADERS.includes(locale as LocaleHeaderTypes)
      );
    },
    { params: { code: "invalid" } }
  );

// Schema for optional localized content that allows empty translations
export const OptionalLocalizedContentSchema = z
  .object({
    translations: z.record(z.string(), z.string()),
  })
  .refine(
    (data) => {
      // Allow empty translations for optional fields
      const hasTranslations = Object.keys(data.translations).length > 0;
      if (!hasTranslations) return true;

      // If there are translations, validate they are not empty and have valid locales
      return (
        Object.values(data.translations).some((v) => v.trim().length > 0) &&
        Object.keys(data.translations).every((locale) =>
          SUPPORTED_LOCALE_HEADERS.includes(locale as LocaleHeaderTypes)
        )
      );
    },
    { params: { code: "invalid" } }
  );

export const LocalizedContentResponseSchema = z.object({
  translations: z.record(z.string(), z.string()),
  availableLocales: z.array(z.string()),
});

// Helper function for creating localized field schemas
export const createLocalizedFieldSchema = (baseValidation?: z.ZodString) => {
  const stringSchema = baseValidation || z.string();

  return LocalizedContentSchema.transform((data) => ({
    translations: Object.fromEntries(
      Object.entries(data.translations).map(([locale, value]) => [
        locale,
        stringSchema.parse(value),
      ])
    ),
  }));
};
