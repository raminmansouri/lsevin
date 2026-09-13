import { describe, expect, it } from 'vitest';
import { BOOKING_CALENDARS, bookingCalendarParts, bookingDateTimeInstant, formatBookingDate, normalizeBookingCalendar, parseBookingCalendarDate, toIsoDate } from './calendar';

describe('booking calendars and timezones', () => {
  it('converts known Jalali and Umm al-Qura dates to Gregorian storage', () => {
    expect(parseBookingCalendarDate('1403-01-01', 'jalali')).toBe('2024-03-20');
    expect(parseBookingCalendarDate('1445-09-01', 'hijri')).toBe('2024-03-11');
  });
  it.each(BOOKING_CALENDARS)('round-trips leap days and year boundaries through %s', calendar => {
    for (const iso of ['2024-02-29', '2024-03-20', '2025-12-31', '2026-01-01', '2026-09-13']) {
      const parts = bookingCalendarParts(iso, calendar);
      expect(parseBookingCalendarDate(`${parts.year}-${parts.month}-${parts.day}`, calendar)).toBe(iso);
    }
  });
  it('accepts Persian and Arabic digits without accepting impossible dates', () => {
    expect(parseBookingCalendarDate('\u06f1\u06f4\u06f0\u06f3/\u06f0\u06f1/\u06f0\u06f1', 'jalali')).toBe('2024-03-20');
    expect(parseBookingCalendarDate('2025-02-29', 'gregorian')).toBe('');
    expect(parseBookingCalendarDate('1445-13-01', 'hijri')).toBe('');
    expect(toIsoDate('2026-02-30')).toBe('');
    expect(toIsoDate(new Date(NaN))).toBe('');
  });
  it('respects an explicitly selected calendar independently of language', () => {
    expect(formatBookingDate('2024-03-20', { calendar: 'gregorian', locale: 'fa' })).toContain('\u06f2\u06f0\u06f2\u06f4');
    expect(normalizeBookingCalendar('islamic-umalqura')).toBe('hijri');
  });
  it('does not move hotel nights when the viewer changes timezone', () => {
    expect(formatBookingDate('2026-09-13', { locale: 'en', timeZone: 'Pacific/Kiritimati' })).toBe(formatBookingDate('2026-09-13', { locale: 'en', timeZone: 'America/Los_Angeles' }));
  });
  it('converts provider-local appointments into instants', () => {
    expect(bookingDateTimeInstant('2026-09-13', '12:00', 'Asia/Tehran').toISOString()).toBe('2026-09-13T08:30:00.000Z');
  });
  it('rejects nonexistent and ambiguous daylight-saving times', () => {
    expect(() => bookingDateTimeInstant('2026-03-08', '02:30', 'America/New_York')).toThrow();
    expect(() => bookingDateTimeInstant('2026-11-01', '01:30', 'America/New_York')).toThrow();
  });
});
