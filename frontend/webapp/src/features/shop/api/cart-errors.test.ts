import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCartView } from "./cart.repository";

const state = vi.hoisted(() => ({
  context: { customerId: null as string | null, guestToken: "", locale: "fa" },
  sql: vi.fn(),
}));
vi.mock("@/config/database/db", () => ({ default: state.sql }));
vi.mock("../lib/context", () => ({
  getShopContext: async () => state.context,
  normalizeLocale: () => "fa",
}));
vi.mock("../lib/pricing", () => ({
  resolveDisplayCurrency: async () => ({
    currency: "IRR",
    mode: "market",
    selectable: [],
  }),
  resolvePrices: vi.fn(),
}));

beforeEach(() => {
  state.context.customerId = null;
  state.sql.mockReset();
});
describe("cart read failure handling", () => {
  it("returns an empty cart only for an anonymous visitor without a cart token", async () => {
    expect(await getCartView()).toMatchObject({ id: "", items: [] });
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("propagates database failures instead of pretending that the cart is empty", async () => {
    state.context.customerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const failure = new Error("database unavailable");
    state.sql.mockRejectedValue(failure);
    await expect(getCartView()).rejects.toBe(failure);
  });
});
