'use client';

import { hasLexicalContent, LexicalRenderer } from '@/components/editor/lexical-renderer';

export function HomeLexicalDescription({
  content,
  className,
  fallback = '-',
}: {
  content?: string | null;
  className?: string;
  fallback?: string;
}) {
  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }

  return <p className={className}>{content && content.trim().length ? content : fallback}</p>;
}
