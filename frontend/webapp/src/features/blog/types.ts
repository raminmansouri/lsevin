/**
 * Blog: posts written as ordered blocks, one independent document per language.
 * Stored in the `content` schema (migration 0120). See docs/blog-cms/BLOG-SUBSYSTEM-DESIGN.md.
 */
import type { Block } from "./blocks/schema";

export const POST_STATUSES = ["draft", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/u;
export const MAX_SLUG_LENGTH = 120;

/** Translation key used in every `*_translations` map and in post_translations.locale_key. */
export type LocaleKey = string;

export interface PostSummary {
  id: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  authorId: string | null;
  isFeatured: boolean;
  featuredMedia: string | null;
  updatedAt: string;
  translations: { localeKey: LocaleKey; status: PostStatus; title: string; publishedAt: string | null; updatedAt: string }[];
}

export interface PostTranslationAdmin {
  localeKey: LocaleKey;
  status: PostStatus;
  title: string;
  excerpt: string;
  blocks: Block[];
  seoTitle: string;
  seoDescription: string;
  ogMedia: string | null;
  publishedAt: string | null;
  updatedAt: string;
  /** Newer unsaved copy written by autosave, if any. */
  autosave: { title: string; excerpt: string; blocks: Block[]; savedAt: string } | null;
}

export interface PostAdmin {
  id: string;
  slug: string;
  categoryId: string | null;
  authorId: string | null;
  reviewerId: string | null;
  lastReviewedAt: string | null;
  featuredMedia: string | null;
  featuredUrl: string | null;
  isFeatured: boolean;
  isMedical: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<LocaleKey, PostTranslationAdmin>;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name: Record<string, string>;
  sortOrder: number;
  isActive: boolean;
}

export interface AuthorRow {
  id: string;
  name: Record<string, string>;
  bio: Record<string, string>;
  credentials: Record<string, string>;
  avatarMedia: string | null;
  isMedicalReviewer: boolean;
}

export interface RevisionRow {
  id: string;
  localeKey: LocaleKey;
  kind: "autosave" | "save" | "publish";
  title: string;
  createdAt: string;
}

/** A media reference resolved at render time. */
export interface ResolvedMedia {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  alt: Record<string, string>;
}

export interface PublicPostCard {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string;
  categorySlug: string | null;
  categoryName: string | null;
  publishedAt: string;
  readingMinutes: number;
}

export interface PublicPost extends PublicPostCard {
  id: string;
  blocks: Block[];
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string | null;
  updatedAt: string;
  author: { name: string; bio: string; credentials: string; avatarUrl: string | null } | null;
  reviewer: { name: string; credentials: string } | null;
  lastReviewedAt: string | null;
  isMedical: boolean;
  media: Record<string, ResolvedMedia>;
  /** Locales in which this post has a published translation. */
  localeKeys: LocaleKey[];
}
