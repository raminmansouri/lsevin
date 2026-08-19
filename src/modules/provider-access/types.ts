export type ProviderSummary = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  providerTypeName: string;
  role: "owner" | "admin" | "manager" | "editor" | "viewer" | "staff";
  isDefault: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  staffCount: number;
  bookingCount: number;
};

export type ProviderMember = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isDefault: boolean;
};
