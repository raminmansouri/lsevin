import { LocalizedContentResponse } from "@/features/shared/types/localization";

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "gif";
  durationMinutes: number;
  basePrice: number;
  currency: string;
  pricingModel: string;
  isActive: boolean;
  attributeCount: number;
  requirementCount: number;
  uploadRequirementCount: number;
  providerServiceCount: number;
  staffServiceCount: number;
}

export interface ServiceDefinitionUsageSummary {
  providerServiceCount: number;
  activeProviderServiceCount: number;
  staffServiceCount: number;
  activeStaffServiceCount: number;
  bookingDraftCount: number;
}

export interface ServiceDefinitionDetails {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  categoryId: string;
  categoryName: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "gif";
  durationMinutes: number;
  currency: string;
  basePrice: number;
  pricingModel: string;
  isActive: boolean;
  attributeDefinitions: ServiceAttributeDefinition[];
  requirements: ServiceRequirement[];
  uploadRequirements: ServiceDefinitionUploadRequirement[];
  usage: ServiceDefinitionUsageSummary;
}

export interface ServiceAttributeDefinition {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: string;
  attributeTypeId?: number;
  isRequired: boolean;
  affectsPricing: boolean;
  displayOrder: number;
  options: AttributeOption[];
}

export interface AttributeOption {
  id?: number;
  displayName: LocalizedContentResponse;
  value: LocalizedContentResponse;
  additionalPrice?: number;
}

export interface ServiceRequirement {
  id: number;
  description: LocalizedContentResponse;
  isMandatory: boolean;
}

export interface ServiceDefinitionUploadRequirement {
  id: string;
  title: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isRequired: boolean;
  maxFileSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFiles: number;
  displayOrder: number;
  exampleFileUrl?: string | null;
}

export interface ServiceDefinitionWithAllLocales {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  categoryId: string;
  categoryName: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "gif";
  durationMinutes: number;
  basePrice: number;
  currency: string;
  pricingModel: string;
  isActive: boolean;
}

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
