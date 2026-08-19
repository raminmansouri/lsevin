export type LocaleCode = "fa-IR" | "en-US" | "ar" | "tr-TR";

export type PublicMediaDTO = {
  id: string;
  url: string;
  kind: "image" | "video" | "file";
  alt: string;
  title?: string;
  isPrimary: boolean;
  displayOrder: number;
};

export type PublicReviewDTO = {
  id: string;
  targetType: "provider" | "service" | "staff";
  targetId: string;
  customerName: string;
  rating: number;
  body: string;
  reply?: {
    id: string;
    authorType: "provider" | "staff" | "lsevin_admin";
    body: string;
  };
};

export type PublicStaffDTO = {
  id: string;
  name: string;
  title: string;
  biography: string;
  specialty?: string;
  profileImage?: PublicMediaDTO;
  bookingMode?: "direct" | "request" | "disabled";
};

export type PublicServiceDTO = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price?: {
    amount: string;
    currencyCode: string;
  };
  media: PublicMediaDTO[];
  bookingMode: "slot" | "request" | "custom_form" | "disabled";
};

export type PublicProviderProfileDTO = {
  id: string;
  locale: LocaleCode;
  name: string;
  description: string;
  city?: string;
  country?: string;
  languages: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  ownershipState: "unclaimed" | "pending" | "approved" | "payment_required";
  media: PublicMediaDTO[];
  services: PublicServiceDTO[];
  staff: PublicStaffDTO[];
  reviews: PublicReviewDTO[];
  bookingCta: {
    label: string;
    href: string;
    enabled: boolean;
  };
  updatedAt: string;
};

export const publicProfileRequiredFields: Array<keyof PublicProviderProfileDTO> = [
  "id",
  "locale",
  "name",
  "description",
  "languages",
  "rating",
  "reviewCount",
  "isVerified",
  "ownershipState",
  "media",
  "services",
  "staff",
  "reviews",
  "bookingCta",
  "updatedAt",
];
