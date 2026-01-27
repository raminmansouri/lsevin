"use client";

import { useEffect, useState } from "react";
import {
  SerializedEditorState,
  SerializedElementNode,
  SerializedTextNode,
} from "lexical";
import { useLocale, useTranslations } from "next-intl";

import { Editor } from "@/components/blocks/editor-00/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getDirectionFromHeader,
  getLocaleDisplayName,
  localeToHeader,
  SUPPORTED_LOCALE_HEADERS,
} from "@/config/locales";
import { LocaleHeaderTypes, LocaleTypes } from "@/types/common";

import { LocalizedContent } from "../types/localization";

interface LocalizedInputProps {
  label: string;
  value: LocalizedContent | undefined;
  onChange: (value: LocalizedContent) => void;
  supportedLocales?: LocaleHeaderTypes[];
  required?: boolean;
  maxLength?: number;
  description?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  richText?: boolean;
}

export function LocalizedInput({
  label,
  value,
  onChange,
  supportedLocales = SUPPORTED_LOCALE_HEADERS,
  maxLength,
  description,
  error,
  multiline = false,
  rows = 3,
  richText = false,
}: LocalizedInputProps) {
  const locale = useLocale();
  const t = useTranslations("LocalizedInput");
  const currentLocaleHeader = localeToHeader(locale as LocaleTypes);
  const [activeLocale, setActiveLocale] =
    useState<LocaleHeaderTypes>(currentLocaleHeader);

  // Update active locale when current locale changes
  useEffect(() => {
    setActiveLocale(currentLocaleHeader);
  }, [currentLocaleHeader]);

  const translations = value?.translations || {};

  // Helper to get initial editor state from stored JSON string
  const getEditorState = (
    locale: LocaleHeaderTypes
  ): SerializedEditorState | undefined => {
    const storedValue = translations[locale];
    if (!storedValue) return undefined;

    try {
      return JSON.parse(storedValue) as SerializedEditorState;
    } catch {
      // If it's not valid JSON, create a basic editor state with the text
      return {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: storedValue,
                  type: "text",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      } as unknown as SerializedEditorState;
    }
  };

  const handleChange = (locale: LocaleHeaderTypes, text: string) => {
    onChange({
      translations: {
        ...translations,
        [locale]: text,
      },
    });
  };

  const handleRichTextChange = (
    locale: LocaleHeaderTypes,
    editorState: SerializedEditorState
  ) => {
    onChange({
      translations: {
        ...translations,
        [locale]: JSON.stringify(editorState),
      },
    });
  };

  // Helper to check if a translation has content
  const hasContent = (text: string | undefined): boolean => {
    if (!text) return false;
    if (richText) {
      try {
        const editorState = JSON.parse(text) as SerializedEditorState;
        // Check if there's any text content in the editor
        return editorState.root.children.some((child) => {
          if (child.type === "paragraph") {
            const paragraphChild = child as SerializedElementNode;
            return paragraphChild.children?.some(
              (c) =>
                c.type === "text" &&
                "text" in c &&
                (c as SerializedTextNode).text &&
                (c as SerializedTextNode).text.trim()
            );
          }
          return false;
        });
      } catch {
        return text.trim().length > 0;
      }
    }
    return text.trim().length > 0;
  };

  // Show error if:
  // 1. There's an error AND no translations at all, OR
  // 2. There's an error AND the currently active locale is empty
  const hasAnyTranslations = Object.values(translations).some((t) =>
    hasContent(t)
  );
  const shouldShowError =
    error && (!hasAnyTranslations || !hasContent(translations[activeLocale]));

  return (
    <div className="space-y-2">
      <Tabs
        value={activeLocale}
        onValueChange={(v) => setActiveLocale(v as LocaleHeaderTypes)}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Label className="shrink-0">{label}</Label>
          <div className="w-full overflow-x-auto sm:w-auto">
            <TabsList className="inline-flex w-max">
              {supportedLocales.map((locale) => (
                <TabsTrigger key={locale} value={locale}>
                  {getLocaleDisplayName(locale)}
                  {hasContent(translations[locale]) && (
                    <span className="ml-1 text-green-500">●</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {supportedLocales.map((locale) => (
          <TabsContent key={locale} value={locale}>
            {richText ? (
              <Editor
                editorSerializedState={getEditorState(locale)}
                onSerializedChange={(editorState) =>
                  handleRichTextChange(locale, editorState)
                }
                direction={getDirectionFromHeader(locale)}
              />
            ) : multiline ? (
              <Textarea
                value={translations[locale] || ""}
                onChange={(e) => handleChange(locale, e.target.value)}
                maxLength={maxLength}
                rows={rows}
                placeholder={t("placeholder", {
                  field: label.toLowerCase(),
                  language: getLocaleDisplayName(locale),
                })}
              />
            ) : (
              <Input
                value={translations[locale] || ""}
                onChange={(e) => handleChange(locale, e.target.value)}
                maxLength={maxLength}
                placeholder={t("placeholder", {
                  field: label.toLowerCase(),
                  language: getLocaleDisplayName(locale),
                })}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {shouldShowError && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
