"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FALLBACK_LOCALE_HEADER,
  getLocaleDisplayName,
  localeToHeader,
} from "@/config/locales";
import { LocaleHeaderTypes, LocaleTypes } from "@/types/common";

import { LocalizedContentResponse } from "../types/localization";
import { getLocalizedValue } from "../utils/localization";

interface LocalizedDisplayProps {
  content: LocalizedContentResponse | undefined;
  currentLocale?: LocaleHeaderTypes;
  showAllTranslations?: boolean;
  fallbackLocale?: LocaleHeaderTypes;
  className?: string;
  richText?: boolean;
}

export function LocalizedDisplay({
  content,
  currentLocale,
  showAllTranslations = false,
  fallbackLocale = FALLBACK_LOCALE_HEADER,
  className = "",
  richText = false,
}: LocalizedDisplayProps) {
  const locale = useLocale();
  const [showAll, setShowAll] = useState(showAllTranslations);

  // Get locale header from current locale or use the provided one
  const localeHeader = currentLocale || localeToHeader(locale as LocaleTypes);

  if (!content) return <span className={className}>-</span>;

  const displayValue = getLocalizedValue(content, localeHeader, fallbackLocale);
  const availableLocales =
    content.availableLocales || Object.keys(content.translations);
  const hasMultipleTranslations = availableLocales.length > 1;

  if (showAll && hasMultipleTranslations) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Translations:</span>
          <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
            Show current only
          </Button>
        </div>
        <div className="space-y-1">
          {availableLocales.map((locale) => (
            <div key={locale} className="flex items-center gap-2">
              <Badge
                variant={locale === localeHeader ? "default" : "secondary"}
              >
                {getLocaleDisplayName(locale as LocaleHeaderTypes)}
              </Badge>
              <span>{content.translations[locale] || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {richText ? (
        <LexicalRenderer content={displayValue} />
      ) : (
        <span>{displayValue}</span>
      )}
      {hasMultipleTranslations && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(true)}
                className="h-auto p-1"
              >
                <Badge variant="outline" className="text-xs">
                  {availableLocales.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {availableLocales
                  .filter((locale) => locale !== localeHeader)
                  .map((locale) => (
                    <div key={locale} className="text-xs">
                      <strong>
                        {getLocaleDisplayName(locale as LocaleHeaderTypes)}:
                      </strong>{" "}
                      {content.translations[locale]}
                    </div>
                  ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
