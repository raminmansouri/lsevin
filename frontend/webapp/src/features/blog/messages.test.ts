import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { checkReadiness } from "./blocks/readiness";
import { BLOCK_TYPES, CALLOUT_TONES, CTA_STYLES, IMAGE_SIZES, ALIGNMENTS, parseBlocks } from "./blocks/schema";
import { EMBED_PROVIDERS } from "./blocks/links";
import { POST_STATUSES } from "./types";

/**
 * Every message key the blog UI asks for must exist in messages/blog/en.json, and the Persian file
 * must carry the same keys: a missing key renders as a raw key path in the editor or on a public page.
 */
const ROOT = path.resolve(__dirname, "../../..");
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")) as Record<string, unknown>;
const en = read("messages/blog/en.json");
const fa = read("messages/blog/fa.json");
const ar = read("messages/blog/ar.json");

const has = (tree: Record<string, unknown>, key: string): boolean => {
  let node: unknown = tree;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object" || !(part in (node as Record<string, unknown>))) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
};

const flatten = (tree: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) => (value && typeof value === "object" ? flatten(value as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]));

function sources(dir: string): string[] {
  const full = path.join(ROOT, dir);
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? sources(p) : /\.tsx$/u.test(entry.name) ? [p] : [];
  });
}

const staticKeys = (files: string[]) => {
  const keys = new Set<string>();
  for (const file of files) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const match of text.matchAll(/\bt\("([A-Za-z0-9_.]+)"/gu)) keys.add(match[1]);
  }
  return keys;
};

describe("blog messages", () => {
  const adminFiles = [...sources("src/features/blog/components/admin"), "src/app/[locale]/(admin)/admin/blog/page.tsx"];
  const publicFiles = [...sources("src/features/blog/components/public"), "src/app/[locale]/(site)/blog/page.tsx"];

  it("every static admin key exists in en", () => {
    const missing = [...staticKeys(adminFiles)].filter((key) => !has((en.AdminBlog ?? {}) as Record<string, unknown>, key));
    expect(missing).toEqual([]);
  });

  it("every static public key exists in en, fa and ar", () => {
    const keys = [...staticKeys(publicFiles)];
    for (const [name, tree] of [["en", en], ["fa", fa], ["ar", ar]] as const) {
      const missing = keys.filter((key) => !has((tree.Blog ?? {}) as Record<string, unknown>, key));
      expect(missing, name).toEqual([]);
    }
  });

  it("covers every dynamic key family", () => {
    const admin = (en.AdminBlog ?? {}) as Record<string, unknown>;
    const need: string[] = [
      ...BLOCK_TYPES.map((type) => `blocks.${type}`),
      ...CALLOUT_TONES.map((tone) => `callout.tones.${tone}`),
      ...CTA_STYLES.map((style) => `cta.styles.${style}`),
      ...IMAGE_SIZES.map((size) => `image.sizes.${size}`),
      ...ALIGNMENTS.map((align) => `image.aligns.${align}`),
      ...EMBED_PROVIDERS.map((provider) => `video.providers.${provider}`),
      ...["embed", "library"].map((source) => `video.sources.${source}`),
      ...POST_STATUSES.map((status) => `status.${status}`),
      "status.scheduled",
      "status.new",
      ...["autosave", "save", "publish"].map((kind) => `history.kind.${kind}`),
      ...["settings", "seo", "readiness", "history"].map((tab) => `side.${tab}`),
      "readiness.severity.error",
      "readiness.severity.warning",
    ];
    expect(need.filter((key) => !has(admin, key))).toEqual([]);
  });

  it("has a readiness message for every code the rules can emit", () => {
    // Drive checkReadiness with inputs that trigger every branch, then read the codes it produced.
    const codes = new Set<string>();
    const run = (over: Partial<Parameters<typeof checkReadiness>[0]>, blocks: unknown[] = []) => {
      const parsed = parseBlocks(blocks);
      if (!parsed.ok) throw new Error(parsed.message);
      checkReadiness({ slug: "ok", title: "T", excerpt: "E", seoDescription: "", blocks: parsed.blocks, featuredMedia: "x", isMedical: false, hasReviewer: false, ...over }).forEach((i) => codes.add(i.code));
    };
    run({ slug: "Bad Slug", title: "", featuredMedia: null, excerpt: "", isMedical: true, seoDescription: "x".repeat(200) });
    run({}, [
      { id: "h", type: "heading", level: 2, text: "" },
      { id: "r", type: "richtext", lexical: { root: { type: "root", children: [] } } },
      { id: "i", type: "image", mediaId: "", alt: "", caption: "", decorative: false, href: "javascript:x" },
      { id: "i2", type: "image", mediaId: "a", alt: "", caption: "", decorative: false, href: "javascript:x" },
      { id: "g", type: "gallery", items: [] },
      { id: "g2", type: "gallery", items: [{ id: "1", mediaId: "", alt: "" }, { id: "2", mediaId: "m", alt: "" }] },
      { id: "v", type: "video", source: "library", mediaId: null, posterMediaId: null, title: "" },
      { id: "v2", type: "video", source: "embed", provider: null, videoId: null, title: "" },
      { id: "f", type: "faq", items: [] },
      { id: "f2", type: "faq", items: [{ id: "a", question: "q", answer: { root: { type: "root", children: [] } } }] },
      { id: "c", type: "callout", tone: "info", title: "", body: { root: { type: "root", children: [] } } },
      { id: "b", type: "cta", label: "", link: { href: "" }, style: "primary" },
      { id: "q", type: "quote", text: " ", cite: "" },
    ]);
    const admin = ((en.AdminBlog ?? {}) as { readiness: { codes: Record<string, string> } }).readiness.codes;
    expect([...codes].filter((code) => !(code in admin))).toEqual([]);
    expect(codes.size).toBeGreaterThan(20);
  });

  it("the Persian files carry every key of the English files", () => {
    for (const namespace of ["Blog", "AdminBlog"] as const) {
      const enKeys = flatten((en[namespace] ?? {}) as Record<string, unknown>);
      const faKeys = new Set(flatten((fa[namespace] ?? {}) as Record<string, unknown>));
      expect(enKeys.filter((key) => !faKeys.has(key)), namespace).toEqual([]);
    }
  });
});
