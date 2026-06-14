"use client";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function unwrapPossibleJsonString(value: unknown, maxDepth = 2): unknown {
  let current = value;
  for (let i = 0; i < maxDepth; i += 1) {
    if (typeof current !== "string") return current;
    const parsed = tryParseJson(current.trim());
    if (parsed === null) return current;
    current = parsed;
  }
  return current;
}

function collectLexicalText(value: unknown, output: string[] = []): string[] {
  if (!value || typeof value !== "object") return output;

  if (Array.isArray(value)) {
    for (const item of value) collectLexicalText(item, output);
    return output;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.text === "string" && record.text.trim()) {
    output.push(record.text.trim());
  }

  if (Array.isArray(record.children)) {
    for (const child of record.children) collectLexicalText(child, output);
  }

  if (record.root && typeof record.root === "object") {
    collectLexicalText(record.root, output);
  }

  return output;
}

function toLexicalEditorState(value: unknown): string | null {
  const parsed = unwrapPossibleJsonString(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const record = parsed as Record<string, unknown>;

  if (record.root && typeof record.root === "object") {
    return JSON.stringify(record);
  }

  // Some existing rows were saved as the Lexical root node itself instead of
  // the full editor-state object. Wrap it so the shared renderer receives the
  // shape it expects: { root: ... }.
  if (Array.isArray(record.children) && record.type === "root") {
    return JSON.stringify({ root: record });
  }

  return null;
}

function toPlainText(value: unknown): string {
  const parsed = unwrapPossibleJsonString(value);
  const lexicalText = collectLexicalText(parsed).join(" ").trim();
  if (lexicalText) return lexicalText;

  if (typeof parsed === "string") return parsed.trim();
  if (parsed == null) return "";

  return String(value ?? "").trim();
}

export function SafeLexicalRenderer({
  content,
  className,
  fallback = "-",
}: {
  content: unknown;
  className?: string;
  fallback?: string;
}) {
  const lexicalContent = toLexicalEditorState(content);

  if (lexicalContent) {
    return <LexicalRenderer content={lexicalContent} className={className} />;
  }

  const text = toPlainText(content) || fallback;
  return <span className={className}>{text}</span>;
}

export function getSafeLexicalPlainText(content: unknown, fallback = "") {
  return toPlainText(content) || fallback;
}
