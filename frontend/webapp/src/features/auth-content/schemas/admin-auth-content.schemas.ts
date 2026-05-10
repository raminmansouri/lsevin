import { z } from "zod/v4";

import {
  AUTH_ONBOARDING_STEP_CONTENT_TYPE,
  AUTH_PAGE_CONTENT_TYPE,
} from "@/features/auth-content/lib/auth-content.constants";
import { normalizeLocalizedContentForDatabase } from "../lib/localized";

const translationsSchema = z.preprocess(
  normalizeLocalizedContentForDatabase,
  z.record(z.string(), z.string()).default({}),
);

const optionalTranslationsSchema = z.preprocess(
  normalizeLocalizedContentForDatabase,
  z.record(z.string(), z.string()).default({}),
);

export const saveAuthContentItemSchema = z.object({
  id: z.guid().optional().nullable(),
  typeCode: z.enum([AUTH_PAGE_CONTENT_TYPE, AUTH_ONBOARDING_STEP_CONTENT_TYPE] as const),
  itemKey: z.string().trim().min(1).max(120),
  mediaUrl: z.string().trim().max(1000).optional().nullable(),
  mediaKind: z.enum(["image", "video", "gif", "file"]).default("image"),
  eyebrow: optionalTranslationsSchema,
  title: translationsSchema,
  subtitle: optionalTranslationsSchema,
  body: optionalTranslationsSchema,
  buttonTitle: optionalTranslationsSchema,
  buttonUrl: z.string().trim().max(1000).optional().nullable(),
  alt: optionalTranslationsSchema,
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  secondaryButtonTitle: z.string().trim().max(200).optional().nullable(),
  secondaryButtonUrl: z.string().trim().max(1000).optional().nullable(),
  metadataJson: z.string().optional().nullable(),
  styleJson: z.string().optional().nullable(),
  locale: z.string().trim().min(2).default("en-US"),
});

export type SaveAuthContentItemInput = z.infer<typeof saveAuthContentItemSchema>;
