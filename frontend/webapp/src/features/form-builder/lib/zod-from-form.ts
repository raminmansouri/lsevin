import { z } from "zod";
import type { RuntimeServiceForm, FormField } from "../types";

const jsonRecordSchema = z.record(z.string(), z.any());

function fieldSchema(field: FormField): z.ZodTypeAny {
  const rules = field.validationRules ?? {};
  const min = typeof rules.min === "number" ? rules.min : undefined;
  const max = typeof rules.max === "number" ? rules.max : undefined;

  switch (field.fieldTypeCode) {
    case "text":
    case "textarea":
    case "richtext": {
      let schema = z.string();
      if (typeof min === "number") schema = schema.min(min);
      if (typeof max === "number") schema = schema.max(max);
      return field.isRequired ? schema.min(1) : schema.optional().default("");
    }
    case "number": {
      const schema = z.coerce.number();
      const withMin = typeof min === "number" ? schema.min(min) : schema;
      const withMax = typeof max === "number" ? withMin.max(max) : withMin;
      return field.isRequired ? withMax : withMax.optional();
    }
    case "checkbox":
      return z.boolean().default(false);
    case "date":
    case "time":
    case "select":
    case "radio": {
      const schema = z.string();
      return field.isRequired ? schema.min(1) : schema.optional().default("");
    }
    case "date_range":
      return z.object({ from: z.string().min(1), to: z.string().min(1) });
    case "time_range":
      return z.object({ from: z.string().min(1), to: z.string().min(1) });
    case "person_count":
      return z.object({
        adults: z.coerce.number().int().min(0).default(0),
        children: z.coerce.number().int().min(0).default(0),
        infants: z.coerce.number().int().min(0).default(0),
        rooms: z.coerce.number().int().min(0).default(0),
      });
    case "media_single":
      return field.isRequired ? z.string().min(1) : z.string().optional().default("");
    case "media_multi":
      return z.string().optional().default("");
    case "multilingual_text":
    case "multilingual_textarea":
      return jsonRecordSchema.default({});
    default:
      return z.any();
  }
}

export function buildZodSchemaFromRuntimeForm(form: RuntimeServiceForm) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const section of form.sections) {
    for (const field of section.fields) {
      shape[field.key] = fieldSchema(field);
    }
  }

  return z.object(shape);
}
