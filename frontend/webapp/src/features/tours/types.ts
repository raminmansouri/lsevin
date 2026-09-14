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
