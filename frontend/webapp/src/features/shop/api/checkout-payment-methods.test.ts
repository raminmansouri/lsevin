import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPaymentMethods } from "./checkout.repository";

const state = vi.hoisted(() => ({ rows: [] as any[], gateways: [] as any[] }));
vi.mock("@/config/database/db", () => ({ default: async () => state.rows }));
vi.mock("@/payment/server/payment-gateway.repository", () => ({
  listEnabledPaymentGatewayOptions: async () => state.gateways,
}));
vi.mock("../lib/context", () => ({
  getShopContext: vi.fn(),
  normalizeLocale: vi.fn(),
}));
vi.mock("../lib/pricing", () => ({
  resolveDisplayCurrency: vi.fn(),
  lockPayableQuote: vi.fn(),
}));
vi.mock("./cart.repository", () => ({ getCartView: vi.fn() }));
vi.mock("../lib/analytics", () => ({ emitCommerceEvent: vi.fn() }));
vi.mock("../server/shop-notifications", () => ({
  notifyShopOrderEvent: vi.fn(),
}));

beforeEach(() => {
  state.rows = [
    { id: "manual", code: "bank_transfer", provider: "manual" },
    { id: "card", code: "gateway_card", provider: "online" },
    { id: "wallet", code: "wallet", provider: "internal_wallet" },
  ];
  state.gateways = [
    { code: "zarinpal", currency: "IRT" },
    { code: "btcpay", currency: "USD" },
  ];
});

describe("shop checkout offers supported, configured payment methods", () => {
  it("uses the configured gateway currency rather than the display currency", async () => {
    const methods = await getPaymentMethods("fa", "IRR");
    expect(methods[0]).toMatchObject({ id: "card", currency: "IRT" });
    expect(methods.some((method) => method.code === "wallet")).toBe(false);
  });
  it("routes international generic card methods to their configured gateway", async () => {
    expect((await getPaymentMethods("en", "EUR"))[0].currency).toBe("USD");
  });
  it("does not offer a disabled gateway", async () => {
    state.gateways = [];
    expect(
      (await getPaymentMethods("fa", "IRR")).map((method) => method.code)
    ).toEqual(["bank_transfer"]);
  });
  it("preserves explicitly configured gateway methods", async () => {
    state.rows = [{ id: "z", code: "zarinpal", provider: "zarinpal" }];
    expect((await getPaymentMethods("fa", "IRR"))[0]).toMatchObject({
      id: "z",
      currency: "IRT",
    });
  });
});
