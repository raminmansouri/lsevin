import { z } from "zod/v4";

import { AttributeType } from "@/features/shared/attributes";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

// Base ServiceDefinition schema
export const ServiceDefinitionSchema = z.object({
  serviceDefinitionId: z.guid().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  categoryId: z.guid(),
  durationMinutes: z.number().int().min(0),
  currency: z.string().min(1),
  value: z.number().min(0),
  pricingModel: z.string().min(1),
  isActive: z.boolean(),
});

export const ServiceDefinitionFormSchema = ServiceDefinitionSchema;

// Type exports
export type ServiceDefinitionInput = z.infer<typeof ServiceDefinitionSchema>;
export type ServiceDefinitionFormInput = z.infer<
  typeof ServiceDefinitionFormSchema
>;

// Attribute and Requirement type exports
export type AttributeOptionInput = z.infer<typeof AttributeOptionSchema>;
export type ServiceAttributeDefinitionCreateInput = z.infer<
  typeof ServiceAttributeDefinitionCreateSchema
>;
export type ServiceAttributeDefinitionDeleteInput = z.infer<
  typeof ServiceAttributeDefinitionDeleteSchema
>;
export type ServiceRequirementCreateInput = z.infer<
  typeof ServiceRequirementCreateSchema
>;
export type ServiceRequirementDeleteInput = z.infer<
  typeof ServiceRequirementDeleteSchema
>;
export type ServiceAttributeDefinitionResponse = z.infer<
  typeof ServiceAttributeDefinitionResponseSchema
>;
export type ServiceRequirementResponse = z.infer<
  typeof ServiceRequirementResponseSchema
>;

// Re-export shared AttributeType for backward compatibility
export { AttributeType } from "@/features/shared/attributes";
// Legacy alias for existing code
export { AttributeType as AttributeTypeEnum } from "@/features/shared/attributes";

// Attribute Option schema for Selection type attributes
export const AttributeOptionSchema = z.object({
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
  additionalPrice: z.number().min(0).default(0),
});

// Service Attribute Definition schema for adding new attributes
export const ServiceAttributeDefinitionCreateSchema = z.object({
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.enum(AttributeType), // Backend expects numeric enum values
  isRequired: z.boolean().default(false),
  affectsPricing: z.boolean().default(false),
  options: z.array(AttributeOptionSchema).optional(),
});

// Service Attribute Definition schema for updating existing attributes
export const ServiceAttributeDefinitionUpdateSchema =
  ServiceAttributeDefinitionCreateSchema.extend({
    displayOrder: z.number().int().min(0).default(0),
  });

// Service Attribute Definition removal schema
export const ServiceAttributeDefinitionDeleteSchema = z.object({
  serviceDefinitionId: z.guid(),
  attributeDefinitionId: z.guid(),
});

// Service Requirement schema for adding new requirements
export const ServiceRequirementCreateSchema = z.object({
  description: LocalizedContentSchema,
  isMandatory: z.boolean().default(false),
});

// Service Requirement removal schema
export const ServiceRequirementDeleteSchema = z.object({
  serviceDefinitionId: z.guid(),
  requirementIndex: z.number().int().min(0),
});

// Attribute Option Response schema (from API)
export const AttributeOptionResponseSchema = z.object({
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
  additionalPrice: z.number().min(0).default(0),
});

// Complete Service Attribute Definition (from API response)
export const ServiceAttributeDefinitionResponseSchema = z.object({
  id: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.string(),
  isRequired: z.boolean(),
  affectsPricing: z.boolean(),
  options: z.array(AttributeOptionResponseSchema),
});

// Service Requirement (from API response)
export const ServiceRequirementResponseSchema = z.object({
  description: LocalizedContentSchema,
  isMandatory: z.boolean(),
});
