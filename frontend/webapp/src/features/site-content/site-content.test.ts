import { describe, expect, it } from "vitest";

import { hasLexicalContent } from "@/components/editor/lexical-renderer";
import { toSeoPlainText } from "@/lib/seo/plain-text";

import { FaqFormSchema, SitePageFormSchema } from "./actions/schema";
import { blocksToLexical, textToLexical } from "./lib/lexical";
import { seedFaqItems, seedSitePages, type SeedPageFile } from "./seed";
import { SEED_FAQ_FILES, SEED_PAGE_FILES } from "./seed/registry";
import { FAQ_APP_KEYS, FAQ_SCOPES, SITE_PAGE_SLUGS } from "./types";

// Node types the admin editor registers (components/blocks/editor-00/nodes.ts).
const EDITOR_NODE_TYPES = new Set(["root", "heading", "paragraph", "text", "quote"]);

function nodeTypes(node: unknown, found = new Set<string>()) {
  if (node && typeof node === "object") {
    const value = node as { type?: string; children?: unknown[] };
    if (value.type) found.add(value.type);
    value.children?.forEach((child) => nodeTypes(child, found));
  }
  return found;
}

const lexical = (text: string) => textToLexical(text);

describe("lexical builder", () => {
  it("builds editor state the renderer and editor accept", () => {
    const state = blocksToLexical(
      [
        { type: "h2", text: "Who we are" },
        { type: "p", text: "LSevin coordinates bookings." },
        { type: "quote", text: "A quote" },
      ],
      "rtl",
    );
    expect(hasLexicalContent(state)).toBe(true);
    const parsed = JSON.parse(state);
    expect(parsed.root.direction).toBe("rtl");
    expect(parsed.root.children[0]).toMatchObject({ type: "heading", tag: "h2" });
    expect([...nodeTypes(parsed.root)].every((type) => EDITOR_NODE_TYPES.has(type))).toBe(true);
    expect(toSeoPlainText(state)).toBe("Who we are LSevin coordinates bookings. A quote");
  });

  it("splits plain answers into paragraphs", () => {
    const parsed = JSON.parse(textToLexical("One.\n\nTwo."));
    expect(parsed.root.children).toHaveLength(2);
  });
});

describe("site page form schema", () => {
  const base = { slug: "about-us", isPublished: true, showInFooter: true, displayOrder: 0 } as const;

  it("accepts a published page with a title and body in one language", () => {
    const result = SitePageFormSchema.safeParse({
      ...base,
      title: { translations: { "fa-IR": "درباره ما" } },
      summary: { translations: {} },
      body: { translations: { "fa-IR": lexical("متن صفحه") } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects publishing an empty page (an empty editor is not text)", () => {
    const result = SitePageFormSchema.safeParse({
      ...base,
      title: { translations: { "en-US": "About" } },
      summary: { translations: {} },
      body: { translations: { "en-US": blocksToLexical([{ type: "p", text: "" }]) } },
    });
    expect(result.success).toBe(false);
  });

  it("requires a title in every language that has text", () => {
    const result = SitePageFormSchema.safeParse({
      ...base,
      title: { translations: { "en-US": "About" } },
      summary: { translations: {} },
      body: { translations: { "en-US": lexical("Text"), "de-DE": lexical("Text") } },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("de-DE"))).toBe(true);
  });

  it("rejects unknown slugs and script URLs for the hero image", () => {
    const page = { ...base, title: { translations: {} }, summary: { translations: {} }, body: { translations: {} }, isPublished: false };
    expect(SitePageFormSchema.safeParse({ ...page, slug: "admin" }).success).toBe(false);
    expect(SitePageFormSchema.safeParse({ ...page, heroMedia: "javascript:alert(1)" }).success).toBe(false);
    expect(SitePageFormSchema.safeParse({ ...page, heroMedia: "https://files.example/x.jpg" }).success).toBe(true);
  });
});

describe("FAQ form schema", () => {
  const qa = {
    question: { translations: { "en-US": "Do I need an account?" } },
    answer: { translations: { "en-US": lexical("No, you can browse as a guest.") } },
  };

  it("normalises the target to what the database constraint allows", () => {
    const result = FaqFormSchema.parse({ scope: "home", entityKey: "tours", entityId: null, ...qa });
    expect(result).toMatchObject({ scope: "home", entityKey: null, entityId: null });
    const app = FaqFormSchema.parse({ scope: "app", entityKey: "tours", entityId: "9b2a3c1d-1111-b222-2333-444455556666", ...qa });
    expect(app).toMatchObject({ entityKey: "tours", entityId: null });
  });

  it("requires a known key for app and site page scopes", () => {
    expect(FaqFormSchema.safeParse({ scope: "app", entityKey: "casino", ...qa }).success).toBe(false);
    expect(FaqFormSchema.safeParse({ scope: "site_page", entityKey: null, ...qa }).success).toBe(false);
  });

  it("accepts production-shaped (non-RFC) GUIDs for entities", () => {
    expect(FaqFormSchema.safeParse({ scope: "provider", entityId: "9b2a3c1d-1111-b222-2333-444455556666", ...qa }).success).toBe(true);
  });

  it("rejects a language with a question but no answer", () => {
    const result = FaqFormSchema.safeParse({
      scope: "home",
      question: { translations: { "en-US": "Q?", "fa-IR": "سوال؟" } },
      answer: qa.answer,
    });
    expect(result.success).toBe(false);
  });
});

describe("seed content", () => {
  const pages = SEED_PAGE_FILES as SeedPageFile[];

  it("has one file per essential page, in footer order", () => {
    expect(pages.map((page) => page.slug)).toEqual([...SITE_PAGE_SLUGS]);
  });

  it("gives every page a title, summary and body in each of its languages", () => {
    for (const page of seedSitePages()) {
      for (const key of Object.keys(page.title)) {
        expect(page.title[key], `${page.slug} ${key} title`).toBeTruthy();
        expect(toSeoPlainText(page.summary[key]).length, `${page.slug} ${key} summary`).toBeGreaterThan(50);
        expect(toSeoPlainText(page.body[key], 5000).length, `${page.slug} ${key} body`).toBeGreaterThan(300);
        expect([...nodeTypes(JSON.parse(page.body[key]).root)].every((type) => EDITOR_NODE_TYPES.has(type))).toBe(true);
      }
    }
  });

  it("publishes only pages without open confirmations", () => {
    for (const page of pages) {
      if (page.status === "publish") {
        expect(page.locales["fa-IR"], `${page.slug} needs Persian`).toBeTruthy();
      }
    }
  });

  it("builds FAQ items with valid targets, unique keys and matching languages", () => {
    const items = seedFaqItems();
    expect(new Set(items.map((item) => item.seedKey)).size).toBe(items.length);
    for (const item of items) {
      expect(FAQ_SCOPES).toContain(item.scope);
      if (item.scope === "app") expect(FAQ_APP_KEYS).toContain(item.entityKey);
      if (item.scope === "site_page") expect(SITE_PAGE_SLUGS).toContain(item.entityKey);
      expect(Object.keys(item.question).sort()).toEqual(Object.keys(item.answer).sort());
      expect(Object.keys(item.question).length).toBeGreaterThan(0);
    }
    expect(SEED_FAQ_FILES.length).toBeGreaterThanOrEqual(11);
  });

  it("passes the admin form validation for every item", () => {
    for (const item of seedFaqItems()) {
      const result = FaqFormSchema.safeParse({
        scope: item.scope,
        entityKey: item.entityKey,
        question: { translations: item.question },
        answer: { translations: item.answer },
      });
      expect(result.success, item.seedKey).toBe(true);
    }
  });
});

describe("seed migration generator", () => {
  it("produces the same rows as the seed module the static build renders", async () => {
    const { buildSeed, renderSql } = await import("../../../scripts/site-content-seed.mjs");
    const { pageRows, faqRows } = buildSeed();
    expect(pageRows).toEqual(seedSitePages());
    expect(faqRows).toEqual(seedFaqItems());
    const sql: string = renderSql({ pageRows, faqRows });
    expect(sql.match(/on conflict \(slug\) do nothing/g)).toHaveLength(SITE_PAGE_SLUGS.length);
    // Statements only (content literals and comments stripped): insert-only, nothing destructive.
    const statements = sql.replace(/\$(seedx*)\$[\s\S]*?\$\1\$/g, "''").replace(/^--.*$/gm, "");
    expect(statements).not.toMatch(/\b(update|delete|truncate|drop|alter)\b/i);
  });
});
