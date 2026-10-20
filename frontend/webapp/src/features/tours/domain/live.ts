/**
 * Live-trip and weather freshness rules (C-063..C-073, AT-05, AT-19, AT-20).
 * Pure functions: the UI never decides on its own whether data is "live".
 */

export type TrackingState =
  | { kind: "not_started" }
  | { kind: "live"; lastAt: string; ageSeconds: number }
  | { kind: "stale"; lastAt: string; ageSeconds: number }
  | { kind: "no_signal"; startedAt: string }
  | { kind: "ended"; endedAt: string };

export function trackingState(opts: {
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  lastPointAt: string | null;
  now: Date;
  staleSeconds: number;
}): TrackingState {
  if (opts.sessionEndedAt) return { kind: "ended", endedAt: opts.sessionEndedAt };
  if (!opts.sessionStartedAt) return { kind: "not_started" };
  if (!opts.lastPointAt) return { kind: "no_signal", startedAt: opts.sessionStartedAt };
  const ageSeconds = Math.max(0, Math.round((opts.now.getTime() - new Date(opts.lastPointAt).getTime()) / 1000));
  return ageSeconds <= opts.staleSeconds
    ? { kind: "live", lastAt: opts.lastPointAt, ageSeconds }
    : { kind: "stale", lastAt: opts.lastPointAt, ageSeconds };
}

export type IncomingPoint = { seq: number; recordedAt: string; latitude: number; longitude: number; accuracyM?: number | null };

/**
 * Accepts only points newer than the last accepted one (by seq and by device
 * time) and not from the future. A device reconnecting after an outage must not
 * replay an old position as if it were current (AT-20 "no ghost positions").
 */
export function acceptablePoints(points: IncomingPoint[], last: { seq: number; recordedAt: string | null }, now: Date, maxFutureSkewSeconds = 60): IncomingPoint[] {
  const sorted = [...points].sort((a, b) => a.seq - b.seq);
  const out: IncomingPoint[] = [];
  let seq = last.seq;
  let at = last.recordedAt ? new Date(last.recordedAt).getTime() : -Infinity;
  for (const p of sorted) {
    const t = new Date(p.recordedAt).getTime();
    if (!Number.isFinite(t)) continue;
    if (p.seq <= seq || t <= at) continue;
    if (t - now.getTime() > maxFutureSkewSeconds * 1000) continue;
    if (!(p.latitude >= -90 && p.latitude <= 90 && p.longitude >= -180 && p.longitude <= 180)) continue;
    out.push(p);
    seq = p.seq;
    at = t;
  }
  return out;
}

export type WeatherMode =
  | { kind: "current" } // departure is today/ongoing: current conditions are meaningful
  | { kind: "forecast"; daysAhead: number } // inside provider's horizon: show that day's forecast
  | { kind: "climate"; daysAhead: number } // beyond horizon: only long-term expectations, labelled as such
  | { kind: "past" };

export function weatherModeFor(departureLocalIso: string, todayLocalIso: string, horizonDays: number): WeatherMode {
  const d = Date.parse(`${departureLocalIso}T00:00:00Z`);
  const t = Date.parse(`${todayLocalIso}T00:00:00Z`);
  const days = Math.round((d - t) / 86_400_000);
  if (days < 0) return { kind: "past" };
  if (days === 0) return { kind: "current" };
  if (days < horizonDays) return { kind: "forecast", daysAhead: days };
  return { kind: "climate", daysAhead: days };
}

export function weatherFreshness(fetchedAt: string, now: Date, ttlMinutes: number): "fresh" | "stale" {
  return now.getTime() - new Date(fetchedAt).getTime() <= ttlMinutes * 60_000 ? "fresh" : "stale";
}
