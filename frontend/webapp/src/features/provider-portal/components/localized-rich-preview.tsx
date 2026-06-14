"use client";

import {
  hasLexicalContent,
  LexicalRenderer,
} from "@/components/editor/lexical-renderer";

import { displayTranslation } from "../lib/normalizers";
import type { TranslationMap } from "../types";

export function LocalizedRichPreview({
  translations,
  locale = "fa-IR",
  className = "text-muted-foreground leading-relaxed",
}: {
  translations?: TranslationMap | null;
  locale?: string;
  className?: string;
}) {
  const value = translations
    ? displayTranslation(translations, locale, "")
    : "";

  if (value && hasLexicalContent(value)) {
    return <LexicalRenderer content={value} className={className} />;
  }

  return <p className={className}>{value || "-"}</p>;
}
