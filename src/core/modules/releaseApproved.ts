/** Exact 24-module platform-backed release boundary. */
export const releaseApprovedModuleIds = [
  "admin-governance","provider-availability","booking-management","provider-bookings","provider-dashboard","provider-finance-legacy","provider-management-hub","provider-media","media-library","notifications-module","provider-offers","provider-onboarding","payment-billing","provider-access","provider-finance-analytics","provider-portal","provider-profile","reporting-analytics","provider-reviews","reviews-standalone","provider-services","provider-staff","provider-support","ticketing",
] as const;
export type ReleaseApprovedModuleId = (typeof releaseApprovedModuleIds)[number];
