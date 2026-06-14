'use client';

import React from 'react';

import { hasLexicalContent, LexicalRenderer } from '@/components/editor/lexical-renderer';

type RichTextPreviewProps = {
  content?: unknown;
  className?: string;
  fallback?: React.ReactNode;
};

type LexicalNodeLike = {
  text?: unknown;
  children?: LexicalNodeLike[];
};

function parseJsonObject(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed[0] !== '{') return null;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isLexicalRootObject(parsed: Record<string, unknown> | null): parsed is { root: LexicalNodeLike } {
  const root = parsed?.root;
  return Boolean(root && typeof root === 'object' && !Array.isArray(root));
}

function collectLexicalText(node: LexicalNodeLike | undefined): string {
  if (!node) return '';

  const ownText = typeof node.text === 'string' ? node.text : '';
  const childText = Array.isArray(node.children) ? node.children.map(collectLexicalText).join(' ') : '';

  return `${ownText} ${childText}`.trim();
}

export function isSerializedLexicalContent(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return isLexicalRootObject(parseJsonObject(value));
}

export function getRichTextPlainText(value: unknown): string {
  if (value == null) return '';

  if (typeof value !== 'string') {
    return String(value).trim();
  }

  const parsed = parseJsonObject(value);
  if (isLexicalRootObject(parsed)) {
    return collectLexicalText(parsed.root).trim();
  }

  return value.trim();
}

export function RichTextPreview({ content, className, fallback = null }: RichTextPreviewProps) {
  if (content == null) return fallback ? <>{fallback}</> : null;

  const text = typeof content === 'string' ? content.trim() : String(content).trim();
  if (!text) return fallback ? <>{fallback}</> : null;

  const isLexical = isSerializedLexicalContent(text);
  const plainText = getRichTextPlainText(text);

  if (isLexical) {
    if (!plainText) return fallback ? <>{fallback}</> : null;

    return <LexicalRenderer content={text} className={className} />;
  }

  if (hasLexicalContent(text)) {
    return <LexicalRenderer content={text} className={className} />;
  }

  return <div className={className}>{text}</div>;
}
