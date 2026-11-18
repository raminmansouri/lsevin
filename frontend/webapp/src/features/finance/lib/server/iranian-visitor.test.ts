import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
  session: vi.fn(),
  userId: vi.fn(),
  phoneCountry: vi.fn(),
  getLocale: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cacheLife: vi.fn(), unstable_cacheTag: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => mocks.headers.get(name.toLowerCase()) ?? null }),
  cookies: async () => ({ get: (name: string) => (mocks.cookies.has(name) ? { value: mocks.cookies.get(name) } : undefined) }),
}));
vi.mock("next-intl/server", () => ({ getLocale: mocks.getLocale }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.session }));
vi.mock("@/features/booking-pro/utils/auth", () => ({ resolveCurrentUserId: mocks.userId }));
vi.mock("./currency-queries", () => ({ getUserPhoneCountryCode: mocks.phoneCountry }));

import { resolveIsIranianVisitor } from "./iranian-visitor";

function guest() {
  mocks.userId.mockResolvedValue(null);
  mocks.session.mockResolvedValue(null);
}
function loggedIn(phoneCountry: string | null) {
  mocks.userId.mockResolvedValue("user-1");
  mocks.session.mockResolvedValue({ user: { id: "user-1", phoneNumberCountryCode: phoneCountry } });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.clear();
  mocks.cookies.clear();
  mocks.getLocale.mockResolvedValue("fa"); // next-intl default when no locale is known
  vi.stubGlobal("fetch", mocks.fetch);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("guest (not logged in): site language decides", () => {
  it.each([
    ["fa", true],
    ["en", false],
    ["ar", false],
    ["tr", false],
  ])("page locale %s -> Iranian %s", async (locale, expected) => {
    guest();
    mocks.headers.set("x-next-intl-locale", locale);
    expect(await resolveIsIranianVisitor()).toBe(expected);
  });

  it("ignores IP geolocation for guests", async () => {
    guest();
    mocks.headers.set("x-next-intl-locale", "en");
    mocks.headers.set("x-forwarded-for", "5.160.0.1");
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ country_code: "IR" }) });
    expect(await resolveIsIranianVisitor()).toBe(false);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("API routes (no middleware locale) use the Referer page locale, not the fa default", async () => {
    guest();
    mocks.headers.set("referer", "https://lsevin.com/en/services/some-clinic");
    expect(await resolveIsIranianVisitor()).toBe(false);
    mocks.headers.set("referer", "https://lsevin.com/fa/services/some-clinic");
    expect(await resolveIsIranianVisitor()).toBe(true);
  });

  it("falls back to the NEXT_LOCALE cookie, then the default locale", async () => {
    guest();
    mocks.headers.set("referer", "https://lsevin.com/");
    mocks.cookies.set("NEXT_LOCALE", "de");
    expect(await resolveIsIranianVisitor()).toBe(false);
    mocks.cookies.clear();
    expect(await resolveIsIranianVisitor()).toBe(true);
  });
});

describe("logged-in customer: phone decides (unchanged)", () => {
  it("Iranian phone on an English page is Iranian", async () => {
    loggedIn("IR");
    mocks.headers.set("x-next-intl-locale", "en");
    expect(await resolveIsIranianVisitor()).toBe(true);
  });

  it("foreign phone on the Persian page is not Iranian", async () => {
    loggedIn("DE");
    mocks.headers.set("x-next-intl-locale", "fa");
    expect(await resolveIsIranianVisitor()).toBe(false);
  });

  it("legacy dial code 98 is Iranian", async () => {
    loggedIn("+98");
    expect(await resolveIsIranianVisitor()).toBe(true);
  });

  it("no phone country still falls through to IP geolocation", async () => {
    loggedIn(null);
    mocks.phoneCountry.mockResolvedValue(null);
    mocks.headers.set("x-next-intl-locale", "fa");
    mocks.headers.set("x-forwarded-for", "8.8.8.8");
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ country_code: "US" }) });
    expect(await resolveIsIranianVisitor()).toBe(false);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
