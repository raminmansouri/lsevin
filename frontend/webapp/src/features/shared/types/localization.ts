import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocaleHeaderTypes } from "@/types/common";

export interface LocalizedContent {
  translations: Partial<Record<LocaleHeaderTypes, string>>;
}

export interface LocalizedContentResponse {
  translations: Record<LocaleHeaderTypes, string>;
  availableLocales: LocaleHeaderTypes[];
}

// Union type for handling both list and detail responses
export type LocalizedField<T = string> = T | LocalizedContentResponse;

// Helper type for forms
export type LocalizedFormField = Partial<Record<LocaleHeaderTypes, string>>;

// Re-export from common for convenience
export type { LocaleTypes, LocaleHeaderTypes } from "@/types/common";

// Use centralized locale constants
export const SUPPORTED_LOCALES = SUPPORTED_LOCALE_HEADERS;
