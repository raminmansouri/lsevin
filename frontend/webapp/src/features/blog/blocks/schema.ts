/**
 * The block model. A post translation is `Block[]`; every block has {id, type, v}. Text blocks hold
 * sanitised Lexical state, the rest is plain validated JSON. Media is referenced by id (or a stored
 * file URL) and resolved at render time, so alt text, size and CDN host are never frozen in the post.
 *
 * `parseBlocks` is strict (server actions: reject bad input). `readBlocks` is tolerant (public
 * render and admin load: drop what cannot be read instead of crashing a page).
 */
import { z } from "zod/v4";

import { sanitizeLexical, emptyLexical, type LexicalState } from "./lexical";
import { EMBED_PROVIDERS, isEmbedId, safeHref } from "./links";

export const BLOCK_SCHEMA_VERSION = 1;
export const MAX_BLOCKS = 300;
export const MAX_DOCUMENT_BYTES = 1_000_000;

export const BLOCK_TYPES = [
  "heading",
  "richtext",
  "image",
  "gallery",
  "video",
  "faq",
  "callout",
  "cta",
  "quote",
  "divider",
  "toc",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

const blockId = z.string().trim().min(1).max(64).regex(/^[\w-]+$/u);
const shortText = (max: number) => z.string().max(max).default("").transform((value) => value.replace(/\s+/gu, " ").trim());
const longText = (max: number) => z.string().max(max).default("");

// A media_library id (a GUID, not necessarily an RFC UUID) or a stored/absolute file URL.
// Anything else (javascript:, data:) is rejected before it can reach an <img src>.
const mediaRef = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value) ||
      /^https?:\/\/[^\s\\]+$/iu.test(value) ||
      /^\/?[\w\-./%]+$/u.test(value),
    "Choose a file from the media library.",
  );

const optionalMediaRef = mediaRef.nullable().optional().transform((value) => value || null);

const lexical = z.unknown().transform((value, ctx): LexicalState => {
  try {
    return sanitizeLexical(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "The text is too large." });
    return emptyLexical();
  }
});

const link = z
  .object({ href: z.string().trim().max(2048) })
  .transform((value, ctx) => {
    // An empty link is a draft in progress; readiness blocks publishing it.
    if (!value.href) return { href: "" };
    const target = safeHref(value.href);
    if (!target) {
      ctx.addIssue({ code: "custom", message: "Use an https:// link, a site path like /consulting, mailto: or tel:." });
      return { href: "" };
    }
    return { href: target.href };
  });

const base = { id: blockId, v: z.literal(1).default(1) };

export const HeadingBlock = z.object({
  ...base,
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
  text: shortText(200),
});

export const RichTextBlock = z.object({ ...base, type: z.literal("richtext"), lexical });

export const IMAGE_SIZES = ["content", "wide", "full"] as const;
export const ALIGNMENTS = ["start", "center", "end"] as const;

export const ImageBlock = z.object({
  ...base,
  type: z.literal("image"),
  mediaId: mediaRef,
  alt: shortText(300),
  caption: shortText(500),
  size: z.enum(IMAGE_SIZES).default("content"),
  align: z.enum(ALIGNMENTS).default("center"),
  href: z.string().trim().max(2048).nullable().optional().transform((value) => value || null),
  decorative: z.boolean().default(false),
});

export const GalleryBlock = z.object({
  ...base,
  type: z.literal("gallery"),
  items: z
    .array(z.object({ id: blockId, mediaId: mediaRef, alt: shortText(300), caption: shortText(300) }))
    .max(24),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export const VideoBlock = z
  .object({
    ...base,
    type: z.literal("video"),
    source: z.enum(["library", "embed"]),
    mediaId: optionalMediaRef,
    posterMediaId: optionalMediaRef,
    provider: z.enum(EMBED_PROVIDERS).nullable().optional().transform((value) => value ?? null),
    videoId: z.string().trim().max(32).nullable().optional().transform((value) => value || null),
    title: shortText(200),
    caption: shortText(500),
  })
  .superRefine((value, ctx) => {
    // Incomplete videos are allowed in drafts (readiness blocks publishing them); a value that is
    // present must be well formed.
    if (value.source === "embed" && value.videoId && (!value.provider || !isEmbedId(value.provider, value.videoId))) {
      ctx.addIssue({ code: "custom", path: ["videoId"], message: "Paste a YouTube, Aparat or Vimeo link." });
    }
  });

export const FaqBlock = z.object({
  ...base,
  type: z.literal("faq"),
  title: shortText(200),
  items: z
    .array(z.object({ id: blockId, question: shortText(400), answer: lexical }))
    .max(50),
});

export const CALLOUT_TONES = ["info", "tip", "warning", "medical"] as const;
export const CalloutBlock = z.object({
  ...base,
  type: z.literal("callout"),
  tone: z.enum(CALLOUT_TONES).default("info"),
  title: shortText(200),
  body: lexical,
});

export const CTA_STYLES = ["primary", "secondary"] as const;
export const CtaBlock = z.object({
  ...base,
  type: z.literal("cta"),
  label: shortText(80),
  link,
  style: z.enum(CTA_STYLES).default("primary"),
});

export const QuoteBlock = z.object({
  ...base,
  type: z.literal("quote"),
  text: longText(1000),
  cite: shortText(200),
});

export const DividerBlock = z.object({ ...base, type: z.literal("divider") });
export const TocBlock = z.object({ ...base, type: z.literal("toc"), title: shortText(120) });

export const BlockSchema = z.discriminatedUnion("type", [
  HeadingBlock,
  RichTextBlock,
  ImageBlock,
  GalleryBlock,
  VideoBlock,
  FaqBlock,
  CalloutBlock,
  CtaBlock,
  QuoteBlock,
  DividerBlock,
  TocBlock,
]);

export type Block = z.output<typeof BlockSchema>;
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

function bytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

// A flat shape on purpose: this project builds without strictNullChecks, where a {ok: true}|{ok: false}
// union does not narrow. `blocks` is empty and `message` set when `ok` is false.
export interface ParseResult {
  ok: boolean;
  blocks: Block[];
  message: string;
  issues: { index: number; path: string; message: string }[];
}

/** Strict: the first invalid block rejects the whole document. Used by every save. */
export function parseBlocks(input: unknown): ParseResult {
  if (!Array.isArray(input)) return { ok: false, blocks: [], message: "The post body must be a list of blocks.", issues: [] };
  if (input.length > MAX_BLOCKS) return { ok: false, blocks: [], message: `A post can have at most ${MAX_BLOCKS} blocks.`, issues: [] };
  const blocks: Block[] = [];
  const issues: { index: number; path: string; message: string }[] = [];
  const seen = new Set<string>();
  input.forEach((raw, index) => {
    const parsed = BlockSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) issues.push({ index, path: issue.path.map(String).join("."), message: issue.message });
      return;
    }
    // Duplicate block ids would break reordering; make them unique instead of failing the save.
    let value = parsed.data as Block;
    if (seen.has(value.id)) value = { ...value, id: `${value.id}-${index}` } as Block;
    seen.add(value.id);
    blocks.push(value);
  });
  if (issues.length) return { ok: false, blocks: [], message: issues[0].message, issues };
  if (bytes(blocks) > MAX_DOCUMENT_BYTES) return { ok: false, blocks: [], message: "The post is too large to save.", issues: [] };
  return { ok: true, blocks, message: "", issues: [] };
}

/** Tolerant: blocks that cannot be read are dropped (unknown types, old shapes). Never throws. */
export function readBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const out: Block[] = [];
  for (const raw of input.slice(0, MAX_BLOCKS)) {
    const parsed = BlockSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data as Block);
  }
  return out;
}

export const newBlockId = () => `b${globalThis.crypto.randomUUID().replace(/-/gu, "").slice(0, 12)}`;

/** A new empty block of a type, with sensible defaults (used by the editor's inserter). */
export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "heading":
      return { id, v: 1, type, level: 2, text: "" };
    case "richtext":
      return { id, v: 1, type, lexical: emptyLexical() };
    case "image":
      return { id, v: 1, type, mediaId: "", alt: "", caption: "", size: "content", align: "center", href: null, decorative: false };
    case "gallery":
      return { id, v: 1, type, items: [], columns: 3 };
    case "video":
      return { id, v: 1, type, source: "embed", mediaId: null, posterMediaId: null, provider: "aparat", videoId: null, title: "", caption: "" };
    case "faq":
      return { id, v: 1, type, title: "", items: [{ id: newBlockId(), question: "", answer: emptyLexical() }] };
    case "callout":
      return { id, v: 1, type, tone: "info", title: "", body: emptyLexical() };
    case "cta":
      return { id, v: 1, type, label: "", link: { href: "" }, style: "primary" };
    case "quote":
      return { id, v: 1, type, text: "", cite: "" };
    case "divider":
      return { id, v: 1, type };
    case "toc":
      return { id, v: 1, type, title: "" };
  }
}

/** A deep copy with fresh ids (block and nested item ids), for duplicating or copying a structure. */
export function duplicateBlock(block: Block): Block {
  const copy = JSON.parse(JSON.stringify(block)) as Block;
  copy.id = newBlockId();
  if (copy.type === "gallery") copy.items = copy.items.map((item) => ({ ...item, id: newBlockId() }));
  if (copy.type === "faq") copy.items = copy.items.map((item) => ({ ...item, id: newBlockId() }));
  return copy;
}
