export const AVAILABILITY_MARKET_WINDOW_DAYS = 30;
export const AVAILABILITY_UPCOMING_WINDOW_DAYS = 30;
export const AVAILABILITY_GAP_QUEUE_LIMIT = 8;

export type AvailabilityCoverageMode = "service_rule" | "provider_rule" | "operating_hours" | "none";

export type AvailabilityCoverageServiceItem = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  bookings30d: number;
  upcomingBookings30d: number;
  positiveServiceRules: number;
  blockingServiceRules: number;
  coverageMode: AvailabilityCoverageMode;
  hasConfiguredCoverage: boolean;
};

export type ProviderAvailabilityConversionPulse = {
  windowDays: number;
  upcomingWindowDays: number;
  activeServices: number;
  servicesWithConfiguredCoverage: number;
  coveragePercent: number;
  demandServices30d: number;
  demandWithoutCoverage: number;
  upcomingWithoutCoverage: number;
  openOperatingDays: number;
  activeProviderPositiveRules: number;
  gapQueue: AvailabilityCoverageServiceItem[];
};
