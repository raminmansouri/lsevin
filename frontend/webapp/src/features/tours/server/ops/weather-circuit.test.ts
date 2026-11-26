import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// No weather cache rows; writes are accepted.
vi.mock("@/config/database/db", () => ({ default: async () => [] }));
vi.mock("../platform/settings", () => ({
  getTourSettings: async () => ({ weather: { provider: "open-meteo", currentTtlMinutes: 30, forecastTtlMinutes: 180, forecastHorizonDays: 15 } }),
}));
vi.mock("../platform/errors", () => ({ logUnexpected: () => {} }));

import { getTourWeather, resetWeatherCircuit } from "./weather";

const input = { lat: 26.53, lng: 53.98, departureLocalIso: null, timeZone: "Asia/Tehran", label: "Kish" };

// Site A (Iran) cannot reach api.open-meteo.com; every tour page there waited
// the 10 s timeout (2026-11-26). One failure now pauses the provider.
describe("weather provider circuit", () => {
  beforeEach(() => {
    resetWeatherCircuit();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("an unreachable provider is tried once, then skipped while it cools down", async () => {
    const fetch = vi.fn(async () => {
      throw Object.assign(new Error("connect timeout"), { name: "TimeoutError" });
    });
    vi.stubGlobal("fetch", fetch);

    expect(await getTourWeather(input)).toEqual({ status: "unavailable", reason: "provider_error" });
    const started = Date.now();
    expect(await getTourWeather(input)).toEqual({ status: "unavailable", reason: "provider_error" });
    expect(Date.now() - started).toBeLessThan(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("the request is bounded by a short timeout", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      throw new Error("offline");
    }));
    await getTourWeather(input);
    expect(signal).toBeDefined();
    // AbortSignal.timeout(ms) is not inspectable; it must not fire immediately.
    expect(signal!.aborted).toBe(false);
  });

  it("an HTTP error from a reachable provider does not pause it", async () => {
    const fetch = vi.fn(async () => new Response("busy", { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    await getTourWeather(input);
    await getTourWeather(input);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
