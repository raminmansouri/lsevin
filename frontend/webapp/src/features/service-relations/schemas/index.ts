import { z } from "zod/v4";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

// z.guid(), not z.uuid(). Zod's uuid() enforces the RFC 4122 version and variant
// bits; Postgres' uuid type does not, and this database holds ids that fail that
// check — 019c3d5e-740c-517f-3a07-283a0241c601 has variant nibble 3, so uuid()
// rejects an id the database issued itself. These forms then failed validation on
// a field with no visible input, so pressing Add did nothing and said nothing.
// guid() keeps the 8-4-4-4-12 shape check and drops the bit constraints.

export const providerServiceAddonSchema = z.object({ providerServiceId: z.guid(), addonId: z.string().min(1) });
export const removeProviderServiceAddonSchema = z.object({ providerServiceId: z.guid(), addonId: z.string().min(1) });

export const serviceFaqSchema = z.object({ providerServiceId: z.guid(), faqId: z.guid().optional(), question: z.string().trim().min(1), answer: z.string().trim().min(1) });
export const deleteServiceFaqSchema = z.object({ providerServiceId: z.guid(), faqId: z.guid() });

export const serviceIncludedSchema = z.object({ providerServiceId: z.guid(), includedId: z.guid().optional(), item: z.string().trim().min(1).max(200) });
export const deleteServiceIncludedSchema = z.object({ providerServiceId: z.guid(), includedId: z.guid() });

export const serviceProcessSchema = z.object({ providerServiceId: z.guid(), processId: z.guid().optional(), step: z.coerce.number().int().min(1), title: z.string().trim().min(1).max(200), description: z.string().trim().optional(), duration: z.string().trim().optional() });
export const deleteServiceProcessSchema = z.object({ providerServiceId: z.guid(), processId: z.guid() });

export const serviceAttributeValueSchema = z.object({ providerServiceId: z.guid(), valueId: z.guid().optional(), attributeDefinitionId: z.guid(), valueTranslations: LocalizedContentSchema });
export const deleteServiceAttributeValueSchema = z.object({ providerServiceId: z.guid(), valueId: z.guid() });

export const addonProviderTypeSchema = z.object({ serviceDefinitionId: z.guid(), relationId: z.guid().optional(), providerTypeId: z.guid(), icon: z.string().optional(), displayOrder: z.coerce.number().int().min(0).default(0), isRequired: z.boolean().default(false), metadata: z.string().optional() });
export const deleteAddonProviderTypeSchema = z.object({ serviceDefinitionId: z.guid(), relationId: z.guid() });

export const serviceAttributeDefinitionSchema = z.object({ serviceDefinitionId: z.guid(), attributeDefinitionId: z.guid().optional(), nameTranslations: LocalizedContentSchema, descriptionTranslations: LocalizedContentSchema, attributeTypeId: z.coerce.number().int().min(1), isRequired: z.boolean().default(false), affectsPricing: z.boolean().default(false), displayOrder: z.coerce.number().int().min(0).default(0) });
export const deleteServiceAttributeDefinitionSchema = z.object({ serviceDefinitionId: z.guid(), attributeDefinitionId: z.guid() });

export const serviceAttributeOptionSchema = z.object({ serviceDefinitionId: z.guid(), attributeDefinitionId: z.guid(), optionId: z.coerce.number().int().min(1).optional(), displayNameTranslations: LocalizedContentSchema, valueTranslations: LocalizedContentSchema, additionalPrice: z.coerce.number().optional().nullable() });
export const deleteServiceAttributeOptionSchema = z.object({ serviceDefinitionId: z.guid(), attributeDefinitionId: z.guid(), optionId: z.coerce.number().int().min(1) });
