/**
 * Launch content for the editorial pages and FAQs, authored as blocks in
 * ./content and shipped two ways:
 *  - scripts/site-content-seed.mjs turns it into a seed migration (inserted only
 *    where the admin has not written anything yet);
 *  - the static build renders from it, because `next build` has no database
 *    route. At runtime the database copy replaces it on the first revalidation.
 */
import { blocksToLexical, directionForLocaleKey, textToLexical, type ContentBlock } from "../lib/lexical";
import type { FaqScope, SitePageSlug } from "../types";
import { SEED_FAQ_FILES, SEED_PAGE_FILES } from "./registry";

type LocaleKey = string;

export interface SeedPageFile {
  slug: SitePageSlug;
  status: "publish" | "draft";
  needsConfirmation?: string[];
  sources?: unknown[];
  locales: Record<
    LocaleKey,
    { title: string; metaDescription: string; blocks: ContentBlock[]; faq?: { q: string; a: string }[] }
  >;
}

export interface SeedFaqFile {
  scope: FaqScope;
  entityKey?: string | null;
  sources?: unknown[];
  items: { locales: Record<LocaleKey, { q: string; a: string }> }[];
}

export interface SeedSitePage {
  slug: SitePageSlug;
  isPublished: boolean;
  displayOrder: number;
  title: Record<LocaleKey, string>;
  summary: Record<LocaleKey, string>;
  body: Record<LocaleKey, string>;
}

export interface SeedFaqItem {
  /** Stable key so re-running the seed never duplicates an item. */
  seedKey: string;
  scope: FaqScope;
  entityKey: string | null;
  displayOrder: number;
  question: Record<LocaleKey, string>;
  answer: Record<LocaleKey, string>;
}

const mapLocales = <T, R>(locales: Record<LocaleKey, T>, fn: (value: T, key: LocaleKey) => R) =>
  Object.fromEntries(Object.entries(locales).map(([key, value]) => [key, fn(value, key)]));

export function seedSitePages(files: readonly SeedPageFile[] = SEED_PAGE_FILES): SeedSitePage[] {
  return files.map((file, index) => ({
    slug: file.slug,
    isPublished: file.status === "publish",
    displayOrder: index,
    title: mapLocales(file.locales, (copy) => copy.title.trim()),
    summary: mapLocales(file.locales, (copy) => copy.metaDescription.trim()),
    body: mapLocales(file.locales, (copy, key) => blocksToLexical(copy.blocks, directionForLocaleKey(key))),
  }));
}

/** Items in one locale-keyed list; the item count is taken from the locale with the most. */
function pageFaqItems(file: SeedPageFile): SeedFaqItem[] {
  const count = Math.max(0, ...Object.values(file.locales).map((copy) => copy.faq?.length ?? 0));
  return Array.from({ length: count }, (_, index) => {
    const question: Record<LocaleKey, string> = {};
    const answer: Record<LocaleKey, string> = {};
    for (const [key, copy] of Object.entries(file.locales)) {
      const entry = copy.faq?.[index];
      if (!entry?.q?.trim() || !entry.a?.trim()) continue;
      question[key] = entry.q.trim();
      answer[key] = textToLexical(entry.a, directionForLocaleKey(key));
    }
    return { seedKey: `site_page:${file.slug}:${index}`, scope: "site_page" as const, entityKey: file.slug, displayOrder: index, question, answer };
  });
}

export function seedFaqItems(
  pages: readonly SeedPageFile[] = SEED_PAGE_FILES,
  faqs: readonly SeedFaqFile[] = SEED_FAQ_FILES,
): SeedFaqItem[] {
  const fromFiles = faqs.flatMap((file) =>
    file.items.map((item, index) => {
      const question: Record<LocaleKey, string> = {};
      const answer: Record<LocaleKey, string> = {};
      for (const [key, copy] of Object.entries(item.locales)) {
        if (!copy?.q?.trim() || !copy.a?.trim()) continue;
        question[key] = copy.q.trim();
        answer[key] = textToLexical(copy.a, directionForLocaleKey(key));
      }
      return {
        seedKey: `${file.scope}:${file.entityKey ?? ""}:${index}`,
        scope: file.scope,
        entityKey: file.entityKey ?? null,
        displayOrder: index,
        question,
        answer,
      };
    }),
  );
  // A draft page's FAQ is seeded too: it only shows on that page, which stays 404 until published.
  return [...pages.flatMap(pageFaqItems), ...fromFiles];
}
