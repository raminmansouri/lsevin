import { z } from "zod/v4";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const providerServiceAddonSchema = z.object({ providerServiceId: z.uuid(), addonId: z.string().min(1) });
export const removeProviderServiceAddonSchema = z.object({ providerServiceId: z.uuid(), addonId: z.string().min(1) });

export const serviceFaqSchema = z.object({ providerServiceId: z.uuid(), faqId: z.uuid().optional(), question: z.string().trim().min(1), answer: z.string().trim().min(1) });
export const deleteServiceFaqSchema = z.object({ providerServiceId: z.uuid(), faqId: z.uuid() });

export const serviceIncludedSchema = z.object({ providerServiceId: z.uuid(), includedId: z.uuid().optional(), item: z.string().trim().min(1).max(200) });
export const deleteServiceIncludedSchema = z.object({ providerServiceId: z.uuid(), includedId: z.uuid() });

export const serviceProcessSchema = z.object({ providerServiceId: z.uuid(), processId: z.uuid().optional(), step: z.coerce.number().int().min(1), title: z.string().trim().min(1).max(200), description: z.string().trim().optional(), duration: z.string().trim().optional() });
export const deleteServiceProcessSchema = z.object({ providerServiceId: z.uuid(), processId: z.uuid() });

export const serviceAttributeValueSchema = z.object({ providerServiceId: z.uuid(), valueId: z.uuid().optional(), attributeDefinitionId: z.uuid(), valueTranslations: LocalizedContentSchema });
export const deleteServiceAttributeValueSchema = z.object({ providerServiceId: z.uuid(), valueId: z.uuid() });

export const addonProviderTypeSchema = z.object({ serviceDefinitionId: z.uuid(), relationId: z.uuid().optional(), providerTypeId: z.uuid(), icon: z.string().optional(), displayOrder: z.coerce.number().int().min(0).default(0), isRequired: z.boolean().default(false), metadata: z.string().optional() });
export const deleteAddonProviderTypeSchema = z.object({ serviceDefinitionId: z.uuid(), relationId: z.uuid() });

export const serviceAttributeDefinitionSchema = z.object({ serviceDefinitionId: z.uuid(), attributeDefinitionId: z.uuid().optional(), nameTranslations: LocalizedContentSchema, descriptionTranslations: LocalizedContentSchema, attributeTypeId: z.coerce.number().int().min(1), isRequired: z.boolean().default(false), affectsPricing: z.boolean().default(false), displayOrder: z.coerce.number().int().min(0).default(0) });
export const deleteServiceAttributeDefinitionSchema = z.object({ serviceDefinitionId: z.uuid(), attributeDefinitionId: z.uuid() });

export const serviceAttributeOptionSchema = z.object({ serviceDefinitionId: z.uuid(), attributeDefinitionId: z.uuid(), optionId: z.coerce.number().int().min(1).optional(), displayNameTranslations: LocalizedContentSchema, valueTranslations: LocalizedContentSchema, additionalPrice: z.coerce.number().optional().nullable() });
export const deleteServiceAttributeOptionSchema = z.object({ serviceDefinitionId: z.uuid(), attributeDefinitionId: z.uuid(), optionId: z.coerce.number().int().min(1) });
