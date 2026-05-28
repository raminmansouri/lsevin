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
  fallback = "-",
  fallbackClassName,
}: LexicalDescriptionProps) {
  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }

  return <p className={fallbackClassName ?? className}>{fallback}</p>;
}
