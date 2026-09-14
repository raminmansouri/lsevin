/**
 * Hotel/airport transfer routes -- admin-defined fixed routes (from label, to
 * label, fixed price), not a distance/geocoding calculation. See
 * db/migrations/0040_transfer_routes.sql for the schema this reads/writes.
 *
 * A route IS a category.provider_services row (created/edited through the
 * existing saveProviderServiceAction, same as any other bookable listing) --
 * this feature only owns the thin from/to/vehicle-type enrichment row
 * alongside it, plus the admin screen that edits both together. Booking
 * itself (date/time, cart, checkout, invoice, payment) is entirely
 * booking-pro's existing flow; nothing here re-implements it.
 */

export const TRANSFERS_TRANSLATION_KEY = "Transfers";

export type TransferRouteAdminRow = {
  id: string;
  serviceProviderId: string;
  providerName: string;
  providerServiceId: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  /** Every locale's saved label, keyed by locale -- so editing from one admin
   * locale never has to guess/discard what another locale already has. */
  fromTranslations: Record<string, string>;
  toTranslations: Record<string, string>;
  from: string;
  to: string;
  vehicleType: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  displayNameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  createdAt: string;
  updatedAt: string | null;
};

/** What the storefront (booking-pro's service card) needs to render a route
 * as a distinct "From X -> To Y" chip instead of relying on the listing's
 * free-text name alone. */
export type TransferRouteSummary = {
  from: string;
  to: string;
  vehicleType: string | null;
};

export type TransferRouteActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type TransferRoutesAdminPageData = {
  routes: TransferRouteAdminRow[];
  /** True when migration 0040 has not run yet -- the runner here is manual, so a
   * deploy can legitimately land before the migration does (same convention
   * gym-memberships/consultation use for their own schemaMissing flag). */
  schemaMissing: boolean;
};
