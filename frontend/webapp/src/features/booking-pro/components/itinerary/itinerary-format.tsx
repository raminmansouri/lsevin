'use client';
import { BedDouble, BookOpenCheck, BriefcaseMedical, Car, Dumbbell, FlaskConical, HeartPulse, Hospital, Hotel, Languages, Layers3, Map as MapIcon, Pill, Plane, Sparkles, Stethoscope, Waves, type LucideIcon } from 'lucide-react';
import { calendarIdentifier, type BookingCalendar } from '../../lib/calendar';

/** Day chips and headings: weekday, day number and month in the customer's chosen calendar. */
export function dayParts(iso: string, locale: string, calendar: BookingCalendar) {
  const date = new Date(`${iso}T12:00:00Z`);
  const options = { calendar: calendarIdentifier(calendar), timeZone: 'UTC' } as const;
  return {
    weekday: new Intl.DateTimeFormat(locale, { ...options, weekday: 'long' }).format(date),
    day: new Intl.DateTimeFormat(locale, { ...options, day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat(locale, { ...options, month: 'long' }).format(date),
    short: new Intl.DateTimeFormat(locale, { ...options, day: 'numeric', month: 'short' }).format(date),
    long: new Intl.DateTimeFormat(locale, { ...options, weekday: 'long', day: 'numeric', month: 'long' }).format(date),
  };
}

/** Minutes after midnight as a provider-local wall-clock time, in the locale's digits. */
export function formatClock(minutes: number, locale: string) {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, 0, 1, Math.floor(bounded / 60), bounded % 60)));
}

/**
 * Admins pick an icon per add-on link (and per provider type) by its lucide name. Only a fixed
 * set is mapped -- importing lucide's whole registry would ship every icon to the client.
 */
const ICONS: Record<string, LucideIcon> = {
  hotel: Hotel, bed: BedDouble, beddouble: BedDouble,
  car: Car, plane: Plane, transfer: Car,
  languages: Languages, translator: Languages,
  map: MapIcon, tour: MapIcon,
  waves: Waves, dumbbell: Dumbbell, heartpulse: HeartPulse, sparkles: Sparkles,
  stethoscope: Stethoscope, hospital: Hospital, briefcasemedical: BriefcaseMedical,
  flaskconical: FlaskConical, pill: Pill, bookopencheck: BookOpenCheck,
};

export function addonIcon(name?: string | null): LucideIcon {
  const key = String(name ?? '').replace(/[^a-z]/gi, '').toLowerCase();
  return ICONS[key] ?? Layers3;
}

/** One soft tint per add-on type, stable across renders (by its position in the admin order). */
const TINTS = [
  'bg-sky-100 text-sky-900',
  'bg-amber-100 text-amber-900',
  'bg-teal-100 text-teal-900',
  'bg-rose-100 text-rose-900',
  'bg-violet-100 text-violet-900',
  'bg-lime-100 text-lime-900',
];
export function tintFor(index: number) {
  return TINTS[((index % TINTS.length) + TINTS.length) % TINTS.length];
}
