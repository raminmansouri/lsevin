/**
 * The patient side of video consultation: picking a free time with a GP and
 * sending the request. Shared by the server actions and client components.
 */
import type { VideoSessionAttachment, VideoSessionStatus } from "./doctor-panel-types";
import type { VideoDoctor } from "./video-doctors-types";

/** How many days ahead a patient can book. */
export const BOOKING_DAYS_AHEAD = 14;

/** A paid consultation cancelled at least this many hours before its start is refunded. */
export const CANCEL_REFUND_HOURS = 24;

/** How long an uploaded receipt keeps the request's time while an admin checks it (never past the start). */
export const RECEIPT_REVIEW_HOLD_HOURS = 24;

/** Where a booking started, kept on the session. */
export const BOOKING_SOURCES = ["home_card", "doctors_page", "provider", "service", "specialist", "booking"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

/** One package on the booking screen, with its own free times (a longer call needs a longer gap). */
export type BookingPackage = {
  minutes: number;
  priceLabel: string;
  /** Free start times, ISO, soonest first. */
  slots: string[];
};

export type BookingOptions = {
  doctor: VideoDoctor;
  /** The packages this doctor offers the patient, shortest first; the first is preselected. */
  packages: BookingPackage[];
  /** The first package, for screens that show a single length and price. */
  durationMinutes: number;
  priceLabel: string;
  /** Free start times of the first package, ISO, soonest first. */
  slots: string[];
  /** The clinic service the patient came from (a service page or the booking wizard), if any. */
  service: { id: string; name: string } | null;
  /** The signed-in patient's name, to prefill the form. */
  patientName: string;
  /**
   * The visitor looks to be outside Iran. The call server is on the Iranian
   * site, which can't be reached from abroad without an Iranian VPN.
   */
  foreignVisitor: boolean;
};

export type CreateVideoSessionInput = {
  doctorId: string;
  /** The package length the patient picked; the doctor's shortest one when left out. */
  packageMinutes?: number | null;
  source?: BookingSource | null;
  /** category.provider_services id the consultation is about; kept only when it is a service of the doctor's clinic. */
  serviceId?: string | null;
  scheduledAt: string;
  patientName: string;
  patientAge: number | string | null;
  patientGender: "male" | "female" | "other" | null;
  patientNote: string;
  attachmentMediaIds: string[];
};

export type PatientVideoSessionListItem = {
  id: string;
  status: VideoSessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  doctor: Pick<VideoDoctor, "name" | "imageUrl">;
  /** An unpaid request whose hold ran out; the time is no longer kept for it. */
  expired: boolean;
};

export type PatientVideoSession = PatientVideoSessionListItem & {
  priceLabel: string;
  /** Whether the test payment button is on (development and staging only). */
  testPayment: boolean;
  patientNote: string | null;
  attachments: VideoSessionAttachment[];
  /** The GP's write-up, once they have written it. */
  summary: { advice: string | null; nextSteps: string | null; suggestion: string | null } | null;
  /** How this request is paid: the Iranian gateway (toman) or a bank transfer receipt (other currencies). */
  payMethod: "gateway" | "receipt";
  /** The price's currency, so the payment methods can say what the gateway charges. */
  priceCurrency: string;
  /** For receipt payment: where to send the money, as the admin wrote it. */
  receiptInstructions: string | null;
  /** The latest receipt still being checked, or turned down with the admin's note. */
  receipt: { status: "awaiting_review" | "rejected"; note: string | null } | null;
  /**
   * Whether the patient can cancel now, and whether that brings the money back
   * (paid and at least CANCEL_REFUND_HOURS before the start).
   */
  cancel: { allowed: boolean; refundable: boolean };
  /** Who cancelled it, once cancelled. */
  cancelledBy: "patient" | "doctor" | "admin" | null;
  /** The money owed back: waiting for the admin, or already paid back. */
  refund: "pending" | "refunded" | null;
  /**
   * The doctor side cancelled or the doctor never joined: the patient picks their money back or a
   * new time. `canReschedule` is false when the doctor no longer takes bookings.
   */
  doctorIssue: { kind: "missed" | "cancelled"; canReschedule: boolean } | null;
};

/** The patient's consultations split the way the bookings page tabs are. */
export type PatientVideoSessionLists = {
  upcoming: PatientVideoSessionListItem[];
  past: PatientVideoSessionListItem[];
  cancelled: PatientVideoSessionListItem[];
};

/** Error codes the booking screens translate (Consultation.booking.errors.*). */
export type BookingError =
  | "signIn"
  | "unavailable"
  | "notFound"
  | "slotTaken"
  | "invalid"
  | "notJoinable"
  | "alreadyPaid"
  | "expired"
  | "paymentUnavailable"
  | "notCancellable"
  | "notResolvable"
  | "receiptNotAllowed"
  | "receiptMissing"
  | "loadFailed";
