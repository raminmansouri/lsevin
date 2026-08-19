import adminGovernanceModule from "@modules/admin-governance/module";
import availabilityModule from "@modules/availability/module";
import bookingManagementModule from "@modules/booking-management/module";
import bookingsModule from "@modules/bookings/module";
import dashboardModule from "@modules/dashboard/module";
import legacyFinanceModule from "@modules/finance/module";
import manageModule from "@modules/manage/module";
import mediaModule from "@modules/media/module";
import mediaLibraryModule from "@modules/media-library/module";
import notificationsModule from "@modules/notifications-module/module";
import offersModule from "@modules/offers/module";
import onboardingModule from "@modules/onboarding/module";
import paymentBillingModule from "@modules/payment-billing/module";
import providerAccessModule from "@modules/provider-access/module";
import providerFinanceAnalyticsModule from "@modules/provider-finance-analytics/module";
import providerPortalModule from "@modules/provider-portal/module";
import providersModule from "@modules/providers/module";
import reportingAnalyticsModule from "@modules/reporting-analytics/module";
import reviewsModule from "@modules/reviews/module";
import reviewsStandaloneModule from "@modules/reviews-standalone/module";
import servicesModule from "@modules/services/module";
import staffModule from "@modules/staff/module";
import supportModule from "@modules/support/module";
import ticketingModule from "@modules/ticketing/module";
import releaseProfile from "./release-profile.json";
import type { ExtendedModuleDefinition } from "./types";

// Exact RC16.2 platform-backed publication set. Source folders, registry imports and
// this release profile are intentionally kept one-to-one so unsupported historical
// modules cannot leak routes, APIs, navigation, capabilities or migrations.
const releaseCandidates: ExtendedModuleDefinition[] = [
  adminGovernanceModule,
  availabilityModule,
  bookingManagementModule,
  bookingsModule,
  dashboardModule,
  legacyFinanceModule,
  manageModule,
  mediaModule,
  mediaLibraryModule,
  notificationsModule,
  offersModule,
  onboardingModule,
  paymentBillingModule,
  providerAccessModule,
  providerFinanceAnalyticsModule,
  providerPortalModule,
  providersModule,
  reportingAnalyticsModule,
  reviewsModule,
  reviewsStandaloneModule,
  servicesModule,
  staffModule,
  supportModule,
  ticketingModule,
];

const enabledModuleIds = new Set<string>(releaseProfile.enabledModuleIds);
export const extendedModules = releaseCandidates.filter((module) => enabledModuleIds.has(module.id));

const importedIds = new Set(releaseCandidates.map((module) => module.id));
const missing = releaseProfile.enabledModuleIds.filter((moduleId) => !importedIds.has(moduleId));
const extra = releaseCandidates.map((module) => module.id).filter((moduleId) => !enabledModuleIds.has(moduleId));
if (missing.length || extra.length || extendedModules.length !== releaseProfile.enabledModuleIds.length) {
  throw new Error(`RC16.2 release profile/registry mismatch. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`);
}

export const activeReleaseProfile = {
  name: releaseProfile.profile,
  description: releaseProfile.description,
  enabledModuleIds: [...releaseProfile.enabledModuleIds],
} as const;

export function getModuleById(moduleId: string) {
  return extendedModules.find((module) => module.id === moduleId) ?? null;
}
