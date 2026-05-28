import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

import type { AdminTableConfig } from "../types";
import { getFieldKind } from "./values";

function hasLocalizedContent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).some((entry) => String(entry ?? "").trim().length > 0);
}

export function buildAdminFormSchema(config: AdminTableConfig, mode: "create" | "update") {
  const shape: Record<string, z.ZodType> = {};

  for (const field of config.fields) {
    if (field.hidden || field.readonly) continue;
    if (mode === "create" && field.createHidden) continue;
    if (mode === "update" && field.updateHidden) continue;
    if (mode === "update" && config.primaryKey.includes(field.name)) continue;

    const kind = getFieldKind(field);
    let schema: z.ZodType = z.unknown();

    if (kind === "localized" || kind === "localized-rich") {
      schema = LocalizedContentSchema;
    } else if (["text", "textarea", "media-single", "media-multi", "date", "datetime", "time", "select", "array", "json"].includes(kind)) {
      schema = z.string();
    }

    if (kind === "number") schema = z.coerce.number().or(z.literal(""));
    if (kind === "boolean") schema = z.boolean().optional().default(false);

    if (field.required) {
      if (kind === "localized" || kind === "localized-rich") {
        schema = schema.refine(hasLocalizedContent, `${field.label || field.name} is required.`);
      } else if (kind !== "boolean") {
        schema = (schema as z.ZodString).refine((value) => String(value ?? "").trim().length > 0, `${field.label || field.name} is required.`);
      }
    } else {
      schema = schema.optional().nullable();
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}
