import type { StayQuote } from "./domain/pricing";
import type { MealPlan, PropertyKind } from "./domain/search";

/** A translation picked for the visitor's language, with what it fell back from. */
export type Text = { value: string; locale: string; isFallback: boolean } | null;

export type CitySummary = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  coverCredit: string | null;
  propertyCount: number;
  fromPrice: number | null;
  currency: string | null;
  isFeatured: boolean;
};

export type CityDetail = CitySummary & { intro: Text; latitude: number | null; longitude: number | null };

export type PropertyCard = {
  id: string;
  slug: string;
  name: string;
  kind: PropertyKind;
  starRating: number | null;
  city: { slug: string; name: string };
  coverUrl: string | null;
  coverAlt: string;
  ratingAvg: number | null;
  reviewCount: number;
  amenities: string[];
  instant: boolean;
  freeCancellation: boolean;
  accessible: boolean;
  medicalFriendly: boolean;
  currency: string;
  /** With dates: complete total for the whole stay (all rooms, taxes, fees). */
  total: number | null;
  nights: number | null;
  /** Without dates: lowest nightly price for one unit, labelled "from". */
  fromNightly: number | null;
  /** Units left of the cheapest fitting room type; only shown when low and real. */
  unitsLeft: number | null;
  available: boolean | null;
  latitude: number | null;
  longitude: number | null;
  approximate: boolean;
  /** Straight-line distance to the search's place (null when the search has none). */
  distanceM: number | null;
  /** At least one fitting rate includes breakfast or more. */
  breakfastIncluded: boolean;
  /** Short, factual reasons this stay stands out in these results. */
  highlights: ("walkable" | "top_rated" | "great_value")[];
};

/** The place a location search is anchored to. */
export type SearchAnchor = {
  kind: "point" | "provider" | Landmark["kind"];
  name: string | null;
  latitude: number;
  longitude: number;
  citySlug: string | null;
};

export type Landmark = {
  city: string;
  slug: string;
  kind: "shrine" | "attraction" | "park" | "shopping" | "airport" | "station" | "hospital" | "clinic" | "beach" | "university" | "other";
  name: string;
  latitude: number;
  longitude: number;
  quick: boolean;
};

export type SearchResult = {
  items: PropertyCard[];
  total: number;
  page: number;
  pageSize: number;
  priceBounds: { min: number; max: number } | null;
  anchor: SearchAnchor | null;
};

export type Amenity = { imageUrl?: string | null; parentCode?: string | null; code: string; group: string; label: string; icon: string | null };

export type MediaItem = { id: string; url: string; alt: string; credit: string | null; roomTypeId: string | null };

export type RatePlanOffer = {
  ratePlanId: string;
  code: string;
  name: string | null;
  mealPlan: MealPlan;
  refundable: boolean;
  /** Without dates: price per night for one unit at base occupancy. */
  nightlyFrom: number;
  quote: StayQuote | null;
  /** Why this plan cannot be booked for the selected stay (null when bookable). */
  unavailableReason: string | null;
  longStay: { nights: number; percent: number } | null;
  minNights: number;
};

export type RoomOffer = {
  roomTypeId: string;
  code: string;
  name: string;
  description: Text;
  media: MediaItem[];
  baseOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  beds: { type: string; count: number }[];
  sizeM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  units: number;
  /** Units left for the selected nights (null without dates). */
  unitsLeft: number | null;
  fitsParty: boolean;
  plans: RatePlanOffer[];
};

export type PolicySummary = {
  id: string;
  version: number;
  rules: { hoursBefore: number; refundPercent: number }[];
  noShowRefundPercent: number;
  text: Text;
};

export type ReviewItem = {
  id: string;
  rating: number;
  scores: { cleanliness: number | null; location: number | null; staff: number | null; value: number | null };
  body: string | null;
  locale: string;
  authorName: string | null;
  createdAt: string;
  providerReply: string | null;
  stayMonth: string | null;
  nights: number | null;
  /** The room type the reviewer stayed in (reviews are tied to a booking). */
  roomTypeId: string | null;
  roomName: string | null;
};

export type PropertyDetail = {
  id: string;
  slug: string;
  status: string;
  kind: PropertyKind;
  inventoryModel: "rooms" | "entire_place";
  starRating: number | null;
  name: Text;
  summary: Text;
  description: Text;
  houseRules: Text;
  address: Text;
  city: { slug: string; name: string; region: string | null };
  provider: { id: string; name: string | null };
  media: MediaItem[];
  location: { latitude: number; longitude: number; approximate: boolean; radiusM: number } | null;
  checkInTime: string;
  checkOutTime: string;
  amenities: Amenity[];
  nearby: { kind: string; name: string; distanceM: number }[];
  accessibility: { stepFree: boolean; accessibleBathroom: boolean; verified: boolean };
  medicalFriendly: boolean;
  rules: { pets: boolean; smoking: boolean; parties: boolean; familiesOnly: boolean; idRequired: boolean; childFreeUnderAge: number };
  confirmationMode: "instant" | "request";
  requestTimeoutHours: number;
  currency: string;
  taxPercent: number;
  timezone: string;
  ratingAvg: number | null;
  reviewCount: number;
  ratingBreakdown: { cleanliness: number | null; location: number | null; staff: number | null; value: number | null };
  policy: PolicySummary | null;
  fromNightly: number | null;
  sourceLocale: string;
  /** Languages the property's own name is written in (for hreflang / indexing). */
  nameLocales: string[];
  updatedAt: string;
};

export type BookingStatus = "pending_payment" | "requested" | "confirmed" | "declined" | "cancelled" | "completed" | "no_show" | "expired";

export type MyStayBooking = {
  bookingId: string;
  voucherCode: string;
  status: BookingStatus;
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  roomName: string;
  coverUrl: string | null;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  childAges: number[];
  currency: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  confirmationMode: "instant" | "request";
  mealPlan: string;
  refundable: boolean;
  checkInTime: string;
  checkOutTime: string;
  timezone: string;
  /** Approximate-location home: exact address and phone only once confirmed. */
  privateHome: boolean;
  address: string | null;
  location: { latitude: number; longitude: number } | null;
  contactPhone: string | null;
  buyer: { firstName: string; lastName: string; phone: string; email?: string | null };
  guests: { firstName: string; lastName: string }[];
  specialRequests: string | null;
  arrivalTime: string | null;
  policy: { rules: { hoursBefore: number; refundPercent: number }[]; noShowRefundPercent: number; text: string | null };
  priceSnapshot: StayQuote;
  paymentDeadlineAt: string | null;
  requestExpiresAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundQuote: { refundAmount: number; refundPercent: number } | null;
  canReview: boolean;
  reviewed: boolean;
};
