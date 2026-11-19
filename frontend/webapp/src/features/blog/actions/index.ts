"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import sql from "@/config/database/db";
import { adminMay, getAdminContext } from "@/lib/auth/admin-guard";

import { blocksPlainText, readingMinutes } from "../blocks/derive";
import { blockingIssues, checkReadiness } from "../blocks/readiness";
import { parseBlocks } from "../blocks/schema";
import { BLOG_TAG, getRevisionBlocks, listRevisions } from "../server/repository";
import type { PostStatus, RevisionRow } from "../types";
import {
  conflict,
  failed,
  forbidden,
  invalid,
  notFound,
  pgCode,
  pgConstraint,
  type BlogActionFailure,
  type BlogActionResult,
} from "./result";
import {
  AuthorSchema,
  AutosaveSchema,
  CategorySchema,
  CreatePostSchema,
  IdSchema,
  PostSettingsSchema,
  TranslationRefSchema,
  TranslationSchema,
  type AuthorInput,
  type AutosaveInput,
  type CategoryInput,
  type CreatePostInput,
  type PostSettingsInput,
  type TranslationInput,
} from "./schema";

// Audit columns only: a session id that is not a GUID must not fail the save.
const auditUser = (userId?: string) => (userId && z.guid().safeParse(userId).success ? userId : null);

type Gate = { allowed: true; userId: string | null } | { allowed: false };

/** Blog content is governed by the `blog` permission (sidebar row /admin/blog; see src/lib/admin/access/README.md). */
async function gate(): Promise<Gate> {
  const ctx = await getAdminContext();
  if (!adminMay(ctx, "blog")) return { allowed: false };
  return { allowed: true, userId: auditUser(ctx.userId) };
}

// Every blog write changes public pages, the sitemap, llms.txt and the feed.
const revalidateBlog = () => revalidateTag(BLOG_TAG);

const MAX_SAVE_REVISIONS = 30;
const MAX_SEARCH_TEXT = 100_000;

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

/** Creates a post with one draft translation. */
export async function createPostAction(input: CreatePostInput): Promise<BlogActionResult<{ id: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = CreatePostSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const id = await sql.begin(async (tx) => {
      const rows = await tx<{ id: string }[]>`
        insert into content.posts (slug, created_by, updated_by)
        values (${data.slug}, ${access.userId}::uuid, ${access.userId}::uuid)
        returning id::text as id
      `;
      await tx`
        insert into content.post_translations (post_id, locale_key, status, title, updated_by)
        values (${rows[0].id}::uuid, ${data.localeKey}, 'draft', ${data.title}, ${access.userId}::uuid)
      `;
      return rows[0].id;
    });
    revalidateBlog();
    return { ok: true, data: { id } };
  } catch (error) {
    if (pgCode(error) === "23505") return conflict("This URL name is already used by another post.", { slug: "This URL name is already used." });
    console.error("createPostAction failed", { slug: data.slug, error });
    return failed("Could not create the post. Please try again.");
  }
}

/** Slug, category, author, reviewer, featured image and flags. A slug change keeps the old URL working. */
export async function savePostSettingsAction(input: PostSettingsInput): Promise<BlogActionResult<{ slug: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = PostSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const outcome = await sql.begin(async (tx) => {
      const current = await tx<{ slug: string }[]>`select slug from content.posts where id::text = ${data.id} for update`;
      if (!current.length) return "missing" as const;
      const oldSlug = current[0].slug;
      if (oldSlug !== data.slug) {
        // A retired slug of ANOTHER post must not be reused: it would shadow that post's redirect.
        const taken = await tx<{ post_id: string }[]>`select post_id::text as post_id from content.post_slug_history where old_slug = ${data.slug}`;
        if (taken.length && taken[0].post_id !== data.id) return "slug-retired" as const;
        await tx`delete from content.post_slug_history where old_slug = ${data.slug}`;
        await tx`
          insert into content.post_slug_history (old_slug, post_id) values (${oldSlug}, ${data.id}::uuid)
          on conflict (old_slug) do update set post_id = excluded.post_id, changed_at = now()
        `;
      }
      await tx`
        update content.posts set
          slug = ${data.slug},
          category_id = ${data.categoryId}::uuid,
          author_id = ${data.authorId}::uuid,
          reviewer_id = ${data.reviewerId}::uuid,
          last_reviewed_at = ${data.lastReviewedAt}::timestamptz,
          featured_media = ${data.featuredMedia},
          is_featured = ${data.isFeatured},
          is_medical = ${data.isMedical},
          updated_by = ${access.userId}::uuid,
          updated_at = now()
        where id::text = ${data.id}
      `;
      return "ok" as const;
    });
    if (outcome === "missing") return notFound("This post no longer exists.");
    if (outcome === "slug-retired") return conflict("This URL name was used by another post before and redirects to it.", { slug: "This URL name is reserved." });
    revalidateBlog();
    return { ok: true, data: { slug: data.slug } };
  } catch (error) {
    if (pgCode(error) === "23505") return conflict("This URL name is already used by another post.", { slug: "This URL name is already used." });
    if (pgCode(error) === "23503") return notFound("The selected category or author no longer exists.");
    console.error("savePostSettingsAction failed", { id: data.id, error });
    return failed("Could not save the post settings. Please try again.");
  }
}

export interface SavedTranslation {
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
}

/**
 * Saves one language of a post, optionally publishing/unpublishing/archiving it. Block content is
 * validated and re-sanitised here: the browser's copy is never trusted. Publishing additionally runs
 * the readiness rules (errors refuse the publish).
 */
export async function saveTranslationAction(input: TranslationInput): Promise<BlogActionResult<SavedTranslation>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = TranslationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const blocks = parseBlocks(data.blocks);
  if (!blocks.ok) {
    return { ok: false, code: "INVALID", message: blocks.message, blockIssues: blocks.issues } satisfies BlogActionFailure;
  }

  try {
    const posts = await sql<{ slug: string; featuredMedia: string | null; isMedical: boolean; reviewerId: string | null }[]>`
      select slug, featured_media as "featuredMedia", is_medical as "isMedical", reviewer_id::text as "reviewerId"
      from content.posts where id::text = ${data.postId}
    `;
    if (!posts.length) return notFound("This post no longer exists.");
    const post = posts[0];

    if (data.intent === "publish") {
      const issues = checkReadiness({
        slug: post.slug,
        title: data.title,
        excerpt: data.excerpt,
        seoDescription: data.seoDescription,
        blocks: blocks.blocks,
        featuredMedia: post.featuredMedia,
        isMedical: post.isMedical,
        hasReviewer: Boolean(post.reviewerId),
      });
      const blocking = blockingIssues(issues);
      if (blocking.length) {
        return { ok: false, code: "NOT_READY", message: "The post is not ready to publish.", readiness: issues };
      }
    }

    const text = blocksPlainText(blocks.blocks);
    const minutes = readingMinutes(text);
    const kind = data.intent === "publish" ? "publish" : "save";

    const saved = await sql.begin(async (tx) => {
      const existing = await tx<{ status: PostStatus; publishedAt: Date | null }[]>`
        select status, published_at as "publishedAt" from content.post_translations
        where post_id::text = ${data.postId} and locale_key = ${data.localeKey} for update
      `;
      const previous = existing[0];
      const status: PostStatus =
        data.intent === "publish" ? "published" : data.intent === "unpublish" ? "draft" : data.intent === "archive" ? "archived" : (previous?.status ?? "draft");
      // published_at: explicit value, else the existing one, else now (only meaningful when published).
      const requested = data.publishedAt ? new Date(data.publishedAt) : null;
      const publishedAt = status === "published" ? (requested ?? previous?.publishedAt ?? new Date()) : (previous?.publishedAt ?? null);

      const rows = await tx<{ status: PostStatus; publishedAt: Date | null; updatedAt: Date }[]>`
        insert into content.post_translations (
          post_id, locale_key, status, title, excerpt, blocks, schema_version, seo_title, seo_description,
          og_media, published_at, reading_minutes, search_text, updated_by
        ) values (
          ${data.postId}::uuid, ${data.localeKey}, ${status}, ${data.title}, ${data.excerpt},
          ${tx.json(blocks.blocks as never)}::jsonb, 1, ${data.seoTitle}, ${data.seoDescription},
          ${data.ogMedia}, ${publishedAt}::timestamptz, ${minutes}, ${text.slice(0, MAX_SEARCH_TEXT)}, ${access.userId}::uuid
        )
        on conflict (post_id, locale_key) do update set
          status = excluded.status,
          title = excluded.title,
          excerpt = excluded.excerpt,
          blocks = excluded.blocks,
          schema_version = excluded.schema_version,
          seo_title = excluded.seo_title,
          seo_description = excluded.seo_description,
          og_media = excluded.og_media,
          published_at = excluded.published_at,
          reading_minutes = excluded.reading_minutes,
          search_text = excluded.search_text,
          updated_by = excluded.updated_by,
          updated_at = now()
        returning status, published_at as "publishedAt", updated_at as "updatedAt"
      `;

      await tx`
        insert into content.post_revisions (post_id, locale_key, kind, title, excerpt, blocks, created_by)
        values (${data.postId}::uuid, ${data.localeKey}, ${kind}, ${data.title}, ${data.excerpt}, ${tx.json(blocks.blocks as never)}::jsonb, ${access.userId}::uuid)
      `;
      // The explicit save supersedes the crash-recovery copy.
      await tx`delete from content.post_revisions where post_id::text = ${data.postId} and locale_key = ${data.localeKey} and kind = 'autosave'`;
      await tx`
        delete from content.post_revisions where id in (
          select id from content.post_revisions
          where post_id::text = ${data.postId} and locale_key = ${data.localeKey} and kind = 'save'
          order by created_at desc offset ${MAX_SAVE_REVISIONS}
        )
      `;
      await tx`update content.posts set updated_at = now(), updated_by = ${access.userId}::uuid where id::text = ${data.postId}`;
      return rows[0];
    });

    revalidateBlog();
    return {
      ok: true,
      data: {
        status: saved.status,
        publishedAt: saved.publishedAt ? new Date(saved.publishedAt).toISOString() : null,
        updatedAt: new Date(saved.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    if (pgCode(error) === "23503") return notFound("This post no longer exists.");
    console.error("saveTranslationAction failed", { postId: data.postId, localeKey: data.localeKey, intent: data.intent, error });
    return failed("Could not save the post. Please try again.");
  }
}

/** Crash-recovery copy: one revision row per language, updated in place. Never touches the live post. */
export async function autosaveTranslationAction(input: AutosaveInput): Promise<BlogActionResult<{ savedAt: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = AutosaveSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  const blocks = parseBlocks(data.blocks);
  if (!blocks.ok) return { ok: false, code: "INVALID", message: blocks.message, blockIssues: blocks.issues };

  try {
    const rows = await sql<{ createdAt: Date }[]>`
      insert into content.post_revisions (post_id, locale_key, kind, title, excerpt, blocks, created_by)
      values (${data.postId}::uuid, ${data.localeKey}, 'autosave', ${data.title}, ${data.excerpt}, ${sql.json(blocks.blocks as never)}::jsonb, ${access.userId}::uuid)
      on conflict (post_id, locale_key) where kind = 'autosave' do update set
        title = excluded.title, excerpt = excluded.excerpt, blocks = excluded.blocks,
        created_by = excluded.created_by, created_at = now()
      returning created_at as "createdAt"
    `;
    return { ok: true, data: { savedAt: new Date(rows[0].createdAt).toISOString() } };
  } catch (error) {
    if (pgCode(error) === "23503") return notFound("This post no longer exists.");
    console.error("autosaveTranslationAction failed", { postId: data.postId, localeKey: data.localeKey, error });
    return failed("Autosave failed.");
  }
}

/** Saved revisions of one language, newest first. */
export async function listRevisionsAction(input: { postId: string; localeKey: string }): Promise<BlogActionResult<RevisionRow[]>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = TranslationRefSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    return { ok: true, data: await listRevisions(parsed.data.postId, parsed.data.localeKey) };
  } catch (error) {
    console.error("listRevisionsAction failed", { ...parsed.data, error });
    return failed("Could not load the history.");
  }
}

/** Reads one revision's content so the editor can load it (the editor then Saves explicitly). */
export async function getRevisionAction(input: { revisionId: string }): Promise<BlogActionResult<{ title: string; excerpt: string; blocks: unknown[]; localeKey: string; postId: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = z.object({ revisionId: z.guid() }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const revision = await getRevisionBlocks(parsed.data.revisionId);
    if (!revision) return notFound("This revision no longer exists.");
    return { ok: true, data: revision };
  } catch (error) {
    console.error("getRevisionAction failed", { revisionId: parsed.data.revisionId, error });
    return failed("Could not load the revision.");
  }
}

export async function deleteTranslationAction(input: { postId: string; localeKey: string }): Promise<BlogActionResult> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = TranslationRefSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const rows = await sql<{ localeKey: string }[]>`
      delete from content.post_translations where post_id::text = ${parsed.data.postId} and locale_key = ${parsed.data.localeKey}
      returning locale_key as "localeKey"
    `;
    await sql`delete from content.post_revisions where post_id::text = ${parsed.data.postId} and locale_key = ${parsed.data.localeKey} and kind = 'autosave'`;
    if (!rows.length) return notFound("This language no longer exists on the post.");
    revalidateBlog();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("deleteTranslationAction failed", { ...parsed.data, error });
    return failed("Could not delete this language. Please try again.");
  }
}

export async function deletePostAction(input: { id: string }): Promise<BlogActionResult> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const rows = await sql<{ id: string }[]>`delete from content.posts where id::text = ${parsed.data.id} returning id::text as id`;
    if (!rows.length) return notFound("This post no longer exists.");
    revalidateBlog();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("deletePostAction failed", { id: parsed.data.id, error });
    return failed("Could not delete the post. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Categories and authors
// ---------------------------------------------------------------------------

export async function saveCategoryAction(input: CategoryInput): Promise<BlogActionResult<{ id: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  try {
    const name = sql.json(data.name as never);
    const rows = data.id
      ? await sql<{ id: string }[]>`
          update content.post_categories set slug = ${data.slug}, name_translations = ${name}::jsonb,
            sort_order = ${data.sortOrder}, is_active = ${data.isActive}, updated_at = now()
          where id::text = ${data.id} returning id::text as id`
      : await sql<{ id: string }[]>`
          insert into content.post_categories (slug, name_translations, sort_order, is_active)
          values (${data.slug}, ${name}::jsonb, ${data.sortOrder}, ${data.isActive}) returning id::text as id`;
    if (!rows.length) return notFound("This category no longer exists.");
    revalidateBlog();
    return { ok: true, data: { id: rows[0].id } };
  } catch (error) {
    if (pgCode(error) === "23505") return conflict("This category URL name is already used.", { slug: "This URL name is already used." });
    console.error("saveCategoryAction failed", { id: data.id ?? null, constraint: pgConstraint(error), error });
    return failed("Could not save the category. Please try again.");
  }
}

export async function deleteCategoryAction(input: { id: string }): Promise<BlogActionResult> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    // Posts keep existing: their category becomes empty (FK on delete set null).
    const rows = await sql<{ id: string }[]>`delete from content.post_categories where id::text = ${parsed.data.id} returning id::text as id`;
    if (!rows.length) return notFound("This category no longer exists.");
    revalidateBlog();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("deleteCategoryAction failed", { id: parsed.data.id, error });
    return failed("Could not delete the category. Please try again.");
  }
}

export async function saveAuthorAction(input: AuthorInput): Promise<BlogActionResult<{ id: string }>> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = AuthorSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  try {
    const name = sql.json(data.name as never);
    const bio = sql.json(data.bio as never);
    const credentials = sql.json(data.credentials as never);
    const rows = data.id
      ? await sql<{ id: string }[]>`
          update content.post_authors set name_translations = ${name}::jsonb, bio_translations = ${bio}::jsonb,
            credentials_translations = ${credentials}::jsonb, avatar_media = ${data.avatarMedia},
            is_medical_reviewer = ${data.isMedicalReviewer}, updated_at = now()
          where id::text = ${data.id} and is_active returning id::text as id`
      : await sql<{ id: string }[]>`
          insert into content.post_authors (name_translations, bio_translations, credentials_translations, avatar_media, is_medical_reviewer)
          values (${name}::jsonb, ${bio}::jsonb, ${credentials}::jsonb, ${data.avatarMedia}, ${data.isMedicalReviewer})
          returning id::text as id`;
    if (!rows.length) return notFound("This author no longer exists.");
    revalidateBlog();
    return { ok: true, data: { id: rows[0].id } };
  } catch (error) {
    console.error("saveAuthorAction failed", { id: data.id ?? null, error });
    return failed("Could not save the author. Please try again.");
  }
}

/** Authors are retired, not deleted: published posts keep their history. */
export async function deleteAuthorAction(input: { id: string }): Promise<BlogActionResult> {
  const access = await gate();
  if (!access.allowed) return forbidden;
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const rows = await sql<{ id: string }[]>`
      update content.post_authors set is_active = false, updated_at = now()
      where id::text = ${parsed.data.id} and is_active returning id::text as id`;
    if (!rows.length) return notFound("This author no longer exists.");
    revalidateBlog();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("deleteAuthorAction failed", { id: parsed.data.id, error });
    return failed("Could not remove the author. Please try again.");
  }
}
