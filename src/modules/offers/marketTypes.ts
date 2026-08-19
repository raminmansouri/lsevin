export const REPEAT_BUSINESS_WINDOW_DAYS = 90;
export const REPEAT_BUSINESS_QUEUE_LIMIT = 8;
export const REPEAT_BUSINESS_REVIEW_MIN_COMPLETED = 3;
export const REPEAT_BUSINESS_REVIEW_PROOF_TARGET = 2;

export type RepeatBusinessIssue =
  | "repeat_demand_no_offer"
  | "completed_demand_low_review_proof"
  | "active_offer_no_recorded_use";

export type RepeatBusinessItem = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  completedBookings90d: number;
  distinctCustomers90d: number;
  repeatCustomers90d: number;
  repeatBookings90d: number;
  activeOfferCount: number;
  activeOfferUses: number;
  approvedReviewCount: number;
  averageRating: number;
  issues: RepeatBusinessIssue[];
};

export type ProviderRepeatBusinessPulse = {
  windowDays: number;
  completedBookings90d: number;
  distinctCustomers90d: number;
  repeatCustomers90d: number;
  servicesWithRepeatDemand: number;
  repeatDemandServicesWithActiveOffer: number;
  repeatOfferCoveragePercent: number;
  servicesNeedingFollowThrough: number;
  activeOfferUsesOnRepeatDemandServices: number;
  reviewProofOpportunities: number;
  queue: RepeatBusinessItem[];
};
