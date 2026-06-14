import { z } from "zod";
import type { RuntimeServiceForm, FormField } from "../types";

const jsonRecordSchema = z.record(z.string(), z.any());

export interface FormBuilderValidationMessages {
  required: string;
  minChars: (value: number) => string;
  maxChars: (value: number) => string;
  minValue: (value: number) => string;
  maxValue: (value: number) => string;
  email: string;
  url: string;
  invalidFormat: string;
  integer: string;
  mustBeTrue: string;
}

const defaultValidationMessages: FormBuilderValidationMessages = {
  required: "Required",
  minChars: (value) => `Must be at least ${value} characters`,
  maxChars: (value) => `Must be at most ${value} characters`,
  minValue: (value) => `Must be at least ${value}`,
  maxValue: (value) => `Must be at most ${value}`,
  email: "Enter a valid email address",
  url: "Enter a valid URL",
  invalidFormat: "Invalid format",
  integer: "Must be a whole number",
  mustBeTrue: "This field must be checked",
};

function resolveMessages(messages?: Partial<FormBuilderValidationMessages>): FormBuilderValidationMessages {
  return { ...defaultValidationMessages, ...(messages ?? {}) };
}

function getStringRule(rules: Record<string, unknown>, key: string, fallback = "") {
  const value = rules[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function getNumberRule(rules: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = rules[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function optionalStringWithDefault() {
  return z.string().optional().default("");
}

function requiredString(message: string) {
  return z.string().trim().min(1, message);
}

function stringSchema(field: FormField, messages: FormBuilderValidationMessages) {
  const rules = field.validationRules ?? {};
  const required = Boolean(field.isRequired);
  const requiredMessage = getStringRule(rules, "requiredMessage", messages.required);
  const minLength = getNumberRule(rules, "minLength", "min");
  const maxLength = getNumberRule(rules, "maxLength", "max");
  const pattern = getStringRule(rules, "pattern");
  const format = getStringRule(rules, "format");

  let schema = z.string().trim();

  if (required) {
    schema = schema.min(1, requiredMessage);
  }

  if (typeof minLength === "number") {
    schema = schema.min(minLength, getStringRule(rules, "minMessage", messages.minChars(minLength)));
  }

  if (typeof maxLength === "number") {
    schema = schema.max(maxLength, getStringRule(rules, "maxMessage", messages.maxChars(maxLength)));
  }

  if (format === "email") {
    schema = schema.email(getStringRule(rules, "formatMessage", messages.email));
  }

  if (format === "url") {
    schema = schema.url(getStringRule(rules, "formatMessage", messages.url));
  }

  if (pattern) {
    try {
      schema = schema.regex(new RegExp(pattern), getStringRule(rules, "patternMessage", messages.invalidFormat));
    } catch {
      // Ignore invalid admin-entered regex instead of breaking runtime rendering.
    }
  }

  return required ? schema : z.preprocess((value) => value === "" || value === null ? undefined : value, schema.optional().default(""));
}

function rangeSchema(field: FormField, messages: FormBuilderValidationMessages) {
  const rules = field.validationRules ?? {};
  const required = Boolean(field.isRequired);
  const requiredMessage = getStringRule(rules, "requiredMessage", messages.required);
  const shape = z.object({
    from: required ? requiredString(requiredMessage) : optionalStringWithDefault(),
    to: required ? requiredString(requiredMessage) : optionalStringWithDefault(),
  });

  return required ? shape : shape.optional().default({ from: "", to: "" });
}

function numberSchema(field: FormField, messages: FormBuilderValidationMessages) {
  const rules = field.validationRules ?? {};
  const required = Boolean(field.isRequired);
  const min = getNumberRule(rules, "min");
  const max = getNumberRule(rules, "max");
  const integerOnly = rules.integer === true;

  let parsedNumber = z.coerce.number();
  if (integerOnly) parsedNumber = parsedNumber.int(getStringRule(rules, "integerMessage", messages.integer));
  if (typeof min === "number") parsedNumber = parsedNumber.min(min, getStringRule(rules, "minMessage", messages.minValue(min)));
  if (typeof max === "number") parsedNumber = parsedNumber.max(max, getStringRule(rules, "maxMessage", messages.maxValue(max)));

  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    required ? parsedNumber : parsedNumber.optional()
  );
}

function booleanSchema(field: FormField, messages: FormBuilderValidationMessages) {
  const rules = field.validationRules ?? {};
  const mustBeTrue = rules.mustBeTrue === true;
  const message = getStringRule(rules, "mustBeTrueMessage", messages.mustBeTrue);
  const schema = z.boolean().default(false);
  return mustBeTrue ? schema.refine((value) => value === true, message) : schema;
}


function hasFileUploadValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const fileUrl = (value as { fileUrl?: unknown }).fileUrl;
    return typeof fileUrl === "string" && fileUrl.trim().length > 0;
  }
  return false;
}

function fileUploadSchema(field: FormField, messages: FormBuilderValidationMessages) {
  const rules = field.validationRules ?? {};
  const required = Boolean(field.isRequired);
  const requiredMessage = getStringRule(rules, "requiredMessage", messages.required);
  const multiple = field.settings?.multiple === true;

  if (multiple) {
    const baseSchema = required ? z.array(z.any()).min(1, requiredMessage) : z.array(z.any()).optional().default([]);
    return baseSchema.refine((items) => (items ?? []).every(hasFileUploadValue), messages.invalidFormat);
  }

  const schema = z.any().refine((value) => !required || hasFileUploadValue(value), requiredMessage);
  return required ? schema : schema.optional().nullable().default(null);
}

function fieldSchema(field: FormField, messages: FormBuilderValidationMessages): z.ZodTypeAny {
  const rules = field.validationRules ?? {};
  const required = Boolean(field.isRequired);
  const requiredMessage = getStringRule(rules, "requiredMessage", messages.required);

  switch (field.fieldTypeCode) {
    case "text":
    case "textarea":
    case "richtext":
      return stringSchema(field, messages);
    case "number":
      return numberSchema(field, messages);
    case "checkbox":
      return booleanSchema(field, messages);
    case "date":
    case "persian_date":
    case "datetime":
    case "persian_datetime":
    case "time":
    case "select":
    case "radio":
      return required ? requiredString(requiredMessage) : optionalStringWithDefault();
    case "file_upload":
      return fileUploadSchema(field, messages);
    case "lazy_searchable_select":
      if (field.settings?.multiple === true) {
        const arraySchema = z.array(z.string());
        return required ? arraySchema.min(1, requiredMessage) : arraySchema.optional().default([]);
      }
      return required ? requiredString(requiredMessage) : optionalStringWithDefault();
    case "date_range":
    case "time_range":
      return rangeSchema(field, messages);
    case "person_count":
      return z.object({
        adults: z.coerce.number().int().min(0).default(0),
        children: z.coerce.number().int().min(0).default(0),
        infants: z.coerce.number().int().min(0).default(0),
        rooms: z.coerce.number().int().min(0).default(0),
      });
    case "media_single":
      return required ? requiredString(requiredMessage) : optionalStringWithDefault();
    case "media_multi":
      return optionalStringWithDefault();
    case "multilingual_text":
    case "multilingual_textarea":
      return jsonRecordSchema.default({});
    default:
      return z.any();
  }
}

export function buildZodSchemaFromRuntimeForm(
  form: RuntimeServiceForm,
  validationMessages?: Partial<FormBuilderValidationMessages>
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  const messages = resolveMessages(validationMessages);

  for (const section of form.sections) {
    for (const field of section.fields) {
      if (!field.isHidden) {
        shape[field.key] = fieldSchema(field, messages);
      }
    }
  }

  return z.object(shape);
}
