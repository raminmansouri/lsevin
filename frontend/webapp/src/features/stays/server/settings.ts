import "server-only";

import db from "@/config/database/db";

export type StaySettings = {
  holdMinutes: number;
  paymentWindowMinutes: number;
  requestTimeoutHours: number;
  serviceFeePercent: number;
  maxNights: number;
  maxRooms: number;
  bookingWindowDays: number;
  enabledLocales: string[];
};

export const STAY_SETTING_DEFAULTS: StaySettings = {
  holdMinutes: 15,
  paymentWindowMinutes: 30,
  requestTimeoutHours: 24,
  serviceFeePercent: 0,
  maxNights: 30,
  maxRooms: 5,
  bookingWindowDays: 365,
  enabledLocales: ["fa-IR", "en-US", "ar-SA"],
};

export const STAY_SETTING_KEYS: Record<string, keyof StaySettings> = {
  hold_minutes: "holdMinutes",
  payment_window_minutes: "paymentWindowMinutes",
  request_timeout_hours: "requestTimeoutHours",
  service_fee_percent: "serviceFeePercent",
  max_nights: "maxNights",
  max_rooms: "maxRooms",
  booking_window_days: "bookingWindowDays",
  enabled_locales: "enabledLocales",
};

let cache: { at: number; value: StaySettings } | null = null;

/** Settings change rarely; a 30 s cache keeps them off every request. */
export async function getStaySettings(opts: { fresh?: boolean } = {}): Promise<StaySettings> {
  if (!opts.fresh && cache && Date.now() - cache.at < 30_000) return cache.value;
  const rows = await db<{ key: string; value: unknown }[]>`select key, value from stay.settings`;
  const value: StaySettings = { ...STAY_SETTING_DEFAULTS };
  for (const r of rows) {
    const k = STAY_SETTING_KEYS[r.key];
    if (k) (value as Record<string, unknown>)[k] = r.value;
  }
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateStaySettings() {
  cache = null;
}

export async function getBookingDefinitionId(): Promise<string | null> {
  const [r] = await db<{ v: string | null }[]>`select value #>> '{}' as v from stay.settings where key = 'booking_service_definition_id'`;
  return r?.v ?? null;
}

let staysCategoryCache: { at: number; value: string | null } | null = null;

/**
 * The provider category whose cards open the stays app instead of a provider
 * list (stay.settings `accommodation_category_id`, set by migration 0113 from
 * the "accommodation" root) — the stays counterpart of tour.settings
 * `tourism_category_id`. Cached for 5 minutes; null when unset.
 */
export async function getStaysCategoryId(): Promise<string | null> {
  if (staysCategoryCache && Date.now() - staysCategoryCache.at < 300_000) return staysCategoryCache.value;
  const [r] = await db<{ v: string | null }[]>`select value #>> '{}' as v from stay.settings where key = 'accommodation_category_id'`;
  staysCategoryCache = { at: Date.now(), value: r?.v ?? null };
  return staysCategoryCache.value;
}
