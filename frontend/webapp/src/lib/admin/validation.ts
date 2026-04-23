import { z } from "zod";
import { ResolvedTableDefinition } from "./types";

function jsonObjectSchema() {
  return z.object({}).catchall(z.unknown());
}

function multilingualSchema() {
  return z.object({}).catchall(z.union([z.string(), z.null(), z.undefined()]));
}

export function setDefaultValues(definition: ResolvedTableDefinition) {
  const defaultValues={};
  for (const field of definition.formFields) {
    switch (field.fieldKind) {
      case "number":
        break;
      case "boolean":
        break;
      case "date":
      case "datetime":
      case "time":
        // defaultValues[field.columnName]=new Date().toISOString();
        // if (['create_date', 'last_modified_date'].indexOf(field.columnName) >= 0)
        // continue;
        break;
      case "json":
        break;
      case "multilingual":
        break;
      case "many-to-many":
        break;
      case "enum":
        break;
      default:
        break;
    }
  }

  return defaultValues
}
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
        // if (['create_date', 'last_modified_date'].indexOf(field.columnName) >= 0)
        // continue;
        schema = z.string().min(1);
        break;
      case "json":
        schema = z.union([
          z.string(),
          jsonObjectSchema(),
          z.array(z.unknown()),
        ]);
        break;
      case "multilingual":
        schema = multilingualSchema();
        break;
      case "many-to-many":
        schema = z.array(z.string()).default([]);
        break;
      case "enum":
        schema =
          field.enumValues.length > 0
            ? z.enum(field.enumValues as [string, ...string[]])
            : z.string();
        break;
      default:
        schema = z.string();
        break;
    }

    if ((field.columnName == 'id' && field.isPrimaryKey) ||
      ['create_date', 'last_modified_date'].indexOf(field.columnName) >= 0) {
      schema = schema.optional().nullable();
    }

    if (!field.required || field.isNullable) {
      schema = schema.optional().nullable();
    }

    shape[field.columnName] = schema;
  }

  return z.object(shape);
}