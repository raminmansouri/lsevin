# Centralized Localization Configuration

## Overview

This document describes the centralized localization configuration system that eliminates hardcoded locale checks throughout the codebase.

## Problem Solved

Previously, locale-specific logic was scattered across multiple files with hardcoded checks like:

- `locale === "fa"` or `locale === "fa-IR"`
- `switch` statements for locale names
- Hardcoded arrays like `['en-US', 'fa-IR']`
- Currency mappings embedded in components

This made it difficult to:

- Add new languages
- Maintain consistency
- Update locale configurations globally

## Solution

All locale-related configuration is now centralized in `/src/config/locales.ts`.

## Key Features

### 1. Centralized Constants

```typescript
// All supported locales defined in one place
export const SUPPORTED_LOCALES: LocaleTypes[] = ["en", "fa"];
export const SUPPORTED_LOCALE_HEADERS: LocaleHeaderTypes[] = ["en-US", "fa-IR"];
```

### 2. Comprehensive Mappings

- **Locale conversions**: `LOCALE_TO_HEADER_MAP`, `HEADER_TO_LOCALE_MAP`
- **Display names**: `LOCALE_DISPLAY_NAMES`, `LOCALE_SHORT_NAMES`
- **Currency mapping**: `LOCALE_CURRENCY_MAP`
- **Number formatting**: `LOCALE_NUMBER_FORMAT_MAP`
- **Calendar systems**: `PERSIAN_CALENDAR_LOCALES`
- **Text direction**: `RTL_LOCALES`

### 3. Utility Functions

```typescript
// Convert between locale formats
localeToHeader("fa"); // returns 'fa-IR'
headerToLocale("fa-IR"); // returns 'fa'

// Get locale-specific information
getLocaleDisplayName("fa-IR"); // returns 'فارسی'
getLocaleCurrency("fa-IR"); // returns 'IRR'
shouldUsePersianCalendar("fa"); // returns true
getNumberFormatLocale("fa-IR"); // returns 'fa-IR'
```

## Updated Files

### Core Configuration

- ✅ `/src/config/locales.ts` - **NEW** centralized configuration
- ✅ `/src/features/shared/utils/localization.ts` - Updated to use centralized config
- ✅ `/src/features/shared/types/localization.ts` - Updated constants
- ✅ `/src/features/shared/schemas/localization.ts` - Updated validation
- ✅ `/src/i18n/navigation.ts` - Removed hardcoded logic

### Components

- ✅ `/src/features/shared/components/LocaleSelector.tsx` - Uses centralized display names
- ✅ `/src/features/shared/components/LocalizedDisplay.tsx` - Uses centralized utilities
- ✅ `/src/features/shared/components/LocalizedInput.tsx` - Uses centralized defaults
- ✅ `/src/components/form/date-picker.tsx` - Uses Persian calendar utility
- ✅ `/src/features/home/components/service-providers-section.tsx` - Uses currency mapping

## Adding a New Language

To add a new language (e.g., Spanish), you only need to update `/src/config/locales.ts`:

```typescript
// 1. Add to supported locales
export const SUPPORTED_LOCALES: LocaleTypes[] = ["en", "fa", "es"];
export const SUPPORTED_LOCALE_HEADERS: LocaleHeaderTypes[] = [
  "en-US",
  "fa-IR",
  "es-ES",
];

// 2. Add to mappings
export const LOCALE_TO_HEADER_MAP: Record<LocaleTypes, LocaleHeaderTypes> = {
  en: "en-US",
  fa: "fa-IR",
  es: "es-ES", // NEW
};

export const HEADER_TO_LOCALE_MAP: Record<LocaleHeaderTypes, LocaleTypes> = {
  "en-US": "en",
  "fa-IR": "fa",
  "es-ES": "es", // NEW
};

// 3. Add display name
export const LOCALE_DISPLAY_NAMES: Record<LocaleHeaderTypes, string> = {
  "en-US": "English",
  "fa-IR": "فارسی",
  "es-ES": "Español", // NEW
};

// 4. Add other mappings as needed
export const LOCALE_CURRENCY_MAP: Record<LocaleHeaderTypes, string> = {
  "en-US": "USD",
  "fa-IR": "IRR",
  "es-ES": "EUR", // NEW
};

// All components will automatically support the new language!
```

## Benefits

1. **Single Source of Truth**: All locale configuration in one file
2. **Easy Maintenance**: Add/remove languages by updating one file
3. **Type Safety**: TypeScript ensures consistency across all files
4. **No Hardcoded Values**: Eliminates scattered locale checks
5. **Consistent Behavior**: All components use the same configuration
6. **Future-Proof**: Easy to extend with new locale-specific features

## Migration Summary

- ❌ **Before**: 9 files with hardcoded locale logic
- ✅ **After**: 1 centralized configuration file + utility functions
- 🎯 **Result**: Adding new languages requires updating only 1 file instead of 9+

This centralization significantly improves maintainability and makes the internationalization system much more scalable.
