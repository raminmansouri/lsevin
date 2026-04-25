import { z } from "zod/v4";

import { AttributeType } from "@/features/shared/attributes";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

const commaSeparatedText = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.string()).default([]));

export const ServiceDefinitionSchema = z.object({
  serviceDefinitionId: z.guid().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  categoryId: z.guid(),
  durationMinutes: z.coerce.number().int().min(0),
  currency: z.string().trim().min(1).max(15),
  value: z.coerce.number().min(0),
  pricingModel: z.string().trim().min(1).max(100),
  isActive: z.boolean(),
});

export const ServiceDefinitionFormSchema = ServiceDefinitionSchema;

export const AttributeOptionSchema = z.object({
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
  additionalPrice: z.coerce.number().min(0).default(0),
});

export const ServiceAttributeDefinitionCreateSchema = z.object({
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.union([z.enum(AttributeType), z.coerce.number().int().positive()]),
  isRequired: z.boolean().default(false),
  affectsPricing: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
  options: z.array(AttributeOptionSchema).default([]),
});

export const ServiceAttributeDefinitionUpdateSchema =
  ServiceAttributeDefinitionCreateSchema.extend({
    displayOrder: z.coerce.number().int().min(0).default(0),
  });

export const ServiceAttributeDefinitionDeleteSchema = z.object({
  serviceDefinitionId: z.guid(),
  attributeDefinitionId: z.guid(),
});

export const ServiceRequirementCreateSchema = z.object({
  description: LocalizedContentSchema,
  isMandatory: z.boolean().default(false),
});

export const ServiceRequirementUpdateSchema = ServiceRequirementCreateSchema.extend({
  requirementIndex: z.coerce.number().int().min(0),
});

export const ServiceRequirementDeleteSchema = z.object({
  serviceDefinitionId: z.guid(),
  requirementIndex: z.coerce.number().int().min(0),
});

export const ServiceUploadRequirementBaseSchema = z.object({
  title: LocalizedContentSchema,
  description: LocalizedContentSchema,
  isRequired: z.boolean().default(false),
  maxFileSizeBytes: z.coerce.number().int().min(0).default(0),
  allowedExtensions: commaSeparatedText,
  allowedMimeTypes: commaSeparatedText,
  maxFiles: z.coerce.number().int().min(1).default(1),
  displayOrder: z.coerce.number().int().min(0).default(0),
  exampleFileUrl: z.string().trim().optional().nullable(),
});

export const ServiceUploadRequirementCreateSchema = ServiceUploadRequirementBaseSchema.extend({
  serviceDefinitionId: z.guid(),
});

export const ServiceUploadRequirementUpdateSchema = ServiceUploadRequirementBaseSchema.extend({
  serviceDefinitionId: z.guid(),
  requirementId: z.guid(),
});

export const ServiceUploadRequirementDeleteSchema = z.object({
  serviceDefinitionId: z.guid(),
  requirementId: z.guid(),
});

export const AttributeOptionResponseSchema = z.object({
  id: z.number().optional(),
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
  additionalPrice: z.coerce.number().min(0).default(0),
});

export const ServiceAttributeDefinitionResponseSchema = z.object({
  id: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.string(),
  attributeTypeId: z.number().optional(),
  isRequired: z.boolean(),
  affectsPricing: z.boolean(),
  displayOrder: z.number(),
  options: z.array(AttributeOptionResponseSchema),
});

export const ServiceRequirementResponseSchema = z.object({
  id: z.number(),
  description: LocalizedContentSchema,
  isMandatory: z.boolean(),
});

export type ServiceDefinitionInput = z.infer<typeof ServiceDefinitionSchema>;
export type ServiceDefinitionFormInput = z.infer<typeof ServiceDefinitionFormSchema>;
export type AttributeOptionInput = z.infer<typeof AttributeOptionSchema>;
export type ServiceAttributeDefinitionCreateInput = z.infer<typeof ServiceAttributeDefinitionCreateSchema>;
export type ServiceAttributeDefinitionDeleteInput = z.infer<typeof ServiceAttributeDefinitionDeleteSchema>;
export type ServiceRequirementCreateInput = z.infer<typeof ServiceRequirementCreateSchema>;
export type ServiceRequirementDeleteInput = z.infer<typeof ServiceRequirementDeleteSchema>;
export type ServiceAttributeDefinitionResponse = z.infer<typeof ServiceAttributeDefinitionResponseSchema>;
export type ServiceRequirementResponse = z.infer<typeof ServiceRequirementResponseSchema>;
export type ServiceUploadRequirementInput = z.infer<typeof ServiceUploadRequirementCreateSchema>;

export { AttributeType } from "@/features/shared/attributes";
export { AttributeType as AttributeTypeEnum } from "@/features/shared/attributes";
