// ServiceDefinition interfaces based on OpenAPI schemas

import { LocalizedContentResponse } from "@/features/shared/types/localization";

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  basePrice: number;
  currency: string;
  pricingModel: string;
  isActive: boolean;
  attributeCount: number;
  requirementCount: number;
}

export interface ServiceDefinitionDetails {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  currency: string;
  basePrice: number;
  pricingModel: string;
  isActive: boolean;
  attributeDefinitions: ServiceAttributeDefinition[];
  requirements: ServiceRequirement[];
}

export interface ServiceAttributeDefinition {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: string;
  isRequired: boolean;
  affectsPricing: boolean;
  displayOrder: number;
  options: AttributeOption[];
}

export interface AttributeOption {
  displayName: LocalizedContentResponse;
  value: LocalizedContentResponse;
  additionalPrice?: number;
}

export interface ServiceRequirement {
  description: LocalizedContentResponse;
  isMandatory: boolean;
}

// Service definition with all locales for selector
export interface ServiceDefinitionWithAllLocales {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  basePrice: number;
  currency: string;
  pricingModel: string;
  isActive: boolean;
}

// Option interface for selector component
export interface ServiceDefinitionOptionWithAllLocales {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  categoryName: string;
  price: number;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
}
