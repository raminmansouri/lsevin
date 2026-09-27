import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ sql: vi.fn(), context: vi.fn(), currency: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/config/database/db", () => ({ default: mocks.sql }));
vi.mock("@/features/shop/lib/db", () => ({ sql: mocks.sql }));
vi.mock("@/features/shop/lib/context", () => ({ getShopContext: mocks.context, normalizeLocale: (s: string) => s }));
vi.mock("@/features/shop/lib/pricing", () => ({ resolveDisplayCurrency: mocks.currency, resolvePrices: vi.fn(), resolvePrice: vi.fn() }));
vi.mock("@/features/finance/lib/server/currency-queries", () => ({ convertMoney: vi.fn(), resolvePreferredCurrencyCode: vi.fn() }));
vi.mock("@/features/finance/lib/server/iranian-visitor", () => ({ resolveIsIranianVisitor: vi.fn() }));
vi.mock("@/features/finance/lib/server/toman-price", () => ({ resolveDisplayPrice: vi.fn() }));
import { getProductBySlug } from "@/features/shop/api/catalog.repository";
import { getProviderPageDataFromDb } from "@/features/service-providers/server/provider-page.repository";
beforeEach(() => { vi.resetAllMocks(); });
const id = "12345678-1234-1234-1234-123456789abc";
it("invalid provider id does not query the database", async () => {
  expect((await getProviderPageDataFromDb({providerId: "bad"})).error?.status).toBe(400);
  expect(mocks.sql).not.toHaveBeenCalled();
});
it("missing/inactive provider result is 404 and the query filters inactive rows", async () => {
  mocks.sql.mockResolvedValue([]);
  expect((await getProviderPageDataFromDb({providerId: id})).error?.status).toBe(404);
  expect(mocks.sql.mock.calls[0][0].join("?")).toContain("sp.is_active = true");
});
it("provider database failure is distinct from absence", async () => {
  mocks.sql.mockRejectedValue(new Error("unavailable"));
  expect((await getProviderPageDataFromDb({providerId: id})).error?.status).toBe(500);
});
it.each(["fa", "en", "ar"])("cached no-FX %s product lookup never reads visitor context", async locale => {
  mocks.sql.mockResolvedValue([]);
  expect(await getProductBySlug("missing", locale, {noFx: true, skipWishlist: true})).toBeNull();
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.currency).not.toHaveBeenCalled();
  const query = mocks.sql.mock.calls[0][0].join("?");
  expect(query).toContain("p.deleted_at is null");
  expect(query).toContain("p.status = 'active'");
});
it("product database failure rejects instead of returning null", async () => {
  const outage = new Error("unavailable"); mocks.sql.mockRejectedValue(outage);
  await expect(getProductBySlug("fixture", "en", {noFx: true, skipWishlist: true})).rejects.toBe(outage);
});
