
import { z } from "zod/v4";

import { AttributeType } from "@/features/shared/attributes";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

const OptionalText = z.preprocess(
  (value) => (value === null || value === undefined ? undefined : value),
  z.string().max(500).optional()
);

export const ProviderTypeSchema = z.object({
  providerTypeId: z.guid().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  isActive: z.boolean().default(true),
  iconUrl: OptionalText,
  imageUrl: OptionalText,
});

export const ProviderTypeFormSchema = ProviderTypeSchema;

export { AttributeType } from "@/features/shared/attributes";
export { AttributeType as AttributeTypeEnum } from "@/features/shared/attributes";

export const ProviderAttributeOptionSchema = z.object({
  displayName: LocalizedContentSchema,
  value: LocalizedContentSchema,
});

export const ProviderAttributeDefinitionCreateSchema = z.object({
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeTypeId: z.coerce.number().int().positive(),
  isRequired: z.boolean().default(false),
  validationRules: z.string().max(250).optional(),
  options: z.array(ProviderAttributeOptionSchema).optional(),
});

export const ProviderAttributeDefinitionDeleteSchema = z.object({
  providerTypeId: z.guid(),
  attributeDefinitionId: z.guid(),
});

export const ProviderAttributeDefinitionResponseSchema = z.object({
  id: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  attributeType: z.string(),
  isRequired: z.boolean(),
  validationRules: z.string().nullable().optional(),
  options: z.array(ProviderAttributeOptionSchema),
});

export const AttributeOptionSchema = ProviderAttributeOptionSchema;
export const AttributeDefinitionSchema = ProviderAttributeDefinitionCreateSchema;

export type ProviderTypeInput = z.infer<typeof ProviderTypeSchema>;
export type ProviderTypeFormInput = z.infer<typeof ProviderTypeFormSchema>;
export type ProviderAttributeOptionInput = z.infer<typeof ProviderAttributeOptionSchema>;
export type ProviderAttributeDefinitionCreateInput = z.infer<typeof ProviderAttributeDefinitionCreateSchema>;
export type ProviderAttributeDefinitionDeleteInput = z.infer<typeof ProviderAttributeDefinitionDeleteSchema>;
export type ProviderAttributeDefinitionResponse = z.infer<typeof ProviderAttributeDefinitionResponseSchema>;
export type AttributeDefinitionInput = z.infer<typeof AttributeDefinitionSchema>;
export type AttributeOptionInput = z.infer<typeof AttributeOptionSchema>;
