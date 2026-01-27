import { z } from "zod/v4";

import { AttributeType } from "@/features/shared/attributes";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

// Base ProviderType schema
export const ProviderTypeSchema = z.object({
  providerTypeId: z.guid().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  isActive: z.boolean(),
  iconUrl: z.string().optional(),
});

export const ProviderTypeFormSchema = ProviderTypeSchema;

// Re-export shared AttributeType
export { AttributeType } from "@/features/shared/attributes";
// Legacy alias for existing code
export { AttributeType as AttributeTypeEnum } from "@/features/shared/attributes";

// Attribute Option schema for Selection type attributes (Provider version - no additionalPrice)
export const ProviderAttributeOptionSchema = z.object({
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
});

// Provider Attribute Definition schema for adding new attributes
export const ProviderAttributeDefinitionCreateSchema = z.object({
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeTypeId: z.enum(AttributeType),
  isRequired: z.boolean().default(false),
  validationRules: z.string().max(250).optional(),
  options: z.array(ProviderAttributeOptionSchema).optional(),
});

// Provider Attribute Definition removal schema
export const ProviderAttributeDefinitionDeleteSchema = z.object({
  providerTypeId: z.guid(),
  attributeDefinitionId: z.guid(),
});

// Complete Provider Attribute Definition (from API response)
export const ProviderAttributeDefinitionResponseSchema = z.object({
  id: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.string(),
  isRequired: z.boolean(),
  validationRules: z.string().nullable(),
  options: z.array(ProviderAttributeOptionSchema),
});

// Legacy schemas for backward compatibility
export const AttributeOptionSchema = ProviderAttributeOptionSchema;
export const AttributeDefinitionSchema =
  ProviderAttributeDefinitionCreateSchema;

// Type exports
export type ProviderTypeInput = z.infer<typeof ProviderTypeSchema>;
export type ProviderTypeFormInput = z.infer<typeof ProviderTypeFormSchema>;

// Attribute management type exports
export type ProviderAttributeOptionInput = z.infer<
  typeof ProviderAttributeOptionSchema
>;
export type ProviderAttributeDefinitionCreateInput = z.infer<
  typeof ProviderAttributeDefinitionCreateSchema
>;
export type ProviderAttributeDefinitionDeleteInput = z.infer<
  typeof ProviderAttributeDefinitionDeleteSchema
>;
export type ProviderAttributeDefinitionResponse = z.infer<
  typeof ProviderAttributeDefinitionResponseSchema
>;

// Legacy type exports for backward compatibility
export type AttributeDefinitionInput = z.infer<
  typeof AttributeDefinitionSchema
>;
export type AttributeOptionInput = z.infer<typeof AttributeOptionSchema>;
