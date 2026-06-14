import { z } from "zod/v4";

import { ENTITY_KEYS, getEntityConfig } from "./constants";
import type { AdminFieldConfig, MarketingLoyaltyEntityKey } from "./types";

export const MarketingLoyaltyEntityKeySchema = z.enum(ENTITY_KEYS);

export const UpsertMarketingLoyaltyRecordSchema = z.object({
  entityKey: MarketingLoyaltyEntityKeySchema,
  id: z.string().optional(),
  values: z.record(z.string(), z.unknown()),
});

export const DeleteMarketingLoyaltyRecordSchema = z.object({
  entityKey: MarketingLoyaltyEntityKeySchema,
  id: z.string().min(1),
});

export type UpsertMarketingLoyaltyRecordInput = z.infer<typeof UpsertMarketingLoyaltyRecordSchema>;
export type DeleteMarketingLoyaltyRecordInput = z.infer<typeof DeleteMarketingLoyaltyRecordSchema>;

export function buildEntityFormSchema(entityKey: MarketingLoyaltyEntityKey, isEdit: boolean) {
  const config = getEntityConfig(entityKey);
  const shape: Record<string, z.ZodType> = {};

  for (const field of config.fields) {
    if (isEdit && field.hiddenOnUpdate) continue;
    if (!isEdit && field.hiddenOnCreate) continue;
    shape[field.name] = buildFieldSchema(field);
  }

  return z.object(shape);
}

function buildFieldSchema(field: AdminFieldConfig): z.ZodType {
  let schema: z.ZodType;

  switch (field.kind) {
    case "number":
      schema = z.preprocess(
        emptyToUndefined,
        field.required
          ? z.coerce.number().min(field.min ?? Number.NEGATIVE_INFINITY).max(field.max ?? Number.POSITIVE_INFINITY)
          : z.coerce.number().min(field.min ?? Number.NEGATIVE_INFINITY).max(field.max ?? Number.POSITIVE_INFINITY).optional()
      );
      break;
    case "integer":
      schema = z.preprocess(
        emptyToUndefined,
        field.required
          ? z.coerce.number().int().min(field.min ?? Number.MIN_SAFE_INTEGER).max(field.max ?? Number.MAX_SAFE_INTEGER)
          : z.coerce.number().int().min(field.min ?? Number.MIN_SAFE_INTEGER).max(field.max ?? Number.MAX_SAFE_INTEGER).optional()
      );
      break;
    case "boolean":
      schema = z.coerce.boolean();
      break;
    case "json":
      schema = z.string().refine((value) => {
        if (!field.required && !value.trim()) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }, "Invalid JSON");
      break;
    case "localized-text":
    case "localized-rich-text":
      schema = field.required
        ? z.unknown().refine(hasLocalizedContent, "Required")
        : z.unknown().optional();
      break;
    case "datetime":
    case "select":
    case "text":
    case "textarea":
    case "richtext":
    case "color":
    case "media-single":
    case "media-multi":
    case "readonly":
    default:
      schema = field.required ? z.string().trim().min(1, "Required") : z.string().optional();
      break;
  }

  return schema;
}

function emptyToUndefined(value: unknown) {
  if (value === "" || value === null) return undefined;
  return value;
}


function hasLocalizedContent(value: unknown) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) => typeof item === "string" && item.trim().length > 0);
}
