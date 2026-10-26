import "server-only";

import db from "@/config/database/db";

export type TourSettings = {
  enabledLocales: string[];
  defaultLocale: string;
  contentFallbackOrder: string[];
  defaultCalendarByLocale: Record<string, string>;
  hijriConvention: { calendar: string; officialOffsets: Record<string, number> };
  requiredPublishLocales: string[];
  holdMinutes: number;
  paymentWindowMinutes: number;
  requestToBookHours: number;
  recentViewsLimit: number;
  recentViewsRetentionDays: number;
  recentSearchesLimit: number;
  trackingRetentionDays: number;
  trackingStaleSeconds: number;
  weather: { provider: string; currentTtlMinutes: number; forecastTtlMinutes: number; forecastHorizonDays: number; attribution: string };
  serviceFeePercent: number;
  platformCommissionPercent: number;
  tourismCategoryId: string | null;
  bookingServiceDefinitionId: string | null;
};

const DEFAULTS: TourSettings = {
  enabledLocales: ["fa-IR", "en-US", "ar-SA", "tr-TR"],
  defaultLocale: "fa-IR",
  contentFallbackOrder: ["source", "en-US", "fa-IR"],
  defaultCalendarByLocale: { fa: "persian", ar: "islamic-umalqura", "*": "gregory" },
  hijriConvention: { calendar: "islamic-umalqura", officialOffsets: {} },
  requiredPublishLocales: ["source"],
  holdMinutes: 15,
  paymentWindowMinutes: 30,
  requestToBookHours: 24,
  recentViewsLimit: 20,
  recentViewsRetentionDays: 180,
  recentSearchesLimit: 10,
  trackingRetentionDays: 30,
  trackingStaleSeconds: 120,
  weather: { provider: "open-meteo", currentTtlMinutes: 30, forecastTtlMinutes: 180, forecastHorizonDays: 15, attribution: "Weather data by Open-Meteo.com" },
  serviceFeePercent: 0,
  platformCommissionPercent: 10,
  tourismCategoryId: null,
  bookingServiceDefinitionId: null,
};

const KEY_MAP: Record<string, keyof TourSettings> = {
  enabled_locales: "enabledLocales",
  default_locale: "defaultLocale",
  content_fallback_order: "contentFallbackOrder",
  default_calendar_by_locale: "defaultCalendarByLocale",
  hijri_convention: "hijriConvention",
  required_publish_locales: "requiredPublishLocales",
  hold_minutes: "holdMinutes",
  payment_window_minutes: "paymentWindowMinutes",
  request_to_book_hours: "requestToBookHours",
  recent_views_limit: "recentViewsLimit",
  recent_views_retention_days: "recentViewsRetentionDays",
  recent_searches_limit: "recentSearchesLimit",
  tracking_retention_days: "trackingRetentionDays",
  tracking_stale_seconds: "trackingStaleSeconds",
  weather: "weather",
  service_fee_percent: "serviceFeePercent",
  platform_commission_percent: "platformCommissionPercent",
  tourism_category_id: "tourismCategoryId",
  booking_service_definition_id: "bookingServiceDefinitionId",
};
export const SETTINGS_DB_KEYS = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k])) as Record<keyof TourSettings, string>;

let cache: { at: number; value: TourSettings } | null = null;
const TTL_MS = 30_000;

export async function getTourSettings(opts: { fresh?: boolean } = {}): Promise<TourSettings> {
  if (!opts.fresh && cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const rows = await db<{ key: string; value: unknown }[]>`select key, value from tour.settings`;
  const value: TourSettings = { ...DEFAULTS };
  for (const row of rows) {
    const prop = KEY_MAP[row.key];
    if (prop) (value as Record<string, unknown>)[prop] = row.value;
  }
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateTourSettings() {
  cache = null;
}
