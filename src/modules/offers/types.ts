export type ProviderOffer = { id: number; providerServiceId: string; serviceName: string; title: string; subtitle: string | null; discountPercent: string; validUntil: string; code: string | null; isActive: boolean; isFeatured: boolean; usedCount: number; usageLimit: number | null };
export type OfferServiceOption = { id: string; serviceDefinitionName: string; displayNameTranslations: Record<string, string> };

export type AdminOfferItem = {
  id: number;
  providerId: string;
  providerName: string;
  providerActive: boolean;
  providerServiceId: string;
  serviceName: string;
  title: string;
  subtitle: string | null;
  discountPercent: string;
  validUntil: string;
  code: string | null;
  isActive: boolean;
  isFeatured: boolean;
  usedCount: number;
  usageLimit: number | null;
  isExpired: boolean;
  createdAt: string | null;
};

export type AdminOfferSummary = {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  expired: number;
  exhausted: number;
};

export type OfferAdminActionItem = {
  id: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorName: string;
  createdAt: string;
};
