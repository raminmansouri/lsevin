import "server-only";

import db from "@/config/database/db";

import { instantToLocalIso, isIsoDate, isValidTimeZone } from "../../domain/calendar";
import { weatherFreshness, weatherModeFor, type WeatherMode } from "../../domain/live";
import { logUnexpected } from "../platform/errors";
import { getTourSettings } from "../platform/settings";

import type { WeatherView } from "./contract";

/**
 * Weather for a tour or a departure (C-063..C-069, AT-05).
 *
 *   TOURS_WEATHER_PROVIDER = open-meteo (default) | fixture | off
 *
 * Rules:
 *   * values come from the provider or from tour.weather_cache — never invented (C-066);
 *   * on provider failure the cached value is returned marked `stale`, otherwise
 *     `{ status: "unavailable", reason: "provider_error" }`;
 *   * a departure beyond the forecast horizon is shown in `climate` mode and never
 *     carries current conditions presented as a forecast (AT-05).
 *
 * The `fixture` provider is deterministic and offline. A test forces a provider
 * failure for one location by inserting a cache row with key
 * `fixture:fail:<lat3>,<lng3>` (see fixtureFailKey).
 */

type CurrentWx = NonNullable<Extract<WeatherView, { status: "ok" }>["current"]>;
type DailyWx = NonNullable<Extract<WeatherView, { status: "ok" }>["forecast"]>;
type Payload = { current?: CurrentWx | null; forecast?: DailyWx | null };

class ProviderError extends Error {}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
export const fixtureFailKey = (lat: number, lng: number) => `fixture:fail:${r3(lat).toFixed(3)},${r3(lng).toFixed(3)}`;
export const weatherCacheKey = (kind: "current" | "daily", lat: number, lng: number, date: string) =>
  `${kind}:${r3(lat).toFixed(3)},${r3(lng).toFixed(3)}:${kind === "current" ? "now" : date}`;

export function weatherProvider(settingsProvider?: string): "open-meteo" | "fixture" | "off" {
  const raw = (process.env.TOURS_WEATHER_PROVIDER || settingsProvider || "open-meteo").trim().toLowerCase();
  if (raw === "fixture" || raw === "off") return raw;
  return "open-meteo";
}

/** WMO weather interpretation codes → stable condition ids (UI localizes them). */
export function conditionFromWmo(code: number): string {
  if (code === 0) return "clear";
  if (code <= 2) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunderstorm";
  return "unknown";
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function req(v: unknown): number {
  const n = num(v);
  if (n === null) throw new ProviderError("missing_value");
  return n;
}

async function fetchOpenMeteo(lat: number, lng: number, timeZone: string, date: string, withCurrent: boolean): Promise<Payload> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lng), timezone: timeZone, start_date: date, end_date: date,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
  });
  if (withCurrent) params.set("current", "temperature_2m,weather_code,wind_speed_10m,precipitation_probability");
  let res: Response;
  try {
    res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch (e) {
    throw new ProviderError(`network:${(e as Error)?.name ?? "error"}`);
  }
  if (!res.ok) throw new ProviderError(`http_${res.status}`);
  const body = (await res.json().catch(() => null)) as any;
  if (!body?.daily?.time?.length) throw new ProviderError("empty_daily");
  const i = (body.daily.time as string[]).indexOf(date);
  if (i < 0) throw new ProviderError("date_not_in_response");
  const forecast: DailyWx = {
    date,
    minC: req(body.daily.temperature_2m_min?.[i]),
    maxC: req(body.daily.temperature_2m_max?.[i]),
    condition: conditionFromWmo(req(body.daily.weather_code?.[i])),
    precipitationProbability: num(body.daily.precipitation_probability_max?.[i]),
    windKph: num(body.daily.wind_speed_10m_max?.[i]),
  };
  let current: CurrentWx | null = null;
  if (withCurrent) {
    const c = body.current;
    if (!c) throw new ProviderError("missing_current");
    current = {
      temperatureC: req(c.temperature_2m),
      condition: conditionFromWmo(req(c.weather_code)),
      precipitationProbability: num(c.precipitation_probability),
      windKph: num(c.wind_speed_10m),
      // Open-Meteo returns local time without offset; keep the fetch instant as the observation time.
      observedAt: new Date().toISOString(),
    };
  }
  return { current, forecast };
}

async function fetchFixture(lat: number, lng: number, date: string, withCurrent: boolean): Promise<Payload> {
  const [forced] = await db`select 1 from tour.weather_cache where cache_key = ${fixtureFailKey(lat, lng)}`;
  if (forced) throw new ProviderError("fixture_forced_failure");
  // Deterministic, plausible values derived from the inputs (tests assert on them).
  const seed = Math.abs(Math.round(lat * 100) + Math.round(lng * 100) + Number(date.replace(/-/g, "")) % 97);
  const base = 10 + (seed % 20);
  const forecast: DailyWx = { date, minC: base - 5, maxC: base + 5, condition: ["clear", "partly_cloudy", "cloudy", "rain"][seed % 4], precipitationProbability: (seed * 7) % 100, windKph: 5 + (seed % 25) };
  const current: CurrentWx | null = withCurrent
    ? { temperatureC: base, condition: forecast.condition, precipitationProbability: forecast.precipitationProbability, windKph: forecast.windKph, observedAt: new Date().toISOString() }
    : null;
  return { current, forecast };
}

type CacheRow = { payload: Payload; source: string; fetched_at: Date; expires_at: Date };

async function readCache(key: string): Promise<CacheRow | null> {
  const [row] = await db<CacheRow[]>`select payload, source, fetched_at, expires_at from tour.weather_cache where cache_key = ${key}`;
  return row ?? null;
}

async function writeCache(key: string, kind: "current" | "daily", lat: number, lng: number, date: string, payload: Payload, source: string, ttlMinutes: number) {
  await db`
    insert into tour.weather_cache (cache_key, kind, latitude, longitude, target_date, payload, source, fetched_at, expires_at)
    values (${key}, ${kind}, ${r3(lat)}, ${r3(lng)}, ${date}::date, ${db.json(payload as never)}, ${source}, now(), now() + make_interval(mins => ${ttlMinutes}))
    on conflict (cache_key) do update
      set payload = excluded.payload, source = excluded.source, fetched_at = excluded.fetched_at,
          expires_at = excluded.expires_at, target_date = excluded.target_date`;
}

export async function getTourWeather(input: { lat: number; lng: number; departureLocalIso: string | null; timeZone: string; label?: string | null }): Promise<WeatherView> {
  const settings = await getTourSettings();
  const provider = weatherProvider(settings.weather?.provider);
  if (provider === "off") return { status: "unavailable", reason: "disabled" };
  const { lat, lng } = input;
  if (!(Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) {
    return { status: "unavailable", reason: "no_location" };
  }
  const timeZone = isValidTimeZone(input.timeZone) ? input.timeZone : "UTC";
  const now = new Date();
  const today = instantToLocalIso(now, timeZone);
  const target = input.departureLocalIso && isIsoDate(input.departureLocalIso) ? input.departureLocalIso : today;
  const horizon = Number(settings.weather?.forecastHorizonDays ?? 15);
  const mode: WeatherMode = weatherModeFor(target, today, horizon);
  const attribution = provider === "fixture" ? "Fixture weather (test data)" : String(settings.weather?.attribution ?? "Weather data by Open-Meteo.com");
  const location = { lat, lng, label: input.label ?? null };
  const base = { status: "ok" as const, mode, source: provider, attribution, location };

  if (mode.kind === "past") {
    return { ...base, fetchedAt: now.toISOString(), freshness: "fresh", current: null, forecast: null, climate: null };
  }
  if (mode.kind === "climate") {
    // Beyond the provider horizon there is no forecast; we do not hold
    // climate normals either, so no numbers are shown — only the month and
    // the explanation (C-066: never invent values).
    const month = Number(target.slice(5, 7));
    return { ...base, fetchedAt: now.toISOString(), freshness: "fresh", current: null, forecast: null,
      climate: { month, avgMinC: null, avgMaxC: null, note: "beyond_forecast_horizon" } };
  }

  const withCurrent = mode.kind === "current";
  const kind = withCurrent ? "current" : "daily";
  const ttl = Number(withCurrent ? settings.weather?.currentTtlMinutes ?? 30 : settings.weather?.forecastTtlMinutes ?? 180);
  const key = weatherCacheKey(kind, lat, lng, target);
  const cached = await readCache(key).catch((e) => { logUnexpected("weather.readCache", e); return null; });

  const view = (row: { payload: Payload; source: string; fetched_at: Date | string }, forceStale = false): WeatherView => {
    const fetchedAt = new Date(row.fetched_at).toISOString();
    return {
      ...base, source: row.source, fetchedAt,
      freshness: forceStale ? "stale" : weatherFreshness(fetchedAt, now, ttl),
      current: withCurrent ? row.payload.current ?? null : null,
      forecast: row.payload.forecast && row.payload.forecast.date === target ? row.payload.forecast : null,
      climate: null,
    };
  };

  // A current-conditions cache row is per location, not per day: reuse it only for the same local day.
  const cachedUsable = cached && (!withCurrent || cached.payload.forecast?.date === target) ? cached : null;
  if (cachedUsable && new Date(cachedUsable.expires_at).getTime() > now.getTime()) return view(cachedUsable);

  try {
    const payload = provider === "fixture"
      ? await fetchFixture(lat, lng, target, withCurrent)
      : await fetchOpenMeteo(lat, lng, timeZone, target, withCurrent);
    await writeCache(key, kind, lat, lng, target, payload, provider, ttl).catch((e) => logUnexpected("weather.writeCache", e));
    return view({ payload, source: provider, fetched_at: now });
  } catch (e) {
    if (!(e instanceof ProviderError)) logUnexpected("weather.fetch", e);
    else console.warn("[tours] weather provider failed", { provider, reason: e.message });
    if (cachedUsable) return view(cachedUsable, true);
    return { status: "unavailable", reason: "provider_error" };
  }
}
