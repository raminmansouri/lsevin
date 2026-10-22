/**
 * The patient side of video consultation: picking a free time with a GP and
 * sending the request. Shared by the server actions and client components.
 */
import type { VideoSessionAttachment, VideoSessionStatus } from "./doctor-panel-types";
import type { VideoDoctor } from "./video-doctors-types";

/** How many days ahead a patient can book. */
export const BOOKING_DAYS_AHEAD = 14;

export type BookingOptions = {
  doctor: VideoDoctor;
  durationMinutes: number;
  priceLabel: string;
  /** Free start times, ISO, soonest first. */
  slots: string[];
  /** The signed-in patient's name, to prefill the form. */
  patientName: string;
};

export type CreateVideoSessionInput = {
  doctorId: string;
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
  patientNote: string | null;
  attachments: VideoSessionAttachment[];
  /** The GP's write-up, once they have written it. */
  summary: { advice: string | null; nextSteps: string | null; suggestion: string | null } | null;
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
  | "loadFailed";
