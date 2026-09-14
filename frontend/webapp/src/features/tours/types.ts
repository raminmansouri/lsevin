/**
 * Multi-day tours with fixed, shared-capacity departures (item 8, first half --
 * "subscription-gathering"/waitlist is a separate, later piece). See
 * db/migrations/0042_tour_departures.sql for the schema this reads/writes.
 *
 * The tour listing itself (name, rich description, price, itinerary/FAQs/what's
 * included) is an ordinary category.provider_services row authored through the
 * existing admin tools -- this feature only owns the departure dates + capacity
 * enrichment, and the customer-facing "pick a departure" step.
 */

export const TOURS_TRANSLATION_KEY = "Tours";

export type TourDeparture = {
  id: string;
  providerServiceId: string;
  startsOn: string;
  endsOn: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isActive: boolean;
};

export type TourDepartureAdminRow = TourDeparture & {
  serviceProviderId: string;
  providerName: string;
  serviceName: string;
  currency: string;
  price: number;
  createdAt: string;
  updatedAt: string | null;
};

export type TourDeparturesAdminPageData = {
  departures: TourDepartureAdminRow[];
  /** True when migration 0042 has not run yet -- same schemaMissing convention
   * gym-memberships/transfers/consultation use for themselves. */
  schemaMissing: boolean;
};

export type TourActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Subscription-gathering (item 8, second half) -- see
 * db/migrations/0043_tour_gathering_campaigns.sql. Deliberately NOT built on
 * booking-pro's booking.bookings: that path assumes a fixed date is already
 * chosen before payment, the opposite of what a gathering campaign is. A
 * participant row IS the booking record here, mirroring gym-memberships'
 * membership_months shape (join -> admin review -> approved) exactly.
 */

export const GATHERING_STATUSES = ["gathering", "confirmed", "cancelled"] as const;
export type GatheringStatus = (typeof GATHERING_STATUSES)[number];

export const GATHERING_PARTICIPANT_STATUSES = ["pending_review", "approved", "rejected"] as const;
export type GatheringParticipantStatus = (typeof GATHERING_PARTICIPANT_STATUSES)[number];

export type TourGatheringCampaign = {
  id: string;
  serviceProviderId: string;
  providerServiceId: string;
  providerName: string;
  serviceName: string;
  targetHeadcount: number;
  approvedCount: number;
  pendingCount: number;
  pricePerPerson: number;
  currency: string;
  joinDeadline: string | null;
  status: GatheringStatus;
  confirmedStartsOn: string | null;
  confirmedEndsOn: string | null;
  createdAt: string;
};

export type TourGatheringParticipant = {
  id: string;
  campaignId: string;
  status: GatheringParticipantStatus;
  amount: number;
  currency: string;
  paymentReference: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

/** One row per participant, flattened with its campaign/tour/customer context -- the
 * shape the admin review queue needs, mirrors GymMembershipMonthAdminRow exactly. */
export type TourGatheringParticipantAdminRow = TourGatheringParticipant & {
  userId: string;
  providerName: string;
  serviceName: string;
  targetHeadcount: number;
  approvedCount: number;
};

export type TourGatheringCampaignsAdminPageData = {
  campaigns: TourGatheringCampaign[];
  participants: TourGatheringParticipantAdminRow[];
  /** True when migration 0043 has not run yet. */
  schemaMissing: boolean;
};
