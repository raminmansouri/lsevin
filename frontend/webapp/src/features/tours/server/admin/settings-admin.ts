import "server-only";

import db from "@/config/database/db";

import { isCalendarId } from "../../domain/calendar";
import { audit } from "../platform/booking";
import { fail, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";
import { getTourSettings, invalidateTourSettings, SETTINGS_DB_KEYS, type TourSettings } from "../platform/settings";

import { assertAdminActor, LOCALE_RE } from "./guard";

/**
 * Tours platform settings (M-025, M-026, M-029, Q-005, Q-011, Q-012).
 *
 * `hijriConvention` is deliberately NOT editable here: the lunar Hijri calendar
 * is Umm al-Qura (CLDR islamic-umalqura) and official moon-sighting offsets are
 * an explicit, reviewed data change — never a toggle (S-055, Q-011).
 */
export const EDITABLE_SETTINGS = [
  "enabledLocales", "defaultLocale", "contentFallbackOrder", "defaultCalendarByLocale", "requiredPublishLocales",
  "holdMinutes", "paymentWindowMinutes", "requestToBookHours", "recentViewsLimit", "recentViewsRetentionDays",
  "recentSearchesLimit", "trackingRetentionDays", "trackingStaleSeconds", "weather", "serviceFeePercent", "platformCommissionPercent",
] as const;
export type EditableSetting = (typeof EDITABLE_SETTINGS)[number];
export type SettingsPatch = Partial<Pick<TourSettings, EditableSetting>>;

const WEATHER_PROVIDERS = ["open-meteo", "fixture", "disabled"];

function err(field: string, code: string, details: Record<string, unknown> = {}): never {
  throw fail.validation("invalid_setting", { field, reason: code, ...details });
}

function intRange(field: string, v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) err(field, "out_of_range", { min, max });
  return n;
}

function numRange(field: string, v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) err(field, "out_of_range", { min, max });
  return Math.round(n * 100) / 100;
}

function localeList(field: string, v: unknown, allowSource: boolean): string[] {
  if (!Array.isArray(v) || v.length === 0) err(field, "empty");
  const seen = new Set<string>();
  for (const raw of v) {
    const s = String(raw).trim();
    if (!(allowSource && s === "source") && !LOCALE_RE.test(s)) err(field, "invalid_locale", { locale: s });
    if (seen.has(s)) err(field, "duplicate", { locale: s });
    seen.add(s);
  }
  if (seen.size > 20) err(field, "too_many");
  return Array.from(seen);
}

/**
 * Validates a patch against the current settings and returns the complete,
 * normalized next state. Pure apart from its input — unit-testable.
 */
export function validateSettings(patch: Record<string, unknown>, current: TourSettings): TourSettings {
  for (const key of Object.keys(patch)) {
    if (key === "hijriConvention") err("hijriConvention", "read_only");
    if (!(EDITABLE_SETTINGS as readonly string[]).includes(key)) err(key, "unknown_setting");
  }
  const next: TourSettings = { ...current };
  const p = patch as Record<EditableSetting, unknown>;

  if ("enabledLocales" in p) next.enabledLocales = localeList("enabledLocales", p.enabledLocales, false);
  if ("defaultLocale" in p) {
    const s = String(p.defaultLocale ?? "").trim();
    if (!LOCALE_RE.test(s)) err("defaultLocale", "invalid_locale");
    next.defaultLocale = s;
  }
  if (!next.enabledLocales.includes(next.defaultLocale)) err("defaultLocale", "not_enabled");

  if ("contentFallbackOrder" in p) next.contentFallbackOrder = localeList("contentFallbackOrder", p.contentFallbackOrder, true);
  for (const loc of next.contentFallbackOrder) {
    if (loc !== "source" && !next.enabledLocales.includes(loc)) err("contentFallbackOrder", "not_enabled", { locale: loc });
  }

  if ("requiredPublishLocales" in p) next.requiredPublishLocales = localeList("requiredPublishLocales", p.requiredPublishLocales, true);
  // M-029: the tour's own source language is always required; required
  // safety/meeting/cancellation text can never be satisfied by an empty fallback.
  if (!next.requiredPublishLocales.includes("source")) err("requiredPublishLocales", "source_required");
  for (const loc of next.requiredPublishLocales) {
    if (loc !== "source" && !next.enabledLocales.includes(loc)) err("requiredPublishLocales", "not_enabled", { locale: loc });
  }

  if ("defaultCalendarByLocale" in p) {
    const v = p.defaultCalendarByLocale;
    if (!v || typeof v !== "object" || Array.isArray(v)) err("defaultCalendarByLocale", "invalid");
    const out: Record<string, string> = {};
    for (const [k, cal] of Object.entries(v as Record<string, unknown>)) {
      const key = k.trim();
      if (key !== "*" && !/^[a-z]{2,3}$/.test(key) && !LOCALE_RE.test(key)) err("defaultCalendarByLocale", "invalid_locale", { locale: key });
      if (!isCalendarId(cal)) err("defaultCalendarByLocale", "invalid_calendar", { locale: key, calendar: cal });
      out[key] = cal as string;
    }
    if (!out["*"]) err("defaultCalendarByLocale", "default_required");
    next.defaultCalendarByLocale = out;
  }

  if ("holdMinutes" in p) next.holdMinutes = intRange("holdMinutes", p.holdMinutes, 1, 120);
  if ("paymentWindowMinutes" in p) next.paymentWindowMinutes = intRange("paymentWindowMinutes", p.paymentWindowMinutes, 5, 1440);
  if (next.paymentWindowMinutes < next.holdMinutes) err("paymentWindowMinutes", "shorter_than_hold");
  if ("requestToBookHours" in p) next.requestToBookHours = intRange("requestToBookHours", p.requestToBookHours, 1, 168);
  if ("recentViewsLimit" in p) next.recentViewsLimit = intRange("recentViewsLimit", p.recentViewsLimit, 1, 100);
  if ("recentViewsRetentionDays" in p) next.recentViewsRetentionDays = intRange("recentViewsRetentionDays", p.recentViewsRetentionDays, 1, 730);
  if ("recentSearchesLimit" in p) next.recentSearchesLimit = intRange("recentSearchesLimit", p.recentSearchesLimit, 1, 50);
  if ("trackingRetentionDays" in p) next.trackingRetentionDays = intRange("trackingRetentionDays", p.trackingRetentionDays, 1, 365);
  if ("trackingStaleSeconds" in p) next.trackingStaleSeconds = intRange("trackingStaleSeconds", p.trackingStaleSeconds, 15, 3600);
  if ("serviceFeePercent" in p) next.serviceFeePercent = numRange("serviceFeePercent", p.serviceFeePercent, 0, 50);
  if ("platformCommissionPercent" in p) next.platformCommissionPercent = numRange("platformCommissionPercent", p.platformCommissionPercent, 0, 100);

  if ("weather" in p) {
    const w = p.weather as Record<string, unknown> | null;
    if (!w || typeof w !== "object" || Array.isArray(w)) err("weather", "invalid");
    const provider = String(w.provider ?? "");
    if (!WEATHER_PROVIDERS.includes(provider)) err("weather", "invalid_provider");
    const attribution = String(w.attribution ?? "").trim();
    if (provider === "open-meteo" && !attribution) err("weather", "attribution_required");
    next.weather = {
      provider,
      currentTtlMinutes: intRange("weather.currentTtlMinutes", w.currentTtlMinutes, 5, 1440),
      forecastTtlMinutes: intRange("weather.forecastTtlMinutes", w.forecastTtlMinutes, 15, 1440),
      forecastHorizonDays: intRange("weather.forecastHorizonDays", w.forecastHorizonDays, 1, 16),
      attribution: attribution.slice(0, 200),
    };
  }
  return next;
}

export async function saveSettings(actor: Actor, patch: Record<string, unknown>) {
  assertAdminActor(actor);
  const current = await getTourSettings({ fresh: true });
  const next = validateSettings(patch, current);
  const changed = EDITABLE_SETTINGS.filter((k) => JSON.stringify(next[k]) !== JSON.stringify(current[k]));
  if (changed.length === 0) return { changed: [] as string[] };
  try {
    await db.begin(async (tx) => {
      for (const key of changed) {
        const dbKey = SETTINGS_DB_KEYS[key];
        await tx`
          insert into tour.settings (key, value, updated_at, updated_by)
          values (${dbKey}, ${db.json(next[key] as never)}, now(), ${actor.userId}::uuid)
          on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
      }
      await audit(tx as unknown as typeof db, actor, null, "settings", null, "settings_updated", {
        changes: Object.fromEntries(changed.map((k) => [k, { from: current[k], to: next[k] }])),
      });
    });
  } catch (e) {
    throw mapDbError(e, "saveSettings");
  }
  invalidateTourSettings();
  return { changed: changed as string[] };
}
