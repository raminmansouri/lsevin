export type ProviderMarketReadiness = {
  providerActive: boolean;
  profileComplete: boolean;
  activeServices: number;
  activeStaff: number;
  availabilityRules: number;
  mediaItems: number;
  activeOffers: number;
  totalBookings: number;
  bookings30d: number;
  rating: number;
  reviewCount: number;
  firstBookingAt: string | null;
  readinessScore: number;
};

export type ProviderMarketActionKey = "profile" | "services" | "availability" | "media" | "offers" | "bookings";
