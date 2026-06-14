import { z } from "zod/v4";

import { AttributeType } from "../types/attribute-type";

// Base Attribute Option schema (used by both ServiceDefinition and ProviderType)
export const BaseAttributeOptionSchema = z.object({
  displayName: z.string().min(1),
  value: z.string().min(1),
});

// Service Attribute Option schema (includes additionalPrice)
export const ServiceAttributeOptionSchema = BaseAttributeOptionSchema.extend({
  additionalPrice: z.number().min(0).optional(),
});

// Provider Attribute Option schema (no additionalPrice)
export const ProviderAttributeOptionSchema = BaseAttributeOptionSchema;

// Base Attribute Definition schema (common fields)
export const BaseAttributeDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  attributeType: z.enum(AttributeType),
  isRequired: z.boolean().default(false),
});

export const ServiceAttributeDefinitionSchema =
  BaseAttributeDefinitionSchema.extend({
    affectsPricing: z.boolean().default(false),
    options: z.array(ServiceAttributeOptionSchema).optional(),
  });

// Provider Attribute Definition schema (includes validationRules)
export const ProviderAttributeDefinitionSchema =
  BaseAttributeDefinitionSchema.extend({
    validationRules: z.string().max(250).optional(),
    options: z.array(ProviderAttributeOptionSchema).optional(),
  });

// CRUD schemas
export const CreateServiceAttributeDefinitionSchema =
  ServiceAttributeDefinitionSchema.extend({
    serviceDefinitionId: z.guid(),
  });

export const CreateProviderAttributeDefinitionSchema =
  ProviderAttributeDefinitionSchema.extend({
    providerTypeId: z.guid(),
    attributeTypeId: z.enum(AttributeType), // Backend expects attributeTypeId not attributeType
  }).omit({ attributeType: true });

export const DeleteAttributeDefinitionSchema = z.object({
  serviceDefinitionId: z.guid().optional(),
  providerTypeId: z.guid().optional(),
  attributeDefinitionId: z.guid(),
});

// Type exports
export type BaseAttributeOption = z.infer<typeof BaseAttributeOptionSchema>;
export type ServiceAttributeOption = z.infer<
  typeof ServiceAttributeOptionSchema
>;
export type ProviderAttributeOption = z.infer<
  typeof ProviderAttributeOptionSchema
>;

export type BaseAttributeDefinition = z.infer<
  typeof BaseAttributeDefinitionSchema
>;
export type ServiceAttributeDefinition = z.infer<
  typeof ServiceAttributeDefinitionSchema
>;
export type ProviderAttributeDefinition = z.infer<
  typeof ProviderAttributeDefinitionSchema
>;

export type CreateServiceAttributeDefinitionInput = z.infer<
  typeof CreateServiceAttributeDefinitionSchema
>;
export type CreateProviderAttributeDefinitionInput = z.infer<
  typeof CreateProviderAttributeDefinitionSchema
>;
export type DeleteAttributeDefinitionInput = z.infer<
  typeof DeleteAttributeDefinitionSchema
>;
