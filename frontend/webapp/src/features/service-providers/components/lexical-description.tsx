"use client";

import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";

type LexicalDescriptionProps = {
  content?: string | null;
  className?: string;
  fallback?: string;
  fallbackClassName?: string;
};

export function LexicalDescription({
  content,
  className,
  fallback = "",
  fallbackClassName,
}: LexicalDescriptionProps) {
  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }

  // Some descriptions are stored as plain text (or empty Lexical). Render the plain
  // text when present so it is never shown empty; only fall back when truly empty.
  const plain = typeof content === "string" ? content.trim() : "";
  const looksLikeJson = plain.startsWith("{") || plain.startsWith("[");
  if (plain && !looksLikeJson) {
    return <p className={className}>{plain}</p>;
  }

  if (!fallback) return null;
  return <p className={fallbackClassName ?? className}>{fallback}</p>;
}
