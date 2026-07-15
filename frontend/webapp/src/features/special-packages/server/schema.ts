import { z } from "zod/v4";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimOrNull(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function optionalUuid(value: unknown) {
  const trimmed = trimOrNull(value);
  return trimmed && uuidRegex.test(trimmed) ? trimmed : null;
}

// Accepts both the shared LocalizedInput shape `{ translations: { ... } }`
// and the raw jsonb object stored in the database column, keeping only
// non-empty trimmed values so create/update never persist blank locales.
const localizedTextSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

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

const requiredLocalizedTextSchema = localizedTextSchema.refine(
  (value) => Object.values(value).some((text) => typeof text === "string" && text.trim().length > 0),
  { message: "At least one language is required." }
);

const optionalUuidSchema = z.preprocess(optionalUuid, z.string().uuid().nullable()).catch(null);
const optionalTextSchema = z.preprocess(trimOrNull, z.string().nullable()).catch(null);

const optionalPositiveNumberSchema = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  }, z.number().positive().nullable())
  .catch(null);

const metadataSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}, z.record(z.string(), z.unknown()).catch({}));

export const SpecialPackageInputSchema = z.object({
  id: z.preprocess(optionalUuid, z.string().uuid().optional().nullable()).optional(),
  titleTranslations: requiredLocalizedTextSchema,
  subtitleTranslations: localizedTextSchema,
  descriptionTranslations: localizedTextSchema,
  providerId: optionalUuidSchema,
  priceAmount: optionalPositiveNumberSchema,
  currencyCode: optionalTextSchema,
  originalPriceAmount: optionalPositiveNumberSchema,
  imageUrl: optionalTextSchema,
  isActive: z.coerce.boolean().catch(true),
  displayOrder: z.coerce.number().int().catch(0),
  metadata: metadataSchema,
});

export type SpecialPackageInput = z.output<typeof SpecialPackageInputSchema>;
export type SpecialPackageFormValues = SpecialPackageInput;
