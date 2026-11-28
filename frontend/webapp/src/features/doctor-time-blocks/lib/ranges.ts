/**
 * Pure helpers for doctor time blocks: wall-clock times as minutes since midnight, and date
 * ranges as ISO days. Kept free of server imports so they can be unit tested and shared.
 */

export const MINUTES_PER_DAY = 24 * 60;
/** The longest range one "block a range" request may cover. */
export const MAX_RANGE_DAYS = 92;

const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "09:30" / "09:30:00" -> 570. `null` for anything else (and for 24:xx other than 24:00). */
export function timeToMinutes(value: string | null | undefined): number | null {
  const match = TIME_RE.exec(String(value ?? "").trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > MINUTES_PER_DAY ? null : minutes;
}

/** 570 -> "09:30"; 1440 -> "24:00" (Postgres `time` accepts it as end of day). */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type MinuteRange = { start: number; end: number };

/**
 * What is left of `block` after cutting `cut` out of it: zero, one or two ranges.
 * Both are half-open, `[start, end)`, like the availability query's `tsrange(..., '[)')`.
 */
export function subtractRange(block: MinuteRange, cut: MinuteRange): MinuteRange[] {
  if (cut.end <= block.start || cut.start >= block.end) return [block];
  const pieces: MinuteRange[] = [];
  if (cut.start > block.start) pieces.push({ start: block.start, end: cut.start });
  if (cut.end < block.end) pieces.push({ start: cut.end, end: block.end });
  return pieces;
}

export function isIsoDate(value: string | null | undefined): value is string {
  if (!DATE_RE.test(String(value ?? ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Every ISO day from `from` to `to`, both included. Empty when the range is invalid. */
export function expandDates(from: string, to: string): string[] {
  if (!isIsoDate(from) || !isIsoDate(to) || from > to) return [];
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date on the clinics' clock (Tehran by default), as an ISO day. */
export function todayIso(timeZone = "Asia/Tehran", now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
