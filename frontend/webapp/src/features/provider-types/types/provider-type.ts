import {
  AttributeType,
  attributeTypeFromString,
  AttributeTypeString,
} from "@/features/shared/attributes/types/attribute-type";
import { LocalizedContentResponse } from "@/features/shared/types/localization";

// Response from GetProviderTypeAttributes API
export interface ProviderTypeAttributesResponse {
  providerTypeId: string;
  providerTypeName: string;
  attributes: ProviderAttributeDefinition[];
}

// Public attribute definition for filtering (localized strings, not full response)
export interface ProviderAttributeDefinition {
  id: string;
  name: string;
  description: string;
  attributeType: AttributeTypeString;
  isRequired: boolean;
  options?: AttributeOptionPublic[];
}

export interface AttributeOptionPublic {
  displayName: string;
  value: string;
}

// API response type - what comes from the backend
export interface AttributeDefinitionResponse {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: AttributeTypeString; // API returns string values like "Selection"
  isRequired: boolean;
  validationRules?: string;
  options?: AttributeOption[];
}

// Internal type with proper enum - what we use in the application
export interface AttributeDefinition {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: AttributeType; // Converted enum value
  isRequired: boolean;
  validationRules?: string;
  options?: AttributeOption[];
}

export interface AttributeOption {
  displayName: LocalizedContentResponse;
  value: LocalizedContentResponse;
  additionalPrice?: number;
}

// API response type
export interface NotificationCountResponse {
count:number;
}
export interface ProviderTypeResponse {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isActive: boolean;
  iconUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitions: AttributeDefinitionResponse[];
}

// Internal type with converted enums
export interface ProviderType {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isActive: boolean;
  iconUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitions: AttributeDefinition[];
}

// Internal type with converted enums
export interface ProviderTypeFiltered {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  iconUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitionsCount: number;
}

// Public ProviderType for homepage
export interface PublicProviderType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

// Conversion utilities
export const convertAttributeDefinition = (
  response: AttributeDefinitionResponse
): AttributeDefinition => ({
  ...response,
  attributeType: attributeTypeFromString(response.attributeType),
});

export const convertProviderType = (
  response: ProviderTypeResponse
): ProviderType => ({
  ...response,
  attributeDefinitions: response.attributeDefinitions.map(
    convertAttributeDefinition
  ),
});
