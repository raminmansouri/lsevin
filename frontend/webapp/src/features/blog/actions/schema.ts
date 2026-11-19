import { z } from "zod/v4";

import { SLUG_PATTERN, MAX_SLUG_LENGTH, POST_STATUSES } from "../types";

/** Locale keys the site uses ("fa-IR", "en-US", ...). */
export const localeKey = z.string().regex(/^[a-z]{2,3}-[A-Z]{2}$/u, "Unknown language.");

// GUID, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
export const guid = z.guid();

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a URL name.")
  .max(MAX_SLUG_LENGTH)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens, e.g. my-first-post.");

// A media_library id or a stored/absolute file URL; empty clears it.
export const mediaReference = z
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
  )
  .nullable()
  .optional()
  .transform((value) => value || null);

export const CreatePostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Enter a title.").max(200),
  localeKey,
});
export type CreatePostInput = z.input<typeof CreatePostSchema>;

export const PostSettingsSchema = z.object({
  id: guid,
  slug: slugSchema,
  categoryId: guid.nullable().optional().transform((value) => value ?? null),
  authorId: guid.nullable().optional().transform((value) => value ?? null),
  reviewerId: guid.nullable().optional().transform((value) => value ?? null),
  lastReviewedAt: z.string().datetime({ offset: true }).nullable().optional().transform((value) => value ?? null),
  featuredMedia: mediaReference,
  isFeatured: z.boolean().default(false),
  isMedical: z.boolean().default(false),
});
export type PostSettingsInput = z.input<typeof PostSettingsSchema>;

const text = (max: number) => z.string().max(max).default("").transform((value) => value.replace(/\s+/gu, " ").trim());

export const TranslationSchema = z.object({
  postId: guid,
  localeKey,
  title: text(200),
  excerpt: text(500),
  blocks: z.unknown(),
  seoTitle: text(120),
  seoDescription: text(300),
  ogMedia: mediaReference,
  /** What the save does to the language's status. */
  intent: z.enum(["save", "publish", "unpublish", "archive"]).default("save"),
  /** Publish date/time (ISO with offset); empty = now. A future date schedules the post. */
  publishedAt: z.string().datetime({ offset: true }).nullable().optional().transform((value) => value ?? null),
});
export type TranslationInput = z.input<typeof TranslationSchema>;

export const AutosaveSchema = z.object({
  postId: guid,
  localeKey,
  title: text(200),
  excerpt: text(500),
  blocks: z.unknown(),
});
export type AutosaveInput = z.input<typeof AutosaveSchema>;

export const IdSchema = z.object({ id: guid });
export const TranslationRefSchema = z.object({ postId: guid, localeKey });

const translationsMap = z
  .record(z.string(), z.string().max(2000))
  .default({})
  .transform((map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)));

export const CategorySchema = z.object({
  id: guid.nullable().optional(),
  slug: slugSchema.max(80),
  name: translationsMap.refine((map) => Object.keys(map).length > 0, "Name the category in at least one language."),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof CategorySchema>;

export const AuthorSchema = z.object({
  id: guid.nullable().optional(),
  name: translationsMap.refine((map) => Object.keys(map).length > 0, "Enter the name in at least one language."),
  bio: translationsMap,
  credentials: translationsMap,
  avatarMedia: mediaReference,
  isMedicalReviewer: z.boolean().default(false),
});
export type AuthorInput = z.input<typeof AuthorSchema>;

export { POST_STATUSES };
