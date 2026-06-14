'use client';

import { useTranslations } from 'next-intl';

import { hasLexicalContent, LexicalRenderer } from '@/components/editor/lexical-renderer';

export function HomeLexicalDescription({
  content,
  className,
  fallback,
}: {
  content?: string | null;
  className?: string;
  fallback?: string | null;
}) {
  const t = useTranslations('Home.common');
  const fallbackText = fallback && fallback.trim().length ? fallback : t('noDescription');

  if (content && hasLexicalContent(content)) {
    return <LexicalRenderer content={content} className={className} />;
  }

  return <p className={className}>{fallbackText}</p>;
}
