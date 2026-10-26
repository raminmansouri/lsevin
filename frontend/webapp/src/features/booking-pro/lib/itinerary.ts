import type { BookingDraftState, ChildBookingDraft } from '../types';

/**
 * Pure helpers behind the mobile itinerary (step 3 on small screens). Dates are plain
 * `YYYY-MM-DD` calendar days and times are provider-local `HH:MM` clock times, exactly as the
 * draft stores them; nothing here converts time zones or calendars -- display formatting is
 * done by lib/calendar with the customer's chosen calendar.
 */

export const MAIN_EVENT_ID = 'main';
/** Hard cap so a stray far-future date can never render hundreds of empty days. */
export const MAX_TRIP_DAYS = 45;
const DAY_MS = 86400000;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value?: string | null): value is string {
  return typeof value === 'string' && ISO_DATE_RE.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

/** Normalises a stored date (which may arrive as a full timestamp) to `YYYY-MM-DD`. */
export function dayOf(value?: string | null): string | null {
  if (!value) return null;
  const head = String(value).slice(0, 10);
  return isIsoDate(head) ? head : null;
}

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** `HH:MM[:SS]` → minutes after midnight; null for anything else. */
export function clockToMinutes(value?: string | null): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ''));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes after midnight → `HH:MM`, clamped to the same day (23:59 at most). */
export function minutesToClock(total: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isStay(child: Pick<ChildBookingDraft, 'bookingUiMode'>): boolean {
  return child.bookingUiMode === 'date_range';
}

/** Nights of a stay, never less than 1 -- mirrors stayNights() used for pricing on the server. */
export function stayNights(from?: string | null, to?: string | null): number {
  const a = dayOf(from);
  const b = dayOf(to);
  if (!a || !b) return 1;
  return Math.max(1, daysBetween(a, b));
}

/**
 * What one add-on line costs in the draft's listing currency: the listing price, times the
 * nights for a stay. Same rule as recalculateDraftTotals (which stays the source of truth
 * for the billed total); used only for per-line display.
 */
export function childLineAmount(child: ChildBookingDraft): number {
  const unit = Number(child.subtotalAmount ?? 0);
  if (!Number.isFinite(unit)) return 0;
  return isStay(child) ? unit * stayNights(child.selectedDateFrom, child.selectedDateTo) : unit;
}

/** A timed event on one day of the trip (the main service or a slot add-on). */
export interface TimedEvent {
  id: string;
  date: string;
  start: number;
  end: number;
}

/** A slot add-on with a day and a start time becomes a timed event; a missing end means one hour. */
export function childTimedEvent(child: ChildBookingDraft, key: string): TimedEvent | null {
  if (isStay(child)) return null;
  const date = dayOf(child.selectedDate ?? child.selectedDateFrom);
  const start = clockToMinutes(child.selectedTimeFrom ?? child.selectedTime);
  if (!date || start == null) return null;
  const rawEnd = clockToMinutes(child.selectedTimeTo);
  const end = rawEnd != null && rawEnd > start ? rawEnd : start + 60;
  return { id: key, date, start, end };
}

/** The main booking as a timed event, when it is a single-day slot booking. */
export function mainTimedEvent(draft: Pick<BookingDraftState, 'bookingUiMode' | 'selectedDate' | 'selectedTimeFrom' | 'selectedTimeTo' | 'selectedTime'>, durationMinutes?: number | null): TimedEvent | null {
  if (draft.bookingUiMode === 'date_range') return null;
  const date = dayOf(draft.selectedDate);
  const start = clockToMinutes(draft.selectedTimeFrom ?? draft.selectedTime);
  if (!date || start == null) return null;
  const rawEnd = clockToMinutes(draft.selectedTimeTo);
  const end = rawEnd != null && rawEnd > start ? rawEnd : start + (durationMinutes && durationMinutes > 0 ? durationMinutes : 60);
  return { id: MAIN_EVENT_ID, date, start, end };
}

export function overlaps(a: Pick<TimedEvent, 'date' | 'start' | 'end'>, b: Pick<TimedEvent, 'date' | 'start' | 'end'>): boolean {
  return a.date === b.date && a.start < b.end && b.start < a.end;
}

/** For each event that overlaps another, the id of the first one it overlaps (in start order). */
export function findConflicts(events: TimedEvent[]): Record<string, string> {
  const sorted = [...events].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));
  const result: Record<string, string> = {};
  for (const event of sorted) {
    const other = sorted.find((candidate) => candidate.id !== event.id && overlaps(event, candidate));
    if (other) result[event.id] = other.id;
  }
  return result;
}

/** The first event on `date` that a proposed [start, end) would overlap, ignoring `ignoreId`. */
export function firstClash(events: TimedEvent[], date: string, start: number, end: number, ignoreId?: string): TimedEvent | null {
  return events
    .filter((event) => event.id !== ignoreId)
    .sort((a, b) => a.start - b.start)
    .find((event) => overlaps(event, { date, start, end })) ?? null;
}

/** The day span the itinerary shows: from the earliest to the latest known date. */
export function tripDays(input: {
  draft: Pick<BookingDraftState, 'bookingUiMode' | 'selectedDate' | 'selectedDateFrom' | 'selectedDateTo'>;
  children: ChildBookingDraft[];
  /** Extra days the customer opened ("add a day before/after"), as absolute dates so a day
   *  stays put once something is booked on it. */
  include?: string[];
  today?: string;
}): string[] {
  const dates: string[] = [];
  const push = (value?: string | null) => {
    const day = dayOf(value);
    if (day) dates.push(day);
  };
  if (input.draft.bookingUiMode === 'date_range') {
    push(input.draft.selectedDateFrom);
    push(input.draft.selectedDateTo);
  } else {
    push(input.draft.selectedDate ?? input.draft.selectedDateFrom);
  }
  for (const child of input.children) {
    if (isStay(child)) {
      push(child.selectedDateFrom);
      push(child.selectedDateTo);
    } else {
      push(child.selectedDate ?? child.selectedDateFrom);
    }
  }
  for (const day of input.include ?? []) push(day);
  if (!dates.length) {
    const fallback = dayOf(input.today) ?? new Date().toISOString().slice(0, 10);
    dates.push(fallback);
  }
  dates.sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const span = Math.min(MAX_TRIP_DAYS, daysBetween(first, last) + 1);
  return Array.from({ length: span }, (_, index) => addDays(first, index));
}

/** The stay the customer sleeps in on the night starting `day` (check-in ≤ day < check-out). */
export function stayForNight<T extends ChildBookingDraft>(stays: T[], day: string): T | undefined {
  return stays.find((stay) => {
    const from = dayOf(stay.selectedDateFrom);
    const to = dayOf(stay.selectedDateTo);
    return Boolean(from && to && from <= day && day < to);
  });
}

/** Start times offered for a slot add-on: every half hour from 07:00 to 21:00. */
export const ITINERARY_START_TIMES: number[] = Array.from({ length: 29 }, (_, index) => 7 * 60 + index * 30);
