/**
 * Schedule rules → concrete departure dates (V-025/V-026, S-065, AT-42).
 *
 * A rule carries the calendar it was authored in. "Every month on day 15" in
 * Jalali and in Gregorian are different rules and produce different dates; the
 * rule's own calendar decides month boundaries and month lengths. A monthly day
 * that a given month does not have (e.g. 31 in a 30-day month, 30 in a 29-day
 * Hijri month) is skipped — never moved to the next day.
 */
import {
  addDaysIso,
  assertIsoDate,
  compareIso,
  isoToParts,
  isoWeekday,
  partsToIso,
  shiftMonth,
  type CalendarId,
} from "./calendar";

export type ScheduleRule = {
  kind: "once" | "weekly" | "monthly_day";
  calendar: CalendarId;
  startDate: string; // ISO
  endDate?: string | null; // ISO, inclusive
  weekdays?: number[]; // ISO 1..7 (weekly)
  monthDay?: number | null; // 1..30, in the rule's calendar (monthly_day)
};

export type DateRange = { from: string; to: string }; // ISO inclusive

const MAX_OCCURRENCES = 1000;

export function expandRule(rule: ScheduleRule, window: DateRange, blackouts: DateRange[] = []): string[] {
  const start = assertIsoDate(rule.startDate, "startDate");
  const from = assertIsoDate(window.from, "from");
  const to = assertIsoDate(window.to, "to");
  const end = rule.endDate ? assertIsoDate(rule.endDate, "endDate") : null;
  const lo = compareIso(start, from) > 0 ? start : from;
  const hi = end && compareIso(end, to) < 0 ? end : to;
  if (compareIso(lo, hi) > 0) return [];

  const out: string[] = [];
  const push = (iso: string) => {
    if (compareIso(iso, lo) < 0 || compareIso(iso, hi) > 0) return;
    if (blackouts.some((b) => compareIso(iso, b.from) >= 0 && compareIso(iso, b.to) <= 0)) return;
    out.push(iso);
  };

  if (rule.kind === "once") {
    push(start);
    return out;
  }

  if (rule.kind === "weekly") {
    const days = new Set((rule.weekdays ?? []).filter((d) => d >= 1 && d <= 7));
    if (days.size === 0) return [];
    for (let iso = lo; compareIso(iso, hi) <= 0 && out.length < MAX_OCCURRENCES; iso = addDaysIso(iso, 1)) {
      if (days.has(isoWeekday(iso))) push(iso);
    }
    return out;
  }

  const monthDay = rule.monthDay ?? 0;
  if (monthDay < 1 || monthDay > 30) return [];
  const first = isoToParts(lo, rule.calendar);
  const last = isoToParts(hi, rule.calendar);
  let ym = { year: first.year, month: first.month };
  while ((ym.year < last.year || (ym.year === last.year && ym.month <= last.month)) && out.length < MAX_OCCURRENCES) {
    const iso = partsToIso({ year: ym.year, month: ym.month, day: monthDay }, rule.calendar);
    if (iso) push(iso);
    ym = shiftMonth(ym.year, ym.month, 1);
  }
  return out;
}

export function isInRanges(iso: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => compareIso(iso, r.from) >= 0 && compareIso(iso, r.to) <= 0);
}
