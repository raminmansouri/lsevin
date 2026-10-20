/**
 * Shared types of the tours operations layer (check-in, tracking, notices,
 * departures, guides, weather, reviews, waitlist, inquiries, incidents).
 * Implementations live in the sibling modules; UI code imports types from here.
 */
import type { CalendarId } from "../../domain/calendar";
import type { TrackingState, WeatherMode } from "../../domain/live";

export type WeatherView =
  | { status: "unavailable"; reason: "no_location" | "provider_error" | "disabled" }
  | {
      status: "ok";
      mode: WeatherMode;
      source: string;
      attribution: string;
      fetchedAt: string; // ISO instant
      freshness: "fresh" | "stale";
      location: { lat: number; lng: number; label?: string | null };
      current?: { temperatureC: number; condition: string; precipitationProbability: number | null; windKph: number | null; observedAt: string } | null;
      forecast?: { date: string; minC: number; maxC: number; condition: string; precipitationProbability: number | null; windKph: number | null } | null;
      climate?: { month: number; avgMinC: number | null; avgMaxC: number | null; note: string } | null;
    };

export type LiveView = {
  departureId: string;
  canSeeLocation: boolean;
  tracking: TrackingState;
  lastPosition: { lat: number; lng: number; accuracyM: number | null; recordedAt: string } | null;
  milestones: { id: string; kind: string; stopId: string | null; delayMinutes: number | null; note: string | null; createdAt: string }[];
  departureStatus: string;
  delayMinutes: number;
  nextStopId: string | null;
  guideContact: { name: string; phone: string | null } | null;
  emergency: { phone: string; label: string };
};

export type ScanResult = {
  result: "accepted" | "duplicate" | "wrong_departure" | "invalid" | "cancelled_booking";
  bookingId: string | null;
  seats: number;
  leadTraveler: string | null;
  checkedInAt: string | null;
};

export type NoticeInput = {
  departureId: string;
  kind: "delay" | "cancellation" | "meeting_point_change" | "pickup_update" | "weather_hold" | "route_substitution" | "announcement" | "safety" | "itinerary_change" | "guide_change";
  reasonCode?: string | null;
  effectiveAt: string; // ISO instant
  sourceLocale: string;
  texts: Record<string, { title: string; body: string }>;
  payload?: Record<string, unknown>;
};

export type NoticeView = {
  id: string;
  kind: NoticeInput["kind"];
  effectiveAt: string;
  title: string;
  body: string;
  localeUsed: string;
  fellBack: boolean;
  createdAt: string;
};

export type ManifestRow = {
  bookingId: string;
  voucherCode: string;
  status: string;
  seats: number;
  leadName: string;
  participants: { position: number; travelerClass: string; firstName: string; lastName: string; assistance: string | null }[];
  checkedIn: boolean;
  contact: string | null; // masked unless role allows
};

export type ReviewInput = { bookingId: string; rating: number; guideRating?: number | null; body: string; locale: string };

export type DisplayPrefs = { locale: string; calendar: CalendarId; timeZone: string };
