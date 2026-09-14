export type BookingUiMode = 'default_slot' | 'date_range' | 'custom_form';

export interface ProviderCardItem {
  id: string;
  providerTypeId?: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  city?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  featuredScore?: number | null;
  isSponsored?: boolean | null;
  specialties?: string[] | null;
  responseTime?: string | null;
  successRate?: string | null;
  totalPatients?: string | null;
  /**
   * The provider_services row at THIS provider matching the caller's
   * serviceDefinitionId. Lets "same service, different clinic" keep the service
   * instead of cascading it away. Null when no serviceDefinitionId was queried.
   */
  matchingServiceId?: string | null;
}

/** Catalog list responses carry an exact `total` so callers can distinguish
 *  "the only option" from "the first page of many". */
export interface CatalogPage<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface ServiceCardItem {
  id: string;
  serviceDefinitionId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  currency: string;
  value: number;
  durationMinutes?: number | null;
  slotIntervalMinutes?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  recovery?: string | null;
  successRate?: string | null;
  satisfaction?: string | null;
  growth?: string | null;
  isPopular?: boolean | null;
  bookingUiMode?: BookingUiMode;
  requiresSpecialist?: boolean;
  /** Admin/provider-defined attributes for this listing (e.g. a hotel room's View/Bed type),
   * from category.service_attribute_values -- a fixed spec per listing, not a customer-selectable
   * priced option. Undefined/empty when the service has none defined. */
  attributes?: Array<{ name: string; value: string }>;
  /** Admin-defined fixed route (from label, to label, optional vehicle type) when this
   * listing is a transfer.routes-enriched service -- from db/migrations/0040. Undefined
   * for every ordinary (non-transfer) service. */
  route?: { from: string; to: string; vehicleType: string | null };
  /** Item 7 (home nursing): true when this service needs a customer address picked before
   * booking (a provider/admin-set flag on category.service_definitions), e.g. a nurse visiting
   * the customer's home rather than the customer visiting a clinic. */
  requiresCustomerAddress?: boolean;
  /** Item 8 (tours): true when this listing has open fixed departures (tour.departures,
   * migration 0042) to pick from, rather than a free date/time the customer chooses. */
  hasTourDepartures?: boolean;
}

export interface SpecialistCardItem {
  id: string;
  name: string;
  title?: string;
  specialty?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  experience?: string | null;
  patients?: string | null;
  nextAvailableLabel?: string | null;
  successRate?: string | null;
  /** Item 6 (translator booking): languages this staff member speaks, from
   * category.staff_languages -- the same per-staff tagging the admin staff form
   * already writes. Undefined/empty when the staff member has none tagged. */
  languages?: string[];
}

export interface UploadRequirementItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  maxFiles: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  exampleFileUrl?: string | null;
}

export interface ProviderTypeAddonItem {
  providerTypeId: string;
  label: string;
  description?: string;
  icon?: string | null;
  isRequired: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChildBookingDraft {
  id?: string;
  providerTypeId: string;
  providerId?: string;
  serviceId?: string;
  serviceDefinitionId?: string;
  specialistId?: string;
  bookingUiMode: BookingUiMode;
  requiresSpecialist: boolean;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  formSubmissionId?: string;
  subtotalAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  status?: string;
}

export interface BookingDraftState {
  id?: string;
  userId?: string;
  providerId?: string;
  serviceId?: string;
  serviceDefinitionId?: string;
  specialistId?: string;
  requiresSpecialist?: boolean;
  bookingUiMode?: BookingUiMode;
  selectedDate?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedTime?: string;
  selectedTimeFrom?: string;
  selectedTimeTo?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  /** Item 7 (home nursing): the chosen shop.customer_addresses row id, and a JSON-stringified
   * snapshot of it at selection time (addresses can be edited/deleted later; the booking should
   * keep showing what was actually chosen). Both live in the draft's metadata jsonb, same as
   * adults/children/rooms -- no schema change needed on booking.booking_drafts/bookings. */
  customerAddressId?: string;
  customerAddressSnapshot?: string;
  /** Item 8 (tours): which tour.departures row was picked. Picking one also sets
   * selectedDateFrom/selectedDateTo to that departure's dates, so pricing/invoice
   * display need no changes -- this id is only needed to run the capacity check at
   * checkout (reserveTourDeparture). */
  tourDepartureId?: string;
  currentStep: number;
  paymentMethod?: string;
  currency?: string;
  subtotalAmount?: number;
  addonsAmount?: number;
  totalAmount?: number;
  useLsevin?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  formSubmissionId?: string;
  childBookings: ChildBookingDraft[];
  uploadFiles: Array<{ requirementId?: string; mediaIds?: string; fileUrl?: string; title?: string }>;
}
