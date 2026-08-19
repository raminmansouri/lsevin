export type ProviderStaff = {
  providerStaffId: string;
  staffId: string;
  nameTranslations: Record<string, string>;
  titleTranslations: Record<string, string>;
  biographyTranslations: Record<string, string>;
  profileImageUrl: string | null;
  isActive: boolean;
  specialty: string | null;
  rating: number;
};

export type AdminStaffItem = {
  providerStaffId: string;
  staffId: string;
  staffName: string;
  title: string;
  specialty: string | null;
  staffActive: boolean;
  linkActive: boolean;
  providerId: string;
  providerName: string;
  providerActive: boolean;
  rating: number;
  reviewCount: number;
  claimStatus: string | null;
  lastModifiedAt: string | null;
};

export type AdminStaffSummary = {
  staffTotal: number;
  staffActive: number;
  staffInactive: number;
  providerLinks: number;
  inactiveLinks: number;
  approvedClaims: number;
};

export type StaffAdminActionItem = {
  id: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorName: string;
  createdAt: string;
};
