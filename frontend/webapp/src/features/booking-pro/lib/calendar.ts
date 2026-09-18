import { CalendarDate, GregorianCalendar, PersianCalendar, IslamicUmalquraCalendar, parseDate, parseDateTime, toCalendar, toZoned } from '@internationalized/date';

export type BookingCalendar = 'gregorian' | 'jalali' | 'hijri';
export type CalendarDateParts = { year: number; month: number; day: number };
export const BOOKING_CALENDARS: BookingCalendar[] = ['gregorian', 'jalali', 'hijri'];
export const calendarIdentifier = (calendar: BookingCalendar) => ({ gregorian: 'gregory', jalali: 'persian', hijri: 'islamic-umalqura' })[calendar];
export const bookingCalendarSystem = (calendar: BookingCalendar) => calendar === 'jalali' ? new PersianCalendar() : calendar === 'hijri' ? new IslamicUmalquraCalendar() : new GregorianCalendar();
export function bookingCalendarLabel(calendar: BookingCalendar, locale: string): string {
  return new Intl.DisplayNames([locale], { type: 'calendar' }).of(calendarIdentifier(calendar)) || calendar;
}

export function normalizeBookingCalendar(value?: string | null, locale?: string | null): BookingCalendar {
  const raw = String(value || '').trim().toLowerCase();
  if (['jalali', 'persian', 'shamsi'].includes(raw)) return 'jalali';
  if (['hijri', 'islamic', 'islamic-umalqura'].includes(raw)) return 'hijri';
  if (['gregorian', 'gregory', 'iso'].includes(raw)) return 'gregorian';
  return String(locale || '').toLowerCase().startsWith('fa') ? 'jalali' : 'gregorian';
}

export function toIsoDate(input: Date | string): string {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? '' : input.toISOString().slice(0, 10);
  const raw = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    try { return parseDate(raw).toString(); } catch { return ''; }
  }
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function isReasonableBookingIsoDate(value?: string | null) {
  const iso = toIsoDate(String(value || ''));
  return Boolean(iso) && Number(iso.slice(0, 4)) >= 1900 && Number(iso.slice(0, 4)) <= 2200;
}

export function parseBookingCalendarDate(value: string, calendar?: BookingCalendar | string | null, locale?: string | null): string {
  const raw = String(value || '').trim().replace(/[\u06f0-\u06f9\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660))).replace(/[/.]/g, '-');
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return '';
  const [, y, m, d] = match;
  try {
    const date = new CalendarDate(bookingCalendarSystem(normalizeBookingCalendar(calendar, locale)), Number(y), Number(m), Number(d));
    if (date.year !== Number(y) || date.month !== Number(m) || date.day !== Number(d)) return '';
    return date.toString();
  } catch { return ''; }
}

export function jalaliToGregorian(year: number, month: number, day: number): CalendarDateParts {
  const iso = parseBookingCalendarDate(`${year}-${month}-${day}`, 'jalali');
  if (!iso) throw new Error('Invalid Jalali date');
  const date = parseDate(iso);
  return { year: date.year, month: date.month, day: date.day };
}

export function bookingCalendarParts(iso: string, calendar: BookingCalendar): CalendarDateParts {
  const date = toCalendar(parseDate(iso), bookingCalendarSystem(calendar));
  return { year: date.year, month: date.month, day: date.day };
}

export function isBookingTimeZone(value: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return Boolean(value); } catch { return false; }
}

/** Reject ambiguous/nonexistent local times instead of silently shifting bookings. */
export function bookingDateTimeInstant(date: string, time: string, sourceTimeZone: string): Date {
  if (!isBookingTimeZone(sourceTimeZone)) throw new Error('Invalid booking timezone');
  return toZoned(parseDateTime(`${parseDate(date).toString()}T${time}`), sourceTimeZone, 'reject').toDate();
}

type FormatOptions = { locale?: string | null; calendar?: BookingCalendar | string | null; timeZone?: string | null; sourceTimeZone?: string | null; dateStyle?: Intl.DateTimeFormatOptions['dateStyle'] };
export function formatBookingDate(isoDate?: string | null, options?: FormatOptions) {
  const iso = toIsoDate(String(isoDate || ''));
  if (!isReasonableBookingIsoDate(iso)) return '-';
  return new Intl.DateTimeFormat(options?.locale || 'en', {
    calendar: calendarIdentifier(normalizeBookingCalendar(options?.calendar, options?.locale)),
    dateStyle: options?.dateStyle || 'medium', timeZone: 'UTC',
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function formatBookingDateTime(isoDate?: string | null, time?: string | null, options?: FormatOptions) {
  const iso = toIsoDate(String(isoDate || ''));
  if (!isReasonableBookingIsoDate(iso)) return '-';
  const instant = bookingDateTimeInstant(iso, String(time || '00:00'), options?.sourceTimeZone || 'UTC');
  return new Intl.DateTimeFormat(options?.locale || 'en', {
    calendar: calendarIdentifier(normalizeBookingCalendar(options?.calendar, options?.locale)),
    dateStyle: options?.dateStyle || 'medium', timeStyle: 'short', timeZone: options?.timeZone || 'UTC',
  }).format(instant);
}
