import "server-only";

import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { routing } from "@/i18n/routing";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import type { SeoLocale } from "@/lib/seo/alternates";

import { fallbackExcerpt, mediaIdsOf } from "../blocks/derive";
import { readBlocks, type Block } from "../blocks/schema";
import type {
  AuthorRow,
  CategoryRow,
  PostAdmin,
  PostStatus,
  PostSummary,
  PostTranslationAdmin,
  PublicPost,
  PublicPostCard,
  RevisionRow,
} from "../types";
import { mediaUrl, resolveMedia } from "./media";

/** Every public blog read is cached under this tag; editorial saves revalidate it. */
export const BLOG_TAG = "global:blog";

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

const asTranslations = (value: unknown): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : {};

const pick = (translations: Record<string, string>, key: string) => (translations[key] ?? "").trim();
/** Text for a locale, else English, else Persian — for names and labels (never body text). */
const label = (translations: Record<string, string>, key: string) =>
  pick(translations, key) || pick(translations, "en-US") || pick(translations, "fa-IR") || Object.values(translations).find(Boolean) || "";

const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : "");

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export interface AdminPostFilter {
  q?: string | null;
  status?: PostStatus | null;
  categoryId?: string | null;
}

type SummaryRow = {
  id: string;
  slug: string;
  categoryId: string | null;
  categoryName: unknown;
  authorId: string | null;
  isFeatured: boolean;
  featuredMedia: string | null;
  updatedAt: Date;
  translations: { localeKey: string; status: PostStatus; title: string; publishedAt: string | null; updatedAt: string }[];
};

export async function listAdminPosts(filter: AdminPostFilter = {}, locale = "fa-IR"): Promise<PostSummary[]> {
  const q = filter.q?.trim() ? `%${filter.q.trim().replace(/[\\%_]/gu, (c) => `\\${c}`)}%` : null;
  const rows = await sql<SummaryRow[]>`
    select
      p.id::text as id,
      p.slug,
      p.category_id::text as "categoryId",
      c.name_translations as "categoryName",
      p.author_id::text as "authorId",
      p.is_featured as "isFeatured",
      p.featured_media as "featuredMedia",
      p.updated_at as "updatedAt",
      coalesce((
        select json_agg(json_build_object(
          'localeKey', t.locale_key, 'status', t.status, 'title', t.title,
          'publishedAt', t.published_at, 'updatedAt', t.updated_at) order by t.locale_key)
        from content.post_translations t where t.post_id = p.id
      ), '[]'::json) as translations
    from content.posts p
    left join content.post_categories c on c.id = p.category_id
    where (${filter.categoryId ?? null}::text is null or p.category_id::text = ${filter.categoryId ?? null})
      and (${filter.status ?? null}::text is null or exists (
        select 1 from content.post_translations t where t.post_id = p.id and t.status = ${filter.status ?? null}))
      and (${q}::text is null or p.slug ilike ${q} or exists (
        select 1 from content.post_translations t where t.post_id = p.id and t.title ilike ${q}))
    order by p.updated_at desc
    limit 300
  `;
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    categoryId: row.categoryId,
    categoryName: row.categoryName ? label(asTranslations(row.categoryName), locale) || null : null,
    authorId: row.authorId,
    isFeatured: row.isFeatured,
    featuredMedia: row.featuredMedia,
    updatedAt: iso(row.updatedAt),
    translations: row.translations.map((t) => ({ ...t, publishedAt: t.publishedAt ? iso(t.publishedAt) : null, updatedAt: iso(t.updatedAt) })),
  }));
}

type PostRow = {
  id: string;
  slug: string;
  categoryId: string | null;
  authorId: string | null;
  reviewerId: string | null;
  lastReviewedAt: Date | null;
  featuredMedia: string | null;
  isFeatured: boolean;
  isMedical: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TranslationRow = {
  localeKey: string;
  status: PostStatus;
  title: string;
  excerpt: string;
  blocks: unknown;
  seoTitle: string;
  seoDescription: string;
  ogMedia: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

type AutosaveRow = { localeKey: string; title: string; excerpt: string; blocks: unknown; createdAt: Date };

export async function getAdminPost(id: string): Promise<PostAdmin | null> {
  const posts = await sql<PostRow[]>`
    select
      p.id::text as id, p.slug, p.category_id::text as "categoryId", p.author_id::text as "authorId",
      p.reviewer_id::text as "reviewerId", p.last_reviewed_at as "lastReviewedAt",
      p.featured_media as "featuredMedia", p.is_featured as "isFeatured", p.is_medical as "isMedical",
      p.created_at as "createdAt", p.updated_at as "updatedAt"
    from content.posts p
    where p.id::text = ${id}
  `;
  const post = posts[0];
  if (!post) return null;

  const [translations, autosaves] = await Promise.all([
    sql<TranslationRow[]>`
      select
        t.locale_key as "localeKey", t.status, t.title, t.excerpt, t.blocks,
        t.seo_title as "seoTitle", t.seo_description as "seoDescription", t.og_media as "ogMedia",
        t.published_at as "publishedAt", t.updated_at as "updatedAt"
      from content.post_translations t
      where t.post_id::text = ${id}
    `,
    sql<AutosaveRow[]>`
      select r.locale_key as "localeKey", r.title, r.excerpt, r.blocks, r.created_at as "createdAt"
      from content.post_revisions r
      where r.post_id::text = ${id} and r.kind = 'autosave'
    `,
  ]);

  const autosaveByLocale = new Map(autosaves.map((row) => [row.localeKey, row]));
  const byLocale: Record<string, PostTranslationAdmin> = {};
  const toAutosave = (row: AutosaveRow | undefined, savedAt: Date | undefined) =>
    row && (!savedAt || row.createdAt > savedAt)
      ? { title: row.title, excerpt: row.excerpt, blocks: readBlocks(row.blocks), savedAt: iso(row.createdAt) }
      : null;

  for (const row of translations) {
    byLocale[row.localeKey] = {
      localeKey: row.localeKey,
      status: row.status,
      title: row.title,
      excerpt: row.excerpt,
      blocks: readBlocks(row.blocks),
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      ogMedia: row.ogMedia,
      publishedAt: row.publishedAt ? iso(row.publishedAt) : null,
      updatedAt: iso(row.updatedAt),
      autosave: toAutosave(autosaveByLocale.get(row.localeKey), row.updatedAt),
    };
  }
  // An autosave for a language that was never saved (the editor crashed before the first save).
  for (const [localeKey, row] of autosaveByLocale) {
    if (byLocale[localeKey]) continue;
    byLocale[localeKey] = {
      localeKey,
      status: "draft",
      title: "",
      excerpt: "",
      blocks: [],
      seoTitle: "",
      seoDescription: "",
      ogMedia: null,
      publishedAt: null,
      updatedAt: iso(row.createdAt),
      autosave: toAutosave(row, undefined),
    };
  }

  return {
    id: post.id,
    slug: post.slug,
    categoryId: post.categoryId,
    authorId: post.authorId,
    reviewerId: post.reviewerId,
    lastReviewedAt: post.lastReviewedAt ? iso(post.lastReviewedAt) : null,
    featuredMedia: post.featuredMedia,
    featuredUrl: mediaUrl(post.featuredMedia),
    isFeatured: post.isFeatured,
    isMedical: post.isMedical,
    createdAt: iso(post.createdAt),
    updatedAt: iso(post.updatedAt),
    translations: byLocale,
  };
}

export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await sql<{ id: string; slug: string; name: unknown; sortOrder: number; isActive: boolean }[]>`
    select id::text as id, slug, name_translations as name, sort_order as "sortOrder", is_active as "isActive"
    from content.post_categories order by sort_order asc, slug asc
  `;
  return rows.map((row) => ({ ...row, name: asTranslations(row.name) }));
}

export async function listAuthors(): Promise<AuthorRow[]> {
  const rows = await sql<
    { id: string; name: unknown; bio: unknown; credentials: unknown; avatarMedia: string | null; isMedicalReviewer: boolean }[]
  >`
    select id::text as id, name_translations as name, bio_translations as bio,
           credentials_translations as credentials, avatar_media as "avatarMedia",
           is_medical_reviewer as "isMedicalReviewer"
    from content.post_authors where is_active order by created_at asc
  `;
  return rows.map((row) => ({
    ...row,
    name: asTranslations(row.name),
    bio: asTranslations(row.bio),
    credentials: asTranslations(row.credentials),
  }));
}

export async function listRevisions(postId: string, localeKey: string, limit = 40): Promise<RevisionRow[]> {
  const rows = await sql<{ id: string; localeKey: string; kind: RevisionRow["kind"]; title: string; createdAt: Date }[]>`
    select id::text as id, locale_key as "localeKey", kind, title, created_at as "createdAt"
    from content.post_revisions
    where post_id::text = ${postId} and locale_key = ${localeKey}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}

export async function getRevisionBlocks(
  revisionId: string,
): Promise<{ postId: string; localeKey: string; title: string; excerpt: string; blocks: Block[] } | null> {
  const rows = await sql<{ postId: string; localeKey: string; title: string; excerpt: string; blocks: unknown }[]>`
    select post_id::text as "postId", locale_key as "localeKey", title, excerpt, blocks
    from content.post_revisions where id::text = ${revisionId}
  `;
  const row = rows[0];
  return row ? { ...row, blocks: readBlocks(row.blocks) } : null;
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

type PublicTranslation = {
  localeKey: string;
  title: string;
  excerpt: string;
  blocks: unknown;
  seoTitle: string;
  seoDescription: string;
  ogMedia: string | null;
  publishedAt: Date | string;
  updatedAt: Date | string;
  readingMinutes: number;
};

// Fragments are built per query (postgres.js fragments are not reusable across queries).
const pub = () => sql`t.status = 'published' and t.published_at <= now()`;

/** Route locales that have a published translation, from locale keys. */
export function localesForKeys(keys: readonly string[]): SeoLocale[] {
  const have = new Set(keys);
  return routing.locales.filter((locale) => have.has(catalogDataLocale(locale))) as SeoLocale[];
}

export interface PublishedList {
  items: PublicPostCard[];
  total: number;
  page: number;
  pageSize: number;
}

async function loadPublishedList(localeKey: string, categorySlug: string | null, page: number, pageSize: number): Promise<PublishedList> {
  const offset = (page - 1) * pageSize;
  const where = () => sql`
    ${pub()} and t.locale_key = ${localeKey}
    and (${categorySlug}::text is null or c.slug = ${categorySlug})
  `;
  const [rows, count] = await Promise.all([
    sql<
      {
        slug: string;
        title: string;
        excerpt: string;
        blocks: unknown;
        featuredMedia: string | null;
        ogMedia: string | null;
        categorySlug: string | null;
        categoryName: unknown;
        publishedAt: Date;
        readingMinutes: number;
      }[]
    >`
      select p.slug, t.title, t.excerpt, t.blocks, p.featured_media as "featuredMedia", t.og_media as "ogMedia",
             c.slug as "categorySlug", c.name_translations as "categoryName",
             t.published_at as "publishedAt", t.reading_minutes as "readingMinutes"
      from content.post_translations t
      join content.posts p on p.id = t.post_id
      left join content.post_categories c on c.id = p.category_id and c.is_active
      where ${where()}
      order by p.is_featured desc, t.published_at desc, p.slug asc
      limit ${pageSize} offset ${offset}
    `,
    sql<{ total: number }[]>`
      select count(*)::int as total
      from content.post_translations t
      join content.posts p on p.id = t.post_id
      left join content.post_categories c on c.id = p.category_id and c.is_active
      where ${where()}
    `,
  ]);

  const media = await resolveMedia(rows.map((row) => row.featuredMedia ?? "").filter(Boolean));
  return {
    total: count[0]?.total ?? 0,
    page,
    pageSize,
    items: rows.map((row) => {
      const image = row.featuredMedia ? media[row.featuredMedia] : undefined;
      return {
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt || fallbackExcerpt(readBlocks(row.blocks)),
        imageUrl: image?.url ?? null,
        imageAlt: image ? pick(image.alt, localeKey) || row.title : "",
        categorySlug: row.categorySlug,
        categoryName: row.categoryName ? label(asTranslations(row.categoryName), localeKey) || null : null,
        publishedAt: iso(row.publishedAt),
        readingMinutes: row.readingMinutes,
      };
    }),
  };
}

const cachedPublishedList = unstable_cache(loadPublishedList, ["blog-list-v1"], { revalidate: 300, tags: [BLOG_TAG] });

/** Published posts in one language, or undefined when the database cannot be read. */
export async function getPublishedPosts(
  locale: string,
  options: { categorySlug?: string | null; page?: number; pageSize?: number } = {},
): Promise<PublishedList | undefined> {
  if (isBuildPhase()) return { items: [], total: 0, page: 1, pageSize: options.pageSize ?? 12 };
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(48, Math.max(1, Math.floor(options.pageSize ?? 12)));
  try {
    return await cachedPublishedList(catalogDataLocale(locale), options.categorySlug ?? null, page, pageSize);
  } catch (error) {
    console.error("blog: published list read failed", { error });
    return undefined;
  }
}

interface RawPost {
  id: string;
  slug: string;
  isMedical: boolean;
  lastReviewedAt: string | null;
  featuredMedia: string | null;
  categorySlug: string | null;
  categoryName: Record<string, string>;
  author: { name: Record<string, string>; bio: Record<string, string>; credentials: Record<string, string>; avatarMedia: string | null } | null;
  reviewer: { name: Record<string, string>; credentials: Record<string, string> } | null;
  translations: Record<string, PublicTranslation & { publishedAt: string; updatedAt: string }>;
  media: Awaited<ReturnType<typeof resolveMedia>>;
}

/**
 * One post with its translations. `preview` reads every status (and a newer autosave) for the admin
 * preview; otherwise only translations that are public right now.
 */
async function loadPostRaw(slug: string | null, id: string | null, preview: boolean): Promise<RawPost | null> {
  const posts = await sql<
    {
      id: string;
      slug: string;
      isMedical: boolean;
      lastReviewedAt: Date | null;
      featuredMedia: string | null;
      categorySlug: string | null;
      categoryName: unknown;
      authorName: unknown;
      authorBio: unknown;
      authorCredentials: unknown;
      authorAvatar: string | null;
      authorId: string | null;
      reviewerName: unknown;
      reviewerCredentials: unknown;
      reviewerId: string | null;
    }[]
  >`
    select p.id::text as id, p.slug, p.is_medical as "isMedical", p.last_reviewed_at as "lastReviewedAt",
           p.featured_media as "featuredMedia", c.slug as "categorySlug", c.name_translations as "categoryName",
           a.id::text as "authorId", a.name_translations as "authorName", a.bio_translations as "authorBio",
           a.credentials_translations as "authorCredentials", a.avatar_media as "authorAvatar",
           r.id::text as "reviewerId", r.name_translations as "reviewerName", r.credentials_translations as "reviewerCredentials"
    from content.posts p
    left join content.post_categories c on c.id = p.category_id and c.is_active
    left join content.post_authors a on a.id = p.author_id and a.is_active
    left join content.post_authors r on r.id = p.reviewer_id and r.is_active
    where (${slug}::text is null or p.slug = ${slug}) and (${id}::text is null or p.id::text = ${id})
  `;
  const post = posts[0];
  if (!post) return null;

  const rows = await sql<PublicTranslation[]>`
    select t.locale_key as "localeKey", t.title, t.excerpt, t.blocks,
           t.seo_title as "seoTitle", t.seo_description as "seoDescription", t.og_media as "ogMedia",
           t.published_at as "publishedAt", t.updated_at as "updatedAt", t.reading_minutes as "readingMinutes"
    from content.post_translations t
    where t.post_id::text = ${post.id} and (${preview}::boolean or ${pub()})
  `;
  if (preview) {
    const autosaves = await sql<{ localeKey: string; title: string; excerpt: string; blocks: unknown; createdAt: Date }[]>`
      select locale_key as "localeKey", title, excerpt, blocks, created_at as "createdAt"
      from content.post_revisions where post_id::text = ${post.id} and kind = 'autosave'
    `;
    for (const auto of autosaves) {
      const row = rows.find((candidate) => candidate.localeKey === auto.localeKey);
      if (row && new Date(auto.createdAt) > new Date(row.updatedAt)) Object.assign(row, { title: auto.title, excerpt: auto.excerpt, blocks: auto.blocks });
      else if (!row) rows.push({ localeKey: auto.localeKey, title: auto.title, excerpt: auto.excerpt, blocks: auto.blocks, seoTitle: "", seoDescription: "", ogMedia: null, publishedAt: auto.createdAt, updatedAt: auto.createdAt, readingMinutes: 1 });
    }
  }
  if (!rows.length) return null;

  const translations: RawPost["translations"] = {};
  const refs = new Set<string>();
  if (post.featuredMedia) refs.add(post.featuredMedia);
  if (post.authorAvatar) refs.add(post.authorAvatar);
  for (const row of rows) {
    // A draft (admin preview) has no publish date yet: show its last change instead of an empty date.
    translations[row.localeKey] = { ...row, publishedAt: iso(row.publishedAt) || iso(row.updatedAt), updatedAt: iso(row.updatedAt) };
    mediaIdsOf(readBlocks(row.blocks)).forEach((id) => refs.add(id));
    if (row.ogMedia) refs.add(row.ogMedia);
  }

  return {
    id: post.id,
    slug: post.slug,
    isMedical: post.isMedical,
    lastReviewedAt: post.lastReviewedAt ? iso(post.lastReviewedAt) : null,
    featuredMedia: post.featuredMedia,
    categorySlug: post.categorySlug,
    categoryName: asTranslations(post.categoryName),
    author: post.authorId
      ? { name: asTranslations(post.authorName), bio: asTranslations(post.authorBio), credentials: asTranslations(post.authorCredentials), avatarMedia: post.authorAvatar }
      : null,
    reviewer: post.reviewerId ? { name: asTranslations(post.reviewerName), credentials: asTranslations(post.reviewerCredentials) } : null,
    translations,
    media: await resolveMedia([...refs]),
  };
}

const cachedPostRaw = unstable_cache((slug: string) => loadPostRaw(slug, null, false), ["blog-post-v1"], { revalidate: 300, tags: [BLOG_TAG] });

export interface PublishedPost {
  post: PublicPost;
  /** Route locales with their own published translation; others render the fallback and are noindex. */
  locales: SeoLocale[];
  isFallback: boolean;
}

function toPublicPost(raw: RawPost, translation: RawPost["translations"][string], localeKey: string): PublicPost {
  const blocks = readBlocks(translation.blocks);
  const featured = raw.featuredMedia ? raw.media[raw.featuredMedia] : undefined;
  const og = translation.ogMedia ? raw.media[translation.ogMedia] : undefined;
  const author = raw.author && label(raw.author.name, localeKey)
    ? {
        name: label(raw.author.name, localeKey),
        bio: label(raw.author.bio, localeKey),
        credentials: label(raw.author.credentials, localeKey),
        avatarUrl: raw.author.avatarMedia ? (raw.media[raw.author.avatarMedia]?.url ?? null) : null,
      }
    : null;
  const reviewer = raw.reviewer && label(raw.reviewer.name, localeKey)
    ? { name: label(raw.reviewer.name, localeKey), credentials: label(raw.reviewer.credentials, localeKey) }
    : null;
  return {
    id: raw.id,
    slug: raw.slug,
    title: translation.title,
    excerpt: translation.excerpt || fallbackExcerpt(blocks),
    imageUrl: featured?.url ?? null,
    imageAlt: featured ? pick(featured.alt, localeKey) || translation.title : "",
    categorySlug: raw.categorySlug,
    categoryName: label(raw.categoryName, localeKey) || null,
    publishedAt: translation.publishedAt,
    readingMinutes: translation.readingMinutes,
    blocks,
    seoTitle: translation.seoTitle,
    seoDescription: translation.seoDescription,
    ogImageUrl: og?.url ?? featured?.url ?? null,
    updatedAt: translation.updatedAt,
    author,
    reviewer,
    lastReviewedAt: raw.lastReviewedAt,
    isMedical: raw.isMedical,
    media: raw.media,
    localeKeys: Object.keys(raw.translations),
  };
}

/**
 * A published post in the requested language; without a translation the English (then Persian)
 * version is returned with isFallback so the URL still works but is not indexed. `null` = no such
 * published post, `undefined` = the database could not be read (callers fail the ISR pass).
 */
export async function getPublishedPost(slug: string, locale: string): Promise<PublishedPost | null | undefined> {
  if (isBuildPhase()) return null;
  let raw: RawPost | null;
  try {
    raw = await cachedPostRaw(slug);
  } catch (error) {
    console.error("blog: post read failed", { slug, error });
    return undefined;
  }
  if (!raw) return null;
  const key = catalogDataLocale(locale);
  const exactKey = raw.translations[key] ? key : null;
  const chosenKey = exactKey ?? (raw.translations["en-US"] ? "en-US" : raw.translations["fa-IR"] ? "fa-IR" : Object.keys(raw.translations)[0]);
  return {
    post: toPublicPost(raw, raw.translations[chosenKey], chosenKey),
    locales: localesForKeys(Object.keys(raw.translations)),
    isFallback: !exactKey,
  };
}

/**
 * Admin preview: the saved draft (or a newer autosave) of one language through the same mapping as
 * the public page. Not cached, never indexed.
 */
export async function getPreviewPost(id: string, locale: string): Promise<PublishedPost | null> {
  const raw = await loadPostRaw(null, id, true);
  if (!raw) return null;
  const key = catalogDataLocale(locale);
  const chosen = raw.translations[key] ? key : Object.keys(raw.translations)[0];
  if (!chosen) return null;
  return { post: toPublicPost(raw, raw.translations[chosen], chosen), locales: localesForKeys(Object.keys(raw.translations)), isFallback: chosen !== key };
}

/** The current slug for a retired one, or null. */
export async function getSlugRedirect(oldSlug: string): Promise<string | null | undefined> {
  if (isBuildPhase()) return null;
  try {
    const rows = await sql<{ slug: string }[]>`
      select p.slug
      from content.post_slug_history h
      join content.posts p on p.id = h.post_id
      where h.old_slug = ${oldSlug}
        and exists (select 1 from content.post_translations t where t.post_id = p.id and ${pub()})
    `;
    return rows[0]?.slug ?? null;
  } catch (error) {
    console.error("blog: slug history read failed", { oldSlug, error });
    return undefined;
  }
}

async function loadRelated(postId: string, localeKey: string, limit: number): Promise<PublicPostCard[]> {
  const rows = await sql<{ slug: string; title: string; excerpt: string; blocks: unknown; featuredMedia: string | null; categorySlug: string | null; publishedAt: Date; readingMinutes: number }[]>`
    select p.slug, t.title, t.excerpt, t.blocks, p.featured_media as "featuredMedia", c.slug as "categorySlug",
           t.published_at as "publishedAt", t.reading_minutes as "readingMinutes"
    from content.posts base
    join content.posts p on p.id <> base.id
    join content.post_translations t on t.post_id = p.id and ${pub()} and t.locale_key = ${localeKey}
    left join content.post_categories c on c.id = p.category_id
    where base.id::text = ${postId}
    order by (p.category_id is not distinct from base.category_id) desc, t.published_at desc
    limit ${limit}
  `;
  const media = await resolveMedia(rows.map((row) => row.featuredMedia ?? "").filter(Boolean));
  return rows.map((row) => {
    const image = row.featuredMedia ? media[row.featuredMedia] : undefined;
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt || fallbackExcerpt(readBlocks(row.blocks), 140),
      imageUrl: image?.url ?? null,
      imageAlt: image ? pick(image.alt, localeKey) || row.title : "",
      categorySlug: row.categorySlug,
      categoryName: null,
      publishedAt: iso(row.publishedAt),
      readingMinutes: row.readingMinutes,
    };
  });
}

const cachedRelated = unstable_cache(loadRelated, ["blog-related-v1"], { revalidate: 300, tags: [BLOG_TAG] });

/** Other posts in the same language, same category first. Never throws. */
export async function getRelatedPosts(postId: string, locale: string, limit = 3): Promise<PublicPostCard[]> {
  if (isBuildPhase()) return [];
  try {
    return await cachedRelated(postId, catalogDataLocale(locale), limit);
  } catch (error) {
    console.error("blog: related posts read failed", { postId, error });
    return [];
  }
}

export interface PublicCategory {
  slug: string;
  name: string;
  count: number;
}

async function loadCategories(localeKey: string): Promise<PublicCategory[]> {
  const rows = await sql<{ slug: string; name: unknown; count: number }[]>`
    select c.slug, c.name_translations as name, count(*)::int as count
    from content.post_categories c
    join content.posts p on p.category_id = c.id
    join content.post_translations t on t.post_id = p.id and ${pub()} and t.locale_key = ${localeKey}
    where c.is_active
    group by c.id
    order by c.sort_order asc, c.slug asc
  `;
  return rows.map((row) => ({ slug: row.slug, name: label(asTranslations(row.name), localeKey), count: row.count })).filter((row) => row.name);
}

const cachedCategories = unstable_cache(loadCategories, ["blog-categories-v1"], { revalidate: 300, tags: [BLOG_TAG] });

export async function getPublicCategories(locale: string): Promise<PublicCategory[]> {
  if (isBuildPhase()) return [];
  try {
    return await cachedCategories(catalogDataLocale(locale));
  } catch (error) {
    console.error("blog: categories read failed", { error });
    return [];
  }
}

/** Sitemap / llms.txt / feed: published slugs with the locales each is published in. */
export async function getPublishedPostIndex(): Promise<{ slug: string; locales: SeoLocale[]; updatedAt: string; titles: Record<string, string> }[]> {
  if (isBuildPhase()) return [];
  try {
    const rows = await sql<{ slug: string; keys: string[]; titles: Record<string, string>; updatedAt: Date }[]>`
      select p.slug,
             array_agg(t.locale_key order by t.locale_key) as keys,
             json_object_agg(t.locale_key, t.title) as titles,
             max(t.updated_at) as "updatedAt"
      from content.posts p
      join content.post_translations t on t.post_id = p.id and ${pub()}
      group by p.id
      order by max(t.published_at) desc
    `;
    return rows
      .map((row) => ({ slug: row.slug, locales: localesForKeys(row.keys), updatedAt: iso(row.updatedAt), titles: row.titles }))
      .filter((row) => row.locales.length > 0);
  } catch (error) {
    // The sitemap must not fail the build or cache an empty list on an outage.
    console.error("blog: post index read failed", { error });
    return [];
  }
}
