"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLocaleDisplayName,
  SUPPORTED_LOCALE_HEADERS,
} from "@/config/locales";
import { LocaleHeaderTypes } from "@/types/common";

interface LocaleSelectorProps {
  activeLocale: LocaleHeaderTypes;
  onLocaleChange: (locale: LocaleHeaderTypes) => void;
  supportedLocales?: LocaleHeaderTypes[];
  translations: Record<LocaleHeaderTypes, string>;
}

export function LocaleSelector({
  activeLocale,
  onLocaleChange,
  supportedLocales = SUPPORTED_LOCALE_HEADERS,
  translations,
}: LocaleSelectorProps) {
  return (
    <Tabs
      value={activeLocale}
      onValueChange={(v) => onLocaleChange(v as LocaleHeaderTypes)}
    >
      <TabsList>
        {supportedLocales.map((locale) => (
          <TabsTrigger key={locale} value={locale}>
            {getLocaleDisplayName(locale)}
            {translations[locale] && " ✓"}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
