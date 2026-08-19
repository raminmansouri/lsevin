export const SERVICE_MERCH_WINDOW_DAYS = 30;
export const SERVICE_MERCH_QUEUE_LIMIT = 8;
export const SERVICE_MERCH_DESCRIPTION_MIN_CHARS = 80;
export const SERVICE_MERCH_REVIEW_PROOF_TARGET = 3;

export type ServiceMerchandisingIssue = "missing_media" | "weak_localized_content" | "no_active_offer" | "low_review_proof";

export type ServiceMerchandisingItem = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  bookings30d: number;
  activeOfferCount: number;
  approvedReviewCount: number;
  averageRating: number;
  galleryItems: number;
  hasImageUrl: boolean;
  hasConfiguredCoverage: boolean;
  hasLocalizedTitle: boolean;
  localizedDescriptionChars: number;
  merchandisingScore: number;
  issues: ServiceMerchandisingIssue[];
};

export type ProviderServiceMerchandisingPulse = {
  windowDays: number;
  activeServices: number;
  bookableServices: number;
  strongBookableServices: number;
  merchandisingStrengthPercent: number;
  bookableServicesToStrengthen: number;
  demandOnServicesToStrengthen30d: number;
  queue: ServiceMerchandisingItem[];
};
