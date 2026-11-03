import { z } from "zod/v4";

import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";
import { toSeoPlainText } from "@/lib/seo/plain-text";

import { FAQ_APP_KEYS, FAQ_ENTITY_RESOURCE, FAQ_SCOPES, SITE_PAGE_SLUGS } from "../types";

const localized = OptionalLocalizedContentSchema.default({ translations: {} });

const filled = (value: string | undefined) => Boolean(toSeoPlainText(value ?? "", 10));

/** Locale keys that have real text (rich text is checked for words, not just JSON). */
export const filledLocales = (translations: Record<string, string>) =>
  Object.keys(translations).filter((key) => filled(translations[key]));

// The media picker stores a media_library id or a file URL; anything else (for
// example a javascript: URL) is rejected so it can never reach an <img src>.
const mediaReference = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value) ||
      /^https?:\/\//iu.test(value) ||
      /^\/?[\w\-./%]+$/u.test(value),
    "Choose an image from the media library.",
  )
  .nullable()
  .optional()
  .transform((value) => value || null);

export const SitePageFormSchema = z
  .object({
    slug: z.enum(SITE_PAGE_SLUGS),
    title: localized,
    summary: localized,
    body: localized,
    heroMedia: mediaReference,
    isPublished: z.boolean().default(false),
    showInFooter: z.boolean().default(true),
    displayOrder: z.coerce.number().int().min(0).max(1000).default(0),
  })
  .superRefine((data, ctx) => {
    const titled = new Set(filledLocales(data.title.translations));
    const written = filledLocales(data.body.translations);
    for (const key of written) {
      if (!titled.has(key)) {
        ctx.addIssue({ code: "custom", path: ["title"], message: `Add a title for ${key}: the page has text in that language.` });
      }
    }
    if (data.isPublished && !written.some((key) => titled.has(key))) {
      ctx.addIssue({ code: "custom", path: ["body"], message: "A published page needs a title and text in at least one language." });
    }
  });

export type SitePageFormInput = z.input<typeof SitePageFormSchema>;

export const FaqFormSchema = z
  .object({
    id: z.guid().nullable().optional(),
    scope: z.enum(FAQ_SCOPES),
    // GUID, not RFC UUID: most catalog ids in production lack RFC version/variant bits.
    entityId: z.guid().nullable().optional().transform((value) => value ?? null),
    entityKey: z.string().trim().nullable().optional().transform((value) => value || null),
    question: localized,
    answer: localized,
    displayOrder: z.coerce.number().int().min(0).max(1000).default(0),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "app" && !(FAQ_APP_KEYS as readonly string[]).includes(data.entityKey ?? "")) {
      ctx.addIssue({ code: "custom", path: ["entityKey"], message: "Choose the section this FAQ belongs to." });
    }
    if (data.scope === "site_page" && !(SITE_PAGE_SLUGS as readonly string[]).includes(data.entityKey ?? "")) {
      ctx.addIssue({ code: "custom", path: ["entityKey"], message: "Choose the page this FAQ belongs to." });
    }

    const asked = filledLocales(data.question.translations);
    const answered = new Set(filledLocales(data.answer.translations));
    if (!asked.length) {
      ctx.addIssue({ code: "custom", path: ["question"], message: "Write the question in at least one language." });
    }
    for (const key of asked) {
      if (!answered.has(key)) {
        ctx.addIssue({ code: "custom", path: ["answer"], message: `Add the answer for ${key}: the question exists in that language.` });
      }
    }
    for (const key of answered) {
      if (!asked.includes(key)) {
        ctx.addIssue({ code: "custom", path: ["question"], message: `Add the question for ${key}: the answer exists in that language.` });
      }
    }
  })
  .transform((data) => ({
    ...data,
    // Normalise the target so it always satisfies ck_content_faq_items_target; a
    // stale id left over from another scope is dropped rather than failing the save.
    entityId: FAQ_ENTITY_RESOURCE[data.scope] ? data.entityId : null,
    entityKey: data.scope === "app" || data.scope === "site_page" ? data.entityKey : null,
  }));

export type FaqFormInput = z.input<typeof FaqFormSchema>;
