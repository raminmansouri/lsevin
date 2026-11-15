/**
 * Stay date ranges are half-open: [checkIn, checkOut). Every night from the
 * arrival date up to, but not including, the departure date is sold; the
 * departure day can be sold to the next guest. Dates are canonical ISO
 * (yyyy-mm-dd) in the property's local calendar day — never a formatted
 * Jalali/Hijri string.
 */
import { addDaysIso, compareIso, isIsoDate } from "@/features/tours/domain/calendar";

export type StayDateError =
  | "check_in_required"
  | "check_out_required"
  | "check_out_before_check_in"
  | "check_in_in_past"
  | "too_far_ahead"
  | "too_many_nights";

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.UTC(+checkIn.slice(0, 4), +checkIn.slice(5, 7) - 1, +checkIn.slice(8, 10));
  const b = Date.UTC(+checkOut.slice(0, 4), +checkOut.slice(5, 7) - 1, +checkOut.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** Every sold night of the stay, in order. */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const n = nightsBetween(checkIn, checkOut);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(addDaysIso(checkIn, i));
  return out;
}

/** Today's date in a time zone (Asia/Tehran by default), as ISO. */
export function todayIn(timeZone = "Asia/Tehran", now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function validateStayDates(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  opts: { today: string; maxNights: number; windowDays: number },
): StayDateError | null {
  if (!checkIn || !isIsoDate(checkIn)) return "check_in_required";
  if (!checkOut || !isIsoDate(checkOut)) return "check_out_required";
  if (compareIso(checkOut, checkIn) <= 0) return "check_out_before_check_in";
  if (compareIso(checkIn, opts.today) < 0) return "check_in_in_past";
  if (compareIso(checkIn, addDaysIso(opts.today, opts.windowDays)) > 0) return "too_far_ahead";
  if (nightsBetween(checkIn, checkOut) > opts.maxNights) return "too_many_nights";
  return null;
}

/**
 * Two ranges overlap when they share at least one night. Back-to-back stays
 * (one checks out the day the other checks in) do not overlap.
 */
export function rangesOverlap(a: { checkIn: string; checkOut: string }, b: { checkIn: string; checkOut: string }): boolean {
  return compareIso(a.checkIn, b.checkOut) < 0 && compareIso(b.checkIn, a.checkOut) < 0;
}
