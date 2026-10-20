/**
 * Tours calendar contract (S-034, S-055, S-062..S-068, Q-011).
 *
 * Canonical values are ISO-8601 Gregorian dates ("2026-10-24") and absolute
 * instants. Jalali (Solar Hijri) and lunar Hijri exist only for display and for
 * parsing what a person typed. The lunar Hijri convention is Umm al-Qura
 * (CLDR `islamic-umalqura`) — a published, table-driven calendar, so the same
 * date always converts the same way. Regional moon-sighting offsets are not
 * applied silently; `hijriOffsetDays` must be configured explicitly and is
 * then shown to the user.
 *
 * Self-contained on purpose: this file is vendored into lsevin-portal
 * (see scripts/sync-tours-domain.mjs). Keep imports limited to
 * @internationalized/date and sibling domain files.
 */
import {
  CalendarDate,
  GregorianCalendar,
  IslamicUmalquraCalendar,
  PersianCalendar,
  endOfMonth,
  getDayOfWeek,
  parseDate,
  parseDateTime,
  startOfMonth,
  toCalendar,
  toZoned,
  type Calendar,
} from "@internationalized/date";

export type CalendarId = "gregory" | "persian" | "islamic-umalqura";
export const CALENDAR_IDS: readonly CalendarId[] = ["persian", "gregory", "islamic-umalqura"] as const;

export type DateParts = { year: number; month: number; day: number };

export function isCalendarId(value: unknown): value is CalendarId {
  return value === "gregory" || value === "persian" || value === "islamic-umalqura";
}

/** Accepts the platform's older aliases (jalali/hijri/gregorian) as well. */
export function normalizeCalendarId(value: unknown, fallback: CalendarId = "gregory"): CalendarId {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "persian" || raw === "jalali" || raw === "shamsi" || raw === "solar-hijri") return "persian";
  if (raw === "islamic-umalqura" || raw === "hijri" || raw === "islamic" || raw === "lunar-hijri") return "islamic-umalqura";
  if (raw === "gregory" || raw === "gregorian" || raw === "iso") return "gregory";
  return fallback;
}

/** Default display calendar per UI language; always overridable by the user (Q-012). */
export function defaultCalendarForLocale(locale: string, overrides?: Record<string, string>): CalendarId {
  const base = String(locale || "").toLowerCase().split("-")[0];
  if (overrides) {
    const hit = overrides[base] ?? overrides[locale] ?? overrides["*"];
    if (hit) return normalizeCalendarId(hit);
  }
  if (base === "fa") return "persian";
  if (base === "ar") return "islamic-umalqura";
  return "gregory";
}

export function calendarSystem(id: CalendarId): Calendar {
  if (id === "persian") return new PersianCalendar();
  if (id === "islamic-umalqura") return new IslamicUmalquraCalendar();
  return new GregorianCalendar();
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict ISO date validation (rejects 2026-02-30, 2027-02-29, …). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_RE.test(value)) return false;
  try {
    return parseDate(value).toString() === value;
  } catch {
    return false;
  }
}

export function assertIsoDate(value: unknown, label = "date"): string {
  if (!isIsoDate(value)) throw new RangeError(`Invalid ${label}: expected YYYY-MM-DD`);
  return value;
}

/** Persian (۰-۹) and Arabic-Indic (٠-٩) digits → ASCII (S-067). */
export function normalizeDigits(input: string): string {
  return String(input ?? "").replace(/[۰-۹٠-٩]/g, (d) => {
    const code = d.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

/** ISO → year/month/day in the given calendar. */
export function isoToParts(iso: string, calendar: CalendarId): DateParts {
  const date = toCalendar(parseDate(assertIsoDate(iso)), calendarSystem(calendar));
  return { year: date.year, month: date.month, day: date.day };
}

/**
 * Year/month/day in a calendar → ISO, or null when that day does not exist in
 * that calendar (e.g. Esfand 30 in a common Jalali year, Hijri day 30 of a
 * 29-day month). Never "rolls over" to the next month.
 */
export function partsToIso(parts: DateParts, calendar: CalendarId): string | null {
  const { year, month, day } = parts;
  if (![year, month, day].every((n) => Number.isInteger(n))) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  try {
    const system = calendarSystem(calendar);
    const date = new CalendarDate(system, year, month, day);
    if (date.year !== year || date.month !== month || date.day !== day) return null;
    if (day > system.getDaysInMonth(date)) return null;
    return toCalendar(date, new GregorianCalendar()).toString();
  } catch {
    return null;
  }
}

/**
 * Parses what a person typed in the active calendar. Accepts Y-M-D with -, / or .
 * and Persian/Arabic digits. Ambiguous short forms (D/M/Y, two-digit years) are
 * rejected rather than guessed (S-067).
 */
export function parseCalendarInput(input: string, calendar: CalendarId): string | null {
  const raw = normalizeDigits(String(input ?? "").trim()).replace(/[/.]/g, "-");
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  return partsToIso({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }, calendar);
}

export function daysInMonth(year: number, month: number, calendar: CalendarId): number {
  const system = calendarSystem(calendar);
  return system.getDaysInMonth(new CalendarDate(system, year, month, 1));
}

export function addDaysIso(iso: string, days: number): string {
  return parseDate(assertIsoDate(iso)).add({ days }).toString();
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isoWeekday(iso: string): number {
  // 1 = Monday … 7 = Sunday, independent of locale.
  const d = parseDate(assertIsoDate(iso));
  const sundayFirst = getDayOfWeek(d, "en-US"); // 0 = Sunday
  return sundayFirst === 0 ? 7 : sundayFirst;
}

/** First day of week by locale: Saturday for fa/ar/ku/tg, Monday otherwise (configurable). */
export function weekStartForLocale(locale: string): number {
  const base = String(locale || "").toLowerCase().split("-")[0];
  if (base === "fa" || base === "ar" || base === "ku" || base === "tg") return 6;
  if (base === "en" && /-us$/i.test(locale)) return 7;
  return 1;
}

export type MonthCell = { iso: string; day: number; inMonth: boolean; weekday: number };

/**
 * Month grid for a date-picker in any of the three calendars. `year`/`month`
 * are in that calendar; cells carry canonical ISO dates so selection never
 * depends on the display calendar (C-112, AT-22).
 */
export function monthGrid(year: number, month: number, calendar: CalendarId, weekStart: number): MonthCell[][] {
  const system = calendarSystem(calendar);
  const first = startOfMonth(new CalendarDate(system, year, month, 1));
  const last = endOfMonth(first);
  const firstIso = toCalendar(first, new GregorianCalendar()).toString();
  const lead = (isoWeekday(firstIso) - weekStart + 7) % 7;
  const cells: MonthCell[] = [];
  for (let i = lead; i > 0; i -= 1) {
    const d = first.subtract({ days: i });
    const iso = toCalendar(d, new GregorianCalendar()).toString();
    cells.push({ iso, day: d.day, inMonth: false, weekday: isoWeekday(iso) });
  }
  for (let d = first; d.compare(last) <= 0; d = d.add({ days: 1 })) {
    const iso = toCalendar(d, new GregorianCalendar()).toString();
    cells.push({ iso, day: d.day, inMonth: true, weekday: isoWeekday(iso) });
  }
  while (cells.length % 7 !== 0) {
    const prev = parseDate(cells[cells.length - 1].iso).add({ days: 1 });
    const local = toCalendar(prev, system);
    cells.push({ iso: prev.toString(), day: local.day, inMonth: false, weekday: isoWeekday(prev.toString()) });
  }
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12 + 12) % 12 + 1 };
}

export function localeWithCalendar(locale: string, calendar: CalendarId): string {
  return `${locale}-u-ca-${calendar}`;
}

export function formatIsoDate(
  iso: string,
  opts: { locale: string; calendar: CalendarId; style?: "full" | "long" | "medium" | "short" },
): string {
  if (!isIsoDate(iso)) return "—";
  return new Intl.DateTimeFormat(opts.locale, {
    calendar: opts.calendar,
    dateStyle: opts.style ?? "medium",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function formatMonthTitle(year: number, month: number, opts: { locale: string; calendar: CalendarId }): string {
  const iso = partsToIso({ year, month, day: 1 }, opts.calendar);
  if (!iso) return "";
  return new Intl.DateTimeFormat(opts.locale, {
    calendar: opts.calendar,
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** Formats an absolute instant in the tour's own timezone (C-053, S-066). */
export function formatInstant(
  instant: string | Date,
  opts: { locale: string; calendar: CalendarId; timeZone: string; withZone?: boolean },
): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) return "—";
  // dateStyle/timeStyle cannot be combined with timeZoneName, so the zoned
  // variant spells the fields out.
  const options: Intl.DateTimeFormatOptions = opts.withZone
    ? { calendar: opts.calendar, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: opts.timeZone, timeZoneName: "short" }
    : { calendar: opts.calendar, dateStyle: "medium", timeStyle: "short", timeZone: opts.timeZone };
  return new Intl.DateTimeFormat(opts.locale, options).format(date);
}

export function calendarDisplayName(calendar: CalendarId, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "calendar" }).of(calendar) ?? calendar;
  } catch {
    return calendar;
  }
}

export function isValidTimeZone(zone: string): boolean {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

export class LocalTimeError extends Error {
  constructor(public readonly code: "invalid_timezone" | "invalid_date" | "invalid_time" | "nonexistent_or_ambiguous_local_time") {
    super(code);
  }
}

/**
 * Local departure date + time in an IANA zone → absolute instant. Rejects local
 * times that do not exist or occur twice across an offset change (S-066).
 */
export function localToInstant(isoDate: string, time: string, timeZone: string): Date {
  if (!isValidTimeZone(timeZone)) throw new LocalTimeError("invalid_timezone");
  if (!isIsoDate(isoDate)) throw new LocalTimeError("invalid_date");
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time)) throw new LocalTimeError("invalid_time");
  const hhmm = time.length === 5 ? `${time}:00` : time;
  try {
    return toZoned(parseDateTime(`${isoDate}T${hhmm}`), timeZone, "reject").toDate();
  } catch {
    throw new LocalTimeError("nonexistent_or_ambiguous_local_time");
  }
}

/** The calendar date of an instant in a timezone, as ISO. */
export function instantToLocalIso(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
