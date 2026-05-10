import type { LocalizedContentResponse } from "@/features/shared/types/localization";

export interface ProviderPolicyType {
  id: string;
  code: string;
  nameTranslations: LocalizedContentResponse;
  descriptionTranslations: LocalizedContentResponse;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createDate: string;
  lastModifiedDate?: string | null;
  policyCount: number;
}

export interface ProviderPolicyTypeMutationInput {
  id?: string;
  code: string;
  nameTranslations: LocalizedContentResponse;
  descriptionTranslations: LocalizedContentResponse;
  displayOrder: number;
  isActive: boolean;
}
