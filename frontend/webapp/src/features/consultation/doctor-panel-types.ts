/**
 * The consultation GP's panel: availability, working hours and their video
 * consultations. Shared by the server actions and the client components.
 */

export type VideoSessionStatus =
  | "awaiting_payment"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

/** Statuses that are over; everything else is still upcoming or running. */
export const FINISHED_SESSION_STATUSES: VideoSessionStatus[] = ["completed", "cancelled", "no_show"];

/** Working hours are interpreted, and every time is shown, in this zone. */
export const PANEL_TIME_ZONE = "Asia/Tehran";

/** 0 = Saturday … 6 = Friday. */
export type DoctorHour = { weekday: number; startTime: string; endTime: string };

export type DoctorPanelProfile = {
  id: string;
  name: string;
  imageUrl: string | null;
  isOnline: boolean;
};

export type VideoSessionListItem = {
  id: string;
  status: VideoSessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  patientName: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | null;
  /** First line of the patient's note, for the list. */
  notePreview: string | null;
  hasSummary: boolean;
};

export type VideoSessionAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
};

export type VideoSessionDetail = VideoSessionListItem & {
  patientNote: string | null;
  attachments: VideoSessionAttachment[];
  startedAt: string | null;
  endedAt: string | null;
  summaryAdvice: string | null;
  summaryNextSteps: string | null;
  summarySuggestion: string | null;
  summaryWrittenAt: string | null;
};

export type DoctorPanelOverview = {
  doctor: DoctorPanelProfile;
  hours: DoctorHour[];
  upcoming: VideoSessionListItem[];
};

export type DoctorHistoryPage = {
  items: VideoSessionListItem[];
  hasMore: boolean;
};

/**
 * When the call room is open: from one consultation length before the booked
 * time until one length after it ends (a 20 minute call at 10:00 is open
 * 09:40–10:40). Inside it the GP and patient can join and leave as often as
 * they like; nothing ends the session early.
 */
export function sessionCallWindow(
  session: Pick<VideoSessionListItem, "scheduledAt" | "durationMinutes">
): { opensAt: number; closesAt: number } {
  const start = new Date(session.scheduledAt).getTime();
  const length = session.durationMinutes * 60_000;
  return { opensAt: start - length, closesAt: start + 2 * length };
}

/** Whether the call room is open for this session at `now`. */
export function canJoinSession(
  session: Pick<VideoSessionListItem, "status" | "scheduledAt" | "durationMinutes">,
  now: number = Date.now()
): boolean {
  if (session.status !== "scheduled" && session.status !== "in_progress" && session.status !== "completed") {
    return false;
  }
  const { opensAt, closesAt } = sessionCallWindow(session);
  return now >= opensAt && now <= closesAt;
}
