export type ProviderProfile = {
  id: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  detailTranslations: Record<string, string> | null;
  streetTranslations: Record<string, string> | null;
  email: string;
  phoneNumberCountryCode: string;
  phoneNumber: string;
  country: string;
  city: string;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
  timezoneId: string;
  languages: string[] | null;
  specialties: string[] | null;
};

export type AdminProviderItem = {
  id: string;
  name: string;
  providerTypeName: string;
  isActive: boolean;
  accredited: boolean;
  isSponsored: boolean;
  country: string;
  city: string;
  email: string;
  rating: number;
  reviewCount: number;
  memberCount: number;
  serviceCount: number;
  activeServiceCount: number;
  staffCount: number;
  openBookingCount: number;
  lastModifiedAt: string | null;
};

export type AdminProviderSummary = {
  total: number;
  active: number;
  inactive: number;
  accredited: number;
  sponsored: number;
  withoutOwner: number;
};

export type AdminCatalogActionItem = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorName: string;
  createdAt: string;
};
