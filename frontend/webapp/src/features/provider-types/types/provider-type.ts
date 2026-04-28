
import {
  AttributeType,
  attributeTypeFromString,
  AttributeTypeString,
} from "@/features/shared/attributes/types/attribute-type";
import { LocalizedContentResponse } from "@/features/shared/types/localization";

export interface ProviderTypeAttributesResponse {
  providerTypeId: string;
  providerTypeName: string;
  attributes: ProviderAttributeDefinition[];
}

export interface ProviderAttributeDefinition {
  id: string;
  name: string;
  description: string;
  attributeType: AttributeTypeString | string;
  isRequired: boolean;
  options?: AttributeOptionPublic[];
}

export interface AttributeOptionPublic {
  displayName: string;
  value: string;
}

export interface AttributeDefinitionResponse {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: AttributeTypeString | string;
  isRequired: boolean;
  validationRules?: string;
  options?: AttributeOption[];
}

export interface AttributeDefinition {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  attributeType: AttributeType | AttributeTypeString | string;
  isRequired: boolean;
  validationRules?: string;
  options?: AttributeOption[];
}

export interface AttributeOption {
  displayName: LocalizedContentResponse;
  value: LocalizedContentResponse;
  additionalPrice?: number;
}

export interface NotificationCountResponse {
  count: number;
}

export interface ProviderTypeResponse {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isActive: boolean;
  iconUrl?: string;
  imageUrl?: string;
  imagePreviewUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitions: AttributeDefinitionResponse[];
}

export interface ProviderType {
  id: string;
  name: LocalizedContentResponse;
  description: LocalizedContentResponse;
  isActive: boolean;
  iconUrl?: string;
  imageUrl?: string;
  imagePreviewUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitions: AttributeDefinition[];
}

export interface ProviderTypeFiltered {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  iconUrl?: string;
  imageUrl?: string;
  imagePreviewUrl?: string;
  createDate: string;
  lastModifiedDate?: string;
  attributeDefinitionsCount: number;
}

export interface PublicProviderType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  imagePreviewUrl?: string;
}

export const convertAttributeDefinition = (
  response: AttributeDefinitionResponse
): AttributeDefinition => {
  let attributeType: AttributeDefinition["attributeType"] = response.attributeType;
  try {
    attributeType = attributeTypeFromString(response.attributeType as AttributeTypeString);
  } catch {
    attributeType = response.attributeType;
  }

  return {
    ...response,
    attributeType,
  };
};

export const convertProviderType = (
  response: ProviderTypeResponse
): ProviderType => ({
  ...response,
  attributeDefinitions: response.attributeDefinitions.map(convertAttributeDefinition),
});
