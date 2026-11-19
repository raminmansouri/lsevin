/** Values derived from blocks: anchors, table of contents, plain text, reading time, media ids. */
import type { Block } from "./schema";
import { lexicalPlainText } from "./lexical";

/** Unicode-aware heading anchor: keeps Persian/Arabic letters and digits, joins the rest with "-". */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‌‍]/gu, "") // zero-width (half-space) joiners
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
  return slug || "section";
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  /** The block the heading belongs to, so the renderer can set the same id. */
  blockId: string;
}

/** Headings of a document in order, with unique anchor ids (a repeated title gets -2, -3, …). */
export function buildToc(blocks: readonly Block[]): TocEntry[] {
  const used = new Map<string, number>();
  const entries: TocEntry[] = [];
  for (const block of blocks) {
    if (block.type !== "heading" || !block.text) continue;
    const base = slugifyHeading(block.text);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    entries.push({ id: count === 1 ? base : `${base}-${count}`, text: block.text, level: block.level, blockId: block.id });
  }
  return entries;
}

/** All reader-visible text of a document, one block per line. */
export function blocksPlainText(blocks: readonly Block[]): string {
  const lines: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        lines.push(block.text);
        break;
      case "richtext":
        lines.push(lexicalPlainText(block.lexical));
        break;
      case "image":
        lines.push(block.caption);
        break;
      case "gallery":
        for (const item of block.items) lines.push(item.caption);
        break;
      case "video":
        lines.push(block.title, block.caption);
        break;
      case "faq":
        lines.push(block.title);
        for (const item of block.items) lines.push(item.question, lexicalPlainText(item.answer));
        break;
      case "callout":
        lines.push(block.title, lexicalPlainText(block.body));
        break;
      case "cta":
        lines.push(block.label);
        break;
      case "quote":
        lines.push(block.text, block.cite);
        break;
      default:
        break;
    }
  }
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

/** Words per minute used for the estimate; CJK is counted by characters. */
const WORDS_PER_MINUTE = 200;
const CJK_CHARS_PER_MINUTE = 400;

export function readingMinutes(text: string): number {
  const cjk = (text.match(/[㐀-鿿぀-ヿ가-힯]/gu) ?? []).length;
  const words = text
    .replace(/[㐀-鿿぀-ヿ가-힯]/gu, " ")
    .split(/[\s‌]+/u)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  const minutes = words / WORDS_PER_MINUTE + cjk / CJK_CHARS_PER_MINUTE;
  return Math.max(1, Math.ceil(minutes));
}

/** Every media reference in a document (image, gallery, video, poster), deduplicated. */
export function mediaIdsOf(blocks: readonly Block[]): string[] {
  const ids = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (value) ids.add(value);
  };
  for (const block of blocks) {
    if (block.type === "image") add(block.mediaId);
    else if (block.type === "gallery") block.items.forEach((item) => add(item.mediaId));
    else if (block.type === "video") {
      add(block.mediaId);
      add(block.posterMediaId);
    }
  }
  return [...ids];
}

/** First sentence-ish chunk of the body, used when an excerpt is missing. */
export function fallbackExcerpt(blocks: readonly Block[], max = 200): string {
  for (const block of blocks) {
    if (block.type !== "richtext") continue;
    const text = lexicalPlainText(block.lexical).replace(/\s+/gu, " ").trim();
    if (!text) continue;
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const space = cut.lastIndexOf(" ");
    return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`;
  }
  return "";
}
