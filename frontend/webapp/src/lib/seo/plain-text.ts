type LexicalNodeLike = {
  text?: unknown;
  children?: unknown;
};

function collectLexicalText(node: unknown): string[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) return [];

  const value = node as LexicalNodeLike;
  const text = typeof value.text === "string" ? [value.text] : [];
  const children = Array.isArray(value.children)
    ? value.children.flatMap(collectLexicalText)
    : [];

  return [...text, ...children];
}

function lexicalPlainText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as { root?: unknown };
    if (!parsed || typeof parsed !== "object" || !("root" in parsed)) return "";
    return collectLexicalText(parsed.root).join(" ");
  } catch {
    return "";
  }
}

function truncateAtWordBoundary(value: string, maxLength: number): string {
  const characters = Array.from(value);
  if (characters.length <= maxLength) return value;

  const shortened = characters.slice(0, maxLength + 1).join("");
  const boundary = Math.max(shortened.lastIndexOf(" "), shortened.lastIndexOf("\n"));
  return (boundary > Math.floor(maxLength * 0.6)
    ? shortened.slice(0, boundary)
    : characters.slice(0, maxLength).join("")
  ).trim();
}

/**
 * Converts a database rich-text candidate into safe metadata text.
 * Objects, arrays, HTML and malformed JSON are deliberately rejected so they
 * cannot leak as `[object Object]`, markup, or serialized editor state.
 */
export function toSeoPlainText(value: unknown, maxLength = 300): string {
  if (typeof value !== "string" || maxLength < 1) return "";

  const lexical = lexicalPlainText(value);
  const text = lexical === null ? value : lexical;
  if (!text || /<\/?[a-z][^>]*>/iu.test(text)) return "";

  const normalized = text.replace(/\s+/gu, " ").trim();
  if (!normalized || normalized === "[object Object]") return "";
  return truncateAtWordBoundary(normalized, maxLength);
}

export function firstSeoPlainText(
  candidates: readonly unknown[],
  maxLength = 300,
): string {
  for (const candidate of candidates) {
    const normalized = toSeoPlainText(candidate, maxLength);
    if (normalized) return normalized;
  }
  return "";
}
