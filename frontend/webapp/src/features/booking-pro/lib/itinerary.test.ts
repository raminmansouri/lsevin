import { describe, expect, it } from 'vitest';
import type { ChildBookingDraft } from '../types';
import {
  MAIN_EVENT_ID,
  MAX_TRIP_DAYS,
  childLineAmount,
  childTimedEvent,
  clockToMinutes,
  findConflicts,
  firstClash,
  mainTimedEvent,
  minutesToClock,
  stayForNight,
  stayNights,
  tripDays,
} from './itinerary';

const slot = (over: Partial<ChildBookingDraft>): ChildBookingDraft => ({
  providerTypeId: 'type', bookingUiMode: 'default_slot', requiresSpecialist: false, ...over,
});
const stay = (from: string, to: string, over: Partial<ChildBookingDraft> = {}): ChildBookingDraft => ({
  providerTypeId: 'hotel', bookingUiMode: 'date_range', requiresSpecialist: false, selectedDateFrom: from, selectedDateTo: to, ...over,
});

describe('clock helpers', () => {
  it('parses HH:MM and HH:MM:SS and rejects garbage', () => {
    expect(clockToMinutes('07:30')).toBe(450);
    expect(clockToMinutes('15:00:00')).toBe(900);
    expect(clockToMinutes('24:00')).toBeNull();
    expect(clockToMinutes('7:30')).toBeNull();
    expect(clockToMinutes(undefined)).toBeNull();
  });
  it('formats minutes and clamps to the same day', () => {
    expect(minutesToClock(450)).toBe('07:30');
    expect(minutesToClock(25 * 60)).toBe('23:59');
  });
});

describe('stays and amounts', () => {
  it('counts nights like the server (never below one)', () => {
    expect(stayNights('2026-11-03', '2026-11-07')).toBe(4);
    expect(stayNights('2026-11-03', '2026-11-03')).toBe(1);
    expect(stayNights(undefined, '2026-11-03')).toBe(1);
  });
  it('prices a stay per night and a slot once', () => {
    expect(childLineAmount(stay('2026-11-03', '2026-11-07', { subtotalAmount: 100 }))).toBe(400);
    expect(childLineAmount(slot({ subtotalAmount: 70, adults: 3 }))).toBe(70);
    expect(childLineAmount(slot({}))).toBe(0);
  });
  it('finds the stay for a night: check-in night yes, check-out night no', () => {
    const hotel = stay('2026-11-03', '2026-11-05');
    expect(stayForNight([hotel], '2026-11-03')).toBe(hotel);
    expect(stayForNight([hotel], '2026-11-04')).toBe(hotel);
    expect(stayForNight([hotel], '2026-11-05')).toBeUndefined();
  });
});

describe('timed events and conflicts', () => {
  it('builds events, defaulting a missing end to one hour', () => {
    expect(childTimedEvent(slot({ selectedDate: '2026-11-05', selectedTimeFrom: '10:00' }), 'a')).toEqual({ id: 'a', date: '2026-11-05', start: 600, end: 660 });
    expect(childTimedEvent(slot({ selectedDate: '2026-11-05' }), 'a')).toBeNull();
    expect(childTimedEvent(stay('2026-11-03', '2026-11-05'), 'h')).toBeNull();
  });
  it('uses the main service duration when the main slot has no end', () => {
    expect(mainTimedEvent({ bookingUiMode: 'default_slot', selectedDate: '2026-11-04', selectedTimeFrom: '08:00' }, 240)).toEqual({ id: MAIN_EVENT_ID, date: '2026-11-04', start: 480, end: 720 });
    expect(mainTimedEvent({ bookingUiMode: 'date_range', selectedDate: '2026-11-04', selectedTimeFrom: '08:00' })).toBeNull();
  });
  it('flags overlaps on the same day only; touching ends do not clash', () => {
    const events = [
      { id: 'care', date: '2026-11-05', start: 600, end: 660 },
      { id: 'pool', date: '2026-11-05', start: 630, end: 750 },
      { id: 'tour', date: '2026-11-05', start: 750, end: 900 },
      { id: 'other-day', date: '2026-11-06', start: 600, end: 660 },
    ];
    expect(findConflicts(events)).toEqual({ care: 'pool', pool: 'care' });
    expect(firstClash(events, '2026-11-05', 540, 610)?.id).toBe('care');
    expect(firstClash(events, '2026-11-05', 540, 610, 'care')).toBeNull();
    expect(firstClash(events, '2026-11-05', 900, 960)).toBeNull();
  });
});

describe('tripDays', () => {
  it('spans the main service and every add-on, stays included', () => {
    const days = tripDays({
      draft: { bookingUiMode: 'default_slot', selectedDate: '2026-11-04' },
      children: [stay('2026-11-03', '2026-11-07'), slot({ selectedDate: '2026-11-05' })],
    });
    expect(days).toEqual(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
  });
  it('includes days the customer opened and falls back to today', () => {
    expect(tripDays({ draft: {}, children: [], today: '2026-11-01' })).toEqual(['2026-11-01']);
    expect(tripDays({ draft: { selectedDate: '2026-11-04' }, children: [], include: ['2026-11-03'] })).toEqual(['2026-11-03', '2026-11-04']);
  });
  it('does not grow another empty day once the opened day gets a booking (regression)', () => {
    // Opened 11-03, then booked a transfer on it: still two days, not three.
    const days = tripDays({ draft: { selectedDate: '2026-11-04' }, children: [slot({ selectedDate: '2026-11-03' })], include: ['2026-11-03'] });
    expect(days).toEqual(['2026-11-03', '2026-11-04']);
  });
  it('ignores unparseable dates and caps the span', () => {
    expect(tripDays({ draft: { selectedDate: 'not-a-date' }, children: [], today: '2026-11-01' })).toEqual(['2026-11-01']);
    const days = tripDays({ draft: { selectedDate: '2026-01-01' }, children: [slot({ selectedDate: '2027-01-01' })] });
    expect(days).toHaveLength(MAX_TRIP_DAYS);
  });
});
