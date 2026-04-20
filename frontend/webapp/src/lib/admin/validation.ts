import { z } from "zod";
import { ResolvedTableDefinition } from "./types";

export function buildDynamicZodSchema(definition: ResolvedTableDefinition) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of definition.formFields) {
    if (field.readOnly) continue;

    let schema: z.ZodTypeAny;

    switch (field.fieldKind) {
      case "number":
        schema = z.coerce.number();
        break;
      case "boolean":
        schema = z.coerce.boolean();
        break;
      case "date":
      case "datetime":
      case "time":
        schema = z.string().min(1);
        break;
      case "json":
        schema = z.union([z.string(), z.record(z.any()), z.array(z.any())]);
        break;
      case "multilingual":
        schema = z.record(z.string().optional());
        break;
      case "many-to-many":
        schema = z.array(z.string()).default([]);
        break;
      default:
        schema = z.string();
        break;
    }

    if (!field.required || field.isNullable) {
      schema = schema.optional().nullable();
    }

    shape[field.columnName] = schema;
  }

  return z.object(shape);
}
