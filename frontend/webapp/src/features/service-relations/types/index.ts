import { LocalizedContentResponse } from "@/features/shared/types/localization";

export interface ProviderServiceAddonItem {
  addonId: string;
  addonName: string;
  addonKind: string;
  sourceType: string;
  price: number;
  icon?: string | null;
}

export interface ServiceFaqItem { id: string; question: string | null; answer: string | null; }
export interface ServiceIncludedItem { id: string; item: string; }
export interface ServiceProcessItem { id: string; step: number; title: string | null; description: string | null; duration: string | null; }
export interface ServiceAttributeValueItem { id: string; attributeDefinitionId: string; attributeDefinitionName: string; valueTranslations: LocalizedContentResponse; }
export interface ServiceAttributeDefinitionOptionItem { optionId: number; displayNameTranslations: LocalizedContentResponse; valueTranslations: LocalizedContentResponse; additionalPrice: number | null; }
export interface ServiceAttributeDefinitionItem {
  id: string;
  nameTranslations: LocalizedContentResponse;
  descriptionTranslations: LocalizedContentResponse;
  name: string;
  description: string;
  attributeTypeId: number;
  attributeTypeName: string;
  isRequired: boolean;
  affectsPricing: boolean;
  displayOrder: number;
  options: ServiceAttributeDefinitionOptionItem[];
}
export interface ServiceDefinitionAddonProviderTypeItem { id: string; providerTypeId: string; providerTypeName: string; icon?: string | null; displayOrder: number; isRequired: boolean; metadata: Record<string, unknown>; }
export interface ProviderServiceRelationsDetails {
  providerServiceId: string;
  providerServiceName: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  addons: ProviderServiceAddonItem[];
  faqs: ServiceFaqItem[];
  included: ServiceIncludedItem[];
  process: ServiceProcessItem[];
  attributeValues: ServiceAttributeValueItem[];
  availableAttributeDefinitions: Array<{ id: string; name: string }>;
}
export interface ServiceDefinitionRelationsDetails {
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  addonProviderTypes: ServiceDefinitionAddonProviderTypeItem[];
  attributeDefinitions: ServiceAttributeDefinitionItem[];
}

export interface AddonSummary {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  addonKind: string;
  sourceType: string;
  isActive: boolean;
}

export interface AddonLinkedProviderServiceItem {
  providerServiceId: string;
  providerServiceName: string;
  providerName: string;
  serviceDefinitionName: string;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface AddonProviderServicePickerItem extends AddonLinkedProviderServiceItem {
  isLinked: boolean;
}
