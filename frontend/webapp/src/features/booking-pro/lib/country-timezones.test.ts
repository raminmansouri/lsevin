import { describe, expect, it } from 'vitest';
import { COUNTRY_TIME_ZONES, timeZoneForCountry } from './country-timezones';
import { calendarForCountry, isBookingTimeZone, sameBookingClock } from './calendar';

describe('phone-country time zones', () => {
  it('maps single-zone countries to their zone', () => {
    expect(timeZoneForCountry('IR')).toBe('Asia/Tehran');
    expect(timeZoneForCountry('tr')).toBe('Europe/Istanbul');
    expect(timeZoneForCountry('AE', 'Europe/Berlin')).toBe('Asia/Dubai');
  });
  it('uses the main zone of multi-zone countries unless the browser is inside that country', () => {
    expect(timeZoneForCountry('US')).toBe('America/New_York');
    expect(timeZoneForCountry('US', 'America/Los_Angeles')).toBe('America/Los_Angeles');
    expect(timeZoneForCountry('RU')).toBe('Europe/Moscow');
    expect(timeZoneForCountry('CA', 'Asia/Tehran')).toBe('America/Toronto');
  });
  it('returns null for unknown countries', () => {
    expect(timeZoneForCountry(null)).toBeNull();
    expect(timeZoneForCountry('ZZ')).toBeNull();
  });
  it('lists only zones the runtime understands', () => {
    const unknown = Object.values(COUNTRY_TIME_ZONES).flat().filter(zone => !isBookingTimeZone(zone));
    expect(unknown).toEqual([]);
  });
});

describe('sameBookingClock', () => {
  it('treats aliases and same-offset neighbours as the same clock', () => {
    expect(sameBookingClock('2026-10-29', 'Asia/Istanbul', 'Europe/Istanbul')).toBe(true);
    expect(sameBookingClock('2026-10-29', 'Europe/Berlin', 'Europe/Paris')).toBe(true);
  });
  it('detects real differences, including DST-only ones', () => {
    expect(sameBookingClock('2026-10-29', 'Asia/Tehran', 'Europe/Istanbul')).toBe(false);
    expect(sameBookingClock('2026-07-01', 'Europe/London', 'Africa/Abidjan')).toBe(false);
    expect(sameBookingClock('2026-12-01', 'Europe/London', 'Africa/Abidjan')).toBe(true);
  });
  it('is false for an invalid zone', () => {
    expect(sameBookingClock('2026-10-29', 'Not/AZone', 'UTC')).toBe(false);
  });
});

describe('calendarForCountry', () => {
  it('picks the calendar of the phone country', () => {
    expect(calendarForCountry('IR')).toBe('jalali');
    expect(calendarForCountry('SA')).toBe('hijri');
    expect(calendarForCountry('DE')).toBe('gregorian');
    expect(calendarForCountry(null)).toBeNull();
  });
});
