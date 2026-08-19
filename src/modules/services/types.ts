export type ServiceDefinitionOption = { id: string; label: string; currency: string; value: string };

export type StaffPricedService = {
  providerServiceId: string;
  serviceDefinitionId: string;
  serviceName: string;
  currency: string;
  value: string;
  isActive: boolean;
};
export type ProviderService = {
  id: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  displayNameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  isActive: boolean;
  currency: string;
  value: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  imageUrl: string | null;
  isPopular: boolean;
};

export type AdminServiceItem = {
  id: string;
  providerId: string;
  providerName: string;
  providerActive: boolean;
  serviceDefinitionName: string;
  displayName: string;
  isActive: boolean;
  isPopular: boolean;
  currency: string;
  value: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  rating: number;
  reviewCount: number;
  lastModifiedAt: string | null;
};

export type AdminServiceSummary = {
  total: number;
  active: number;
  inactive: number;
  popular: number;
  inactiveProvider: number;
};

export type ServiceAdminActionItem = {
  id: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorName: string;
  createdAt: string;
};
