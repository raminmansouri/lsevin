import { beforeEach, expect, it, vi } from "vitest";

import { getServicePageByIdFromDb } from "@/features/service-providers/server/service-page.repository";

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  convert: vi.fn(),
  currency: vi.fn(),
  phone: vi.fn(),
  countryCurrency: vi.fn(),
}));
vi.mock("@/config/database/db", () => ({ default: mocks.sql }));
vi.mock("@/features/finance/lib/server/currency-queries", () => ({
  convertProviderPrice: mocks.convert,
  resolvePreferredCurrencyCode: mocks.currency,
  getUserPhoneCountryCode: mocks.phone,
  getDefaultCurrencyForCountry: mocks.countryCurrency,
}));
vi.mock("@/features/finance/lib/server/iranian-visitor", () => ({
  resolveIsIranianVisitor: async () => false,
}));
vi.mock("@/features/favorites/server/favorites.repository", () => ({
  getIsFavorite: async () => false,
  resolveFavoritesCustomerId: async () => null,
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sql.mockResolvedValue([]);
  mocks.currency.mockResolvedValue("USD");
  mocks.convert.mockImplementation(async (x) => ({
    sourceAmount: x.amount,
    sourceCurrencyCode: x.sourceCurrencyCode,
    targetAmount: x.amount,
    targetCurrencyCode: x.targetCurrencyCode,
    baseRate: 1,
    appliedRate: 1,
    marginPercent: 0,
    exchangeRateIds: [],
    ratePath: [],
    asOf: "2026-01-01",
    expiresAt: null,
  }));
});
it("converts each headline currency once while preserving current/original prices", async () => {
  mocks.sql.mockResolvedValueOnce([
    {
      provider_service_id: "12345678-1234-1234-1234-123456789abc",
      service_definition_id: "definition",
      provider_id: "provider",
      currency: "USD",
      value: 100,
      service_name: "Fixture",
      provider_name: "Fixture clinic",
    },
  ]);
  const result = await getServicePageByIdFromDb({
    serviceId: "12345678-1234-1234-1234-123456789abc",
    locale: "en",
  });
  expect(result?.service.price).toBe(100);
  expect(result?.service.priceOptions).toEqual(
    result?.service.originalPriceOptions
  );
  const targets = mocks.convert.mock.calls.map(([x]) => x.targetCurrencyCode);
  expect(targets.length).toBeGreaterThan(1);
  expect(new Set(targets).size).toBe(targets.length);
  expect(mocks.phone).not.toHaveBeenCalled();
  expect(mocks.countryCurrency).not.toHaveBeenCalled();
});
it("missing entity avoids conversion work", async () => {
  expect(
    await getServicePageByIdFromDb({
      serviceId: "12345678-1234-1234-1234-123456789abc",
    })
  ).toBeNull();
  expect(mocks.convert).not.toHaveBeenCalled();
});
it("primary database errors are not converted to not-found", async () => {
  const failure = new Error("database unavailable");
  mocks.sql.mockRejectedValue(failure);
  await expect(
    getServicePageByIdFromDb({
      serviceId: "12345678-1234-1234-1234-123456789abc",
    })
  ).rejects.toBe(failure);
});
