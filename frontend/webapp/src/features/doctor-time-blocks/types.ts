import type { SpecialistGridSlot } from "@/features/booking-pro/server/booking-availability.repository";

/** `metadata.source` on the block rules this page creates. */
export const TIME_BLOCK_SOURCE = "admin_time_block";
/** Permission resource: the sidebar row `/admin/staff/time-blocks`. */
export const TIME_BLOCKS_RESOURCE = "staff.time-blocks";
export const TIME_BLOCKS_PATH = "/admin/staff/time-blocks";

export type DoctorOption = { id: string; name: string; title: string | null };

/** One clinic + service the doctor can be booked for; it decides how the day is cut into slots. */
export type DoctorServiceOption = {
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
};

export type GridSlot = SpecialistGridSlot;

/** A block that touches the shown day, as stored. Times are null for a whole-day block. */
export type DayBlock = {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  /** Weekly (`day_of_week`) rather than for one date: not editable from this page. */
  recurring: boolean;
  reason: string | null;
};

/** One row of the "upcoming blocks" list: rules created together are shown and removed together. */
export type BlockGroup = {
  key: string;
  ruleIds: string[];
  fromDate: string | null;
  toDate: string | null;
  /** For a weekly rule: ISO weekday 1 (Monday) … 7 (Sunday). */
  dayOfWeek: number | null;
  startsAt: string | null;
  endsAt: string | null;
  /** The pieces don't all share the same times (e.g. one slot was later unblocked). */
  mixedTimes: boolean;
  days: number;
  reason: string | null;
  createdHere: boolean;
};

/** A pending/confirmed booking of this doctor inside a range that was just blocked. */
export type ConflictingBooking = {
  id: string;
  date: string;
  timeFrom: string | null;
  timeTo: string | null;
  customerName: string | null;
  confirmationCode: string | null;
  status: string;
};

export type DayView = {
  date: string;
  slots: GridSlot[];
  blocks: DayBlock[];
};

// `error`/`data` are declared on both arms so callers compile without strictNullChecks narrowing.
export type ActionResult<T> = { ok: true; data: T; error?: undefined } | { ok: false; error: string; data?: undefined };
