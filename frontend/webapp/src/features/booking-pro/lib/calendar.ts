export type BookingCalendar = "gregorian" | "jalali";

export type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

const PERSIAN_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_DIGITS[digit] ?? digit);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function div(a: number, b: number) {
  return ~~(a / b);
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;

  if (jy < jp || jy >= breaks[breaks.length - 1]) {
    throw new Error(`Invalid Jalali year ${jy}`);
  }

  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div((jump % 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(((n % 33) + 3), 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): CalendarDateParts {
  const g = d2g(j2d(Number(jy), Number(jm), Number(jd)));
  return { year: g.gy, month: g.gm, day: g.gd };
}

export function normalizeBookingCalendar(value?: string | null, locale?: string | null): BookingCalendar {
  const raw = String(value || "").trim().toLowerCase();
  if (["jalali", "persian", "shamsi"].includes(raw)) return "jalali";
  if (["gregorian", "gregory", "iso"].includes(raw)) return "gregorian";
  return String(locale || "").toLowerCase().startsWith("fa") ? "jalali" : "gregorian";
}

export function toIsoDate(input: Date | string) {
  if (input instanceof Date) return input.toISOString().slice(0, 10);
  const trimmed = String(input || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function isReasonableBookingIsoDate(isoDate?: string | null) {
  const safeIso = toIsoDate(String(isoDate || ""));
  if (!safeIso) return false;
  const year = Number(safeIso.slice(0, 4));
  return Number.isFinite(year) && year >= 1900 && year <= 2200;
}

export function formatBookingDate(
  isoDate?: string | null,
  options?: {
    locale?: string | null;
    calendar?: BookingCalendar | string | null;
    dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
    timeZone?: string | null;
  }
) {
  const safeIso = toIsoDate(String(isoDate || ""));
  if (!safeIso) return "-";

  if (!isReasonableBookingIsoDate(safeIso)) {
    return "Invalid date — please reselect";
  }

  const calendar = normalizeBookingCalendar(options?.calendar, options?.locale);
  const locale = calendar === "jalali" ? "fa-IR-u-ca-persian" : options?.locale || "en-US";
  const date = new Date(`${safeIso}T12:00:00Z`);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: options?.dateStyle || "medium",
    timeZone: options?.timeZone || "UTC",
  }).format(date);
}

export function formatBookingDateTime(
  isoDate?: string | null,
  time?: string | null,
  options?: {
    locale?: string | null;
    calendar?: BookingCalendar | string | null;
    timeZone?: string | null;
  }
) {
  const safeIso = toIsoDate(String(isoDate || ""));
  if (!safeIso) return "-";

  if (!isReasonableBookingIsoDate(safeIso)) {
    return "Invalid date — please reselect";
  }

  const normalizedTime = String(time || "00:00").slice(0, 5);
  const calendar = normalizeBookingCalendar(options?.calendar, options?.locale);
  const locale = calendar === "jalali" ? "fa-IR-u-ca-persian" : options?.locale || "en-US";
  const date = new Date(`${safeIso}T${normalizedTime}:00Z`);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: options?.timeZone || "UTC",
  }).format(date);
}

export function parseBookingCalendarDate(
  value: string,
  calendar: BookingCalendar | string | null | undefined,
  locale?: string | null
) {
  const normalizedCalendar = normalizeBookingCalendar(calendar, locale);
  const raw = toLatinDigits(String(value || "").trim()).replace(/[/.]/g, "-");

  if (!raw) return "";
  if (normalizedCalendar === "gregorian") return toIsoDate(raw);

  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return "";
  const [, y, m, d] = match;
  const gregorian = jalaliToGregorian(Number(y), Number(m), Number(d));
  return `${gregorian.year}-${pad(gregorian.month)}-${pad(gregorian.day)}`;
}
