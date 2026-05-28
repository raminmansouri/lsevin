import { z } from "zod/v4";

import {
  SPONSERED_SLIDER_ALIGNMENTS,
  SPONSERED_SLIDER_OVERLAY_VARIANTS,
  SPONSERED_SLIDER_PLACEMENTS,
} from "../types";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimOrNull(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function optionalUuid(value: unknown) {
  const trimmed = trimOrNull(value);
  return trimmed && uuidRegex.test(trimmed) ? trimmed : null;
}

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) {
  return z.preprocess((value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    return (values as readonly string[]).includes(normalized) ? normalized : fallback;
  }, z.enum(values));
}

const localizedTextSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  // The shared LocalizedInput component works with { translations: { ... } },
  // while the database column stores the inner JSON object directly.
  // Accept both shapes so create/update never drops localized values.
  const maybeLocalizedContent = value as { translations?: unknown };
  const source =
    maybeLocalizedContent.translations &&
    typeof maybeLocalizedContent.translations === "object" &&
    !Array.isArray(maybeLocalizedContent.translations)
      ? maybeLocalizedContent.translations
      : value;

  return Object.fromEntries(
    Object.entries(source as Record<string, unknown>)
      .map(([key, rawValue]) => [String(key), typeof rawValue === "string" ? rawValue.trim() : ""])
      .filter(([key, text]) => key.length > 0 && String(text).length > 0)
  );
}, z.record(z.string(), z.string()).catch({}));

const optionalUuidSchema = z.preprocess(optionalUuid, z.string().uuid().nullable()).catch(null);
const optionalTextSchema = z.preprocess(trimOrNull, z.string().nullable()).catch(null);
const metadataSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}, z.record(z.string(), z.unknown()).catch({}));

export const SponseredSliderInputSchema = z.object({
  id: z.preprocess(optionalUuid, z.string().uuid().optional().nullable()).optional(),
  placementKey: optionalEnum(SPONSERED_SLIDER_PLACEMENTS, "home_native_ad"),
  mediaId: optionalUuidSchema,
  url: optionalTextSchema,
  link: optionalTextSchema,
  secondaryLink: optionalTextSchema,
  mediaTypeId: optionalUuidSchema,
  eyebrowTranslations: localizedTextSchema,
  titleTranslations: localizedTextSchema,
  subtitleTranslations: localizedTextSchema,
  descriptionTranslations: localizedTextSchema,
  buttonLabelTranslations: localizedTextSchema,
  badgeTranslations: localizedTextSchema,
  secondaryButtonLabelTranslations: localizedTextSchema,
  ariaLabelTranslations: localizedTextSchema,
  overlayVariant: optionalEnum(SPONSERED_SLIDER_OVERLAY_VARIANTS, "dark"),
  contentAlignment: optionalEnum(SPONSERED_SLIDER_ALIGNMENTS, "left"),
  opensInNewTab: z.coerce.boolean().catch(false),
  displayOrder: z.coerce.number().int().catch(0),
  isActive: z.coerce.boolean().catch(true),
  metadata: metadataSchema,
});

export type SponseredSliderInput = z.output<typeof SponseredSliderInputSchema>;
export type SponseredSliderFormValues = SponseredSliderInput;
