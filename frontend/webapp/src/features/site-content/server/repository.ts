import "server-only";

import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { routing } from "@/i18n/routing";
import type { SeoLocale } from "@/lib/seo/alternates";
import { toSeoPlainText } from "@/lib/seo/plain-text";

import { seedFaqItems, seedSitePages } from "../seed";
import {
  SITE_PAGE_SLUGS,
  isSitePageSlug,
  scopeUsesKey,
  type FaqAdminRow,
  type FaqScope,
  type FaqTarget,
  type FooterPageLink,
  type PublicFaqItem,
  type PublicSitePage,
  type SitePageAdminRow,
  type SitePageSlug,
  type Translations,
} from "../types";

/** Every public read is cached under this tag; editorial saves revalidate it. */
export const SITE_CONTENT_TAG = "global:site-content";

// `next build` has no database route, so the static pages are rendered from the
// bundled seed content (the same content the seed migration inserts). At runtime
// the database copy replaces it on the first revalidation or editorial save.
const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

// Same rule as features/home/components/home-media (absolute URLs pass through,
// paths resolve against the files host), but read at call time: importing the
// validated client env here would make every module that renders a footer or an
// FAQ (sitemap, llms.txt, layouts) fail to load without all NEXT_PUBLIC_* set.
function mediaUrl(value: string | null): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//iu.test(normalized)) return normalized;
  const base = (process.env.NEXT_PUBLIC_FILES_URL ?? "").replace(/\/+$/u, "");
  const path = normalized.replace(/^\/+/u, "");
  return base ? `${base}/${path}` : `/${path}`;
}

const asTranslations = (value: unknown): Translations =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Translations) : {};

/** Text for one locale, or "" — never another language's text (no mixed-language pages). */
const pick = (translations: Translations, localeKey: string) => (translations[localeKey] ?? "").trim();

const hasText = (value: string | undefined) => Boolean(toSeoPlainText(value ?? "", 10));

// ---------------------------------------------------------------------------
// Site pages
// ---------------------------------------------------------------------------

type SitePageRow = {
  id: string;
  slug: string;
  titleTranslations: unknown;
  summaryTranslations: unknown;
  bodyTranslations: unknown;
  heroMedia: string | null;
  heroUrl: string | null;
  isPublished: boolean;
  showInFooter: boolean;
  displayOrder: number | string;
  updatedAt: string | null;
};

// Fragments are built per query (postgres.js fragments are not reusable across queries).
const sitePageColumns = () => sql`
  p.id::text as id,
  p.slug,
  p.title_translations as "titleTranslations",
  p.summary_translations as "summaryTranslations",
  p.body_translations as "bodyTranslations",
  p.hero_media as "heroMedia",
  nullif(coalesce(mm.file_url, p.hero_media, ''), '') as "heroUrl",
  p.is_published as "isPublished",
  p.show_in_footer as "showInFooter",
  p.display_order as "displayOrder",
  p.updated_at::text as "updatedAt"
`;

function toAdminPage(slug: SitePageSlug, row?: SitePageRow): SitePageAdminRow {
  return {
    id: row?.id ?? null,
    slug,
    title: asTranslations(row?.titleTranslations),
    summary: asTranslations(row?.summaryTranslations),
    body: asTranslations(row?.bodyTranslations),
    heroMedia: row?.heroMedia ?? null,
    isPublished: Boolean(row?.isPublished),
    showInFooter: row ? Boolean(row.showInFooter) : true,
    displayOrder: Number(row?.displayOrder ?? SITE_PAGE_SLUGS.indexOf(slug)),
    updatedAt: row?.updatedAt ?? null,
  };
}

/** All essential pages, including ones never saved yet (id null), in footer order. */
export async function listAdminSitePages(): Promise<SitePageAdminRow[]> {
  const rows = await sql<SitePageRow[]>`
    select ${sitePageColumns()}
    from content.site_pages p
    left join media.media_library mm on mm.id::text = p.hero_media
  `;
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return SITE_PAGE_SLUGS.map((slug) => toAdminPage(slug, bySlug.get(slug)));
}

export async function getAdminSitePage(slug: SitePageSlug): Promise<SitePageAdminRow> {
  const rows = await sql<SitePageRow[]>`
    select ${sitePageColumns()}
    from content.site_pages p
    left join media.media_library mm on mm.id::text = p.hero_media
    where p.slug = ${slug}
  `;
  return toAdminPage(slug, rows[0]);
}

/** Locales in which a page has both a title and body text. */
export function sitePageLocales(row: Pick<SitePageRow, "titleTranslations" | "bodyTranslations">): SeoLocale[] {
  const title = asTranslations(row.titleTranslations);
  const body = asTranslations(row.bodyTranslations);
  return routing.locales.filter((locale) => {
    const key = catalogDataLocale(locale);
    return hasText(title[key]) && hasText(body[key]);
  });
}

export interface PublishedSitePage {
  page: PublicSitePage;
  /** Locales with their own translation; others render the fallback language and are noindex. */
  locales: SeoLocale[];
  /** True when `page` is shown in a fallback language, not the requested one. */
  isFallback: boolean;
}

async function loadPublishedPages() {
  return sql<SitePageRow[]>`
    select ${sitePageColumns()}
    from content.site_pages p
    left join media.media_library mm on mm.id::text = p.hero_media
    where p.is_published
    order by p.display_order asc, p.slug asc
  `;
}

const cachedPublishedPages = unstable_cache(loadPublishedPages, ["site-content-pages-v1"], {
  revalidate: 3600,
  tags: [SITE_CONTENT_TAG],
});

/**
 * Published pages, or null when the database cannot be read. Callers treat null
 * as "unknown" (fall back to built-in copy) rather than as "unpublished".
 */
const SEED_UPDATED_AT = "2026-11-02T00:00:00.000Z";

const seedPageRows = (): SitePageRow[] =>
  seedSitePages()
    .filter((page) => page.isPublished)
    .map((page) => ({
      id: `seed-${page.slug}`,
      slug: page.slug,
      titleTranslations: page.title,
      summaryTranslations: page.summary,
      bodyTranslations: page.body,
      heroMedia: null,
      heroUrl: null,
      isPublished: true,
      showInFooter: true,
      displayOrder: page.displayOrder,
      updatedAt: SEED_UPDATED_AT,
    }));

async function publishedPages(): Promise<SitePageRow[] | null> {
  if (isBuildPhase()) return seedPageRows();
  try {
    const rows = await cachedPublishedPages();
    // Anything but a row list (a stubbed client, a proxy error) counts as unavailable.
    if (!Array.isArray(rows)) throw new Error("unexpected result from content.site_pages");
    return rows;
  } catch (error) {
    console.error("site-content: published pages read failed", { error });
    return null;
  }
}

function toPublicPage(row: SitePageRow, localeKey: string): PublicSitePage | null {
  const title = pick(asTranslations(row.titleTranslations), localeKey);
  const body = pick(asTranslations(row.bodyTranslations), localeKey);
  if (!hasText(title) || !hasText(body)) return null;
  return {
    slug: row.slug as SitePageSlug,
    title,
    summary: pick(asTranslations(row.summaryTranslations), localeKey),
    body,
    heroImageUrl: mediaUrl(row.heroUrl),
    updatedAt: row.updatedAt ?? new Date(0).toISOString(),
  };
}

/**
 * A published page in the requested locale; when that locale has no translation
 * the English (then Persian) version is returned with isFallback, so the URL
 * still works but is not indexed. `undefined` means the database was unreachable.
 */
export async function getPublishedSitePage(
  slug: string,
  locale: string,
): Promise<PublishedSitePage | null | undefined> {
  if (!isSitePageSlug(slug)) return null;
  const rows = await publishedPages();
  if (!rows) return undefined;
  const row = rows.find((candidate) => candidate.slug === slug);
  if (!row) return null;

  const exact = toPublicPage(row, catalogDataLocale(locale));
  const page = exact ?? toPublicPage(row, "en-US") ?? toPublicPage(row, "fa-IR");
  if (!page) return null;
  return { page, locales: sitePageLocales(row), isFallback: !exact };
}

/** Footer links: published pages flagged for the footer, translated in this locale. */
export async function getFooterPages(locale: string): Promise<FooterPageLink[]> {
  const rows = (await publishedPages()) ?? [];
  const key = catalogDataLocale(locale);
  return rows
    .filter((row) => row.showInFooter && isSitePageSlug(row.slug))
    .map((row) => {
      const title =
        pick(asTranslations(row.titleTranslations), key) ||
        pick(asTranslations(row.titleTranslations), "en-US");
      return title ? { slug: row.slug as SitePageSlug, title } : null;
    })
    .filter((link): link is FooterPageLink => link !== null);
}

/** Sitemap / llms.txt: published slugs with the locales each one is translated into. */
export async function getPublishedSitePageIndex(): Promise<
  { slug: SitePageSlug; locales: SeoLocale[]; updatedAt: string | null }[]
> {
  const rows = (await publishedPages()) ?? [];
  return rows
    .filter((row) => isSitePageSlug(row.slug))
    .map((row) => ({ slug: row.slug as SitePageSlug, locales: sitePageLocales(row), updatedAt: row.updatedAt }))
    .filter((entry) => entry.locales.length > 0);
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

type FaqRow = {
  id: string;
  scope: FaqScope;
  entityId: string | null;
  entityKey: string | null;
  entityLabel: string | null;
  questionTranslations: unknown;
  answerTranslations: unknown;
  displayOrder: number | string;
  isActive: boolean;
  updatedAt: string;
};

const faqColumns = () => sql`
  f.id::text as id,
  f.scope,
  f.entity_id::text as "entityId",
  f.entity_key as "entityKey",
  f.question_translations as "questionTranslations",
  f.answer_translations as "answerTranslations",
  f.display_order as "displayOrder",
  f.is_active as "isActive",
  f.updated_at::text as "updatedAt"
`;

const toAdminFaq = (row: FaqRow): FaqAdminRow => ({
  id: row.id,
  scope: row.scope,
  entityId: row.entityId,
  entityKey: row.entityKey,
  entityLabel: row.entityLabel ?? null,
  question: asTranslations(row.questionTranslations),
  answer: asTranslations(row.answerTranslations),
  displayOrder: Number(row.displayOrder ?? 0),
  isActive: Boolean(row.isActive),
  updatedAt: row.updatedAt,
});

/** Admin label for the entity an item targets (soft reference; may be gone). */
const entityLabel = (locale: string) => sql`
  case f.scope
    when 'provider' then (select common.get_translation_t(x.name_translations, ${locale}::text, 'en-US') from category.service_providers x where x.id = f.entity_id)
    when 'specialist' then (select common.get_translation_t(x.name_translations, ${locale}::text, 'en-US') from category.staff x where x.id = f.entity_id)
    when 'service' then (select common.get_translation_t(x.display_name_translations, ${locale}::text, 'en-US') from category.provider_services x where x.id = f.entity_id)
    when 'category' then (select common.get_translation_t(x.name_translations, ${locale}::text, 'en-US') from category.categories x where x.id = f.entity_id)
    when 'provider_type' then (select common.get_translation_t(x.name_translations, ${locale}::text, 'en-US') from category.provider_types x where x.id = f.entity_id)
    else null
  end
`;

export interface AdminFaqFilter {
  scope?: FaqScope | null;
  entityKey?: string | null;
  locale?: string;
}

export async function listAdminFaqs(filter: AdminFaqFilter = {}): Promise<FaqAdminRow[]> {
  const locale = filter.locale ?? "fa-IR";
  const rows = await sql<FaqRow[]>`
    select ${faqColumns()}, ${entityLabel(locale)} as "entityLabel"
    from content.faq_items f
    where (${filter.scope ?? null}::text is null or f.scope = ${filter.scope ?? null})
      and (${filter.entityKey ?? null}::text is null or f.entity_key = ${filter.entityKey ?? null})
    order by f.scope asc, f.entity_key asc nulls first, f.entity_id asc nulls first, f.display_order asc, f.created_at asc
  `;
  return rows.map(toAdminFaq);
}

export async function getAdminFaq(id: string, locale = "fa-IR"): Promise<FaqAdminRow | null> {
  const rows = await sql<FaqRow[]>`
    select ${faqColumns()}, ${entityLabel(locale)} as "entityLabel"
    from content.faq_items f
    where f.id::text = ${id}
  `;
  return rows[0] ? toAdminFaq(rows[0]) : null;
}

async function loadFaqs(scope: FaqScope, entityId: string | null, entityKey: string | null) {
  return sql<FaqRow[]>`
    select ${faqColumns()}, null::text as "entityLabel"
    from content.faq_items f
    where f.is_active
      and f.scope = ${scope}
      and (
        (${entityKey}::text is not null and f.entity_key = ${entityKey})
        or (${entityKey}::text is null and (f.entity_id is null or f.entity_id::text = ${entityId}))
      )
    order by f.display_order asc, f.created_at asc
  `;
}

const cachedFaqs = unstable_cache(loadFaqs, ["site-content-faqs-v1"], {
  revalidate: 3600,
  tags: [SITE_CONTENT_TAG],
});

/** Scope-wide seed items for the static build (seed content targets no catalog ids). */
const seedFaqRows = (scope: FaqScope, entityKey: string | null): FaqRow[] =>
  seedFaqItems()
    .filter((item) => item.scope === scope && item.entityKey === entityKey)
    .map((item) => ({
      id: item.seedKey,
      scope: item.scope,
      entityId: null,
      entityKey: item.entityKey,
      entityLabel: null,
      questionTranslations: item.question,
      answerTranslations: item.answer,
      displayOrder: item.displayOrder,
      isActive: true,
      updatedAt: SEED_UPDATED_AT,
    }));

/**
 * FAQ items for a page. Items written for this exact entity replace the
 * scope-wide set (a provider with its own FAQ does not also show the generic
 * one). Items without a translation in `locale` are skipped. Never throws:
 * an unreadable database renders the page without its FAQ block.
 */
export async function getFaqs(target: FaqTarget, locale: string): Promise<PublicFaqItem[]> {
  const entityKey = scopeUsesKey(target.scope) ? (target.entityKey ?? null) : null;
  if (scopeUsesKey(target.scope) && !entityKey) return [];
  const entityId = scopeUsesKey(target.scope) ? null : (target.entityId ?? null);

  let rows: FaqRow[];
  try {
    rows = isBuildPhase() ? seedFaqRows(target.scope, entityKey) : await cachedFaqs(target.scope, entityId, entityKey);
    if (!Array.isArray(rows)) throw new Error("unexpected result from content.faq_items");
  } catch (error) {
    console.error("site-content: FAQ read failed", { scope: target.scope, entityId, entityKey, error });
    return [];
  }

  const specific = entityId ? rows.filter((row) => row.entityId === entityId) : [];
  const chosen = specific.length || target.exact ? specific : rows.filter((row) => row.entityId === null);
  const key = catalogDataLocale(locale);
  return chosen
    .map((row) => ({
      id: row.id,
      question: pick(asTranslations(row.questionTranslations), key),
      answer: pick(asTranslations(row.answerTranslations), key),
    }))
    .filter((item) => hasText(item.question) && hasText(item.answer));
}
