import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateShipping, FREE_SHIPPING_THRESHOLD_RIAL } from "../lib/calculations";
import { freeShippingThreshold, getDeliveryOptions } from "./checkout.repository";

/**
 * Free shipping from 3,000,000 toman (30,000,000 rial) of shipped items. The checkout compares
 * the shipped subtotal in the customer's display currency, so the rial threshold is converted
 * first; with no usable rate there is no free shipping rather than a wrong threshold.
 */

const state = vi.hoisted(() => ({
  methods: [] as Array<Record<string, unknown>>,
  // display currency -> rial-to-display factor, or "fallback" when finance has no rate
  rates: {} as Record<string, number | "fallback">,
}));
vi.mock("@/config/database/db", () => ({ default: async () => state.methods }));
vi.mock("@/payment/server/payment-gateway.repository", () => ({ listEnabledPaymentGatewayOptions: async () => [] }));
vi.mock("../lib/context", () => ({ getShopContext: vi.fn(), normalizeLocale: vi.fn() }));
vi.mock("../lib/pricing", () => ({
  resolveDisplayCurrency: vi.fn(),
  lockPayableQuote: vi.fn(),
  resolvePrice: async (input: { amount: number; sourceCurrency: string; displayCurrency: string }) => {
    const rate = input.displayCurrency === input.sourceCurrency ? 1 : state.rates[input.displayCurrency];
    const fellBack = rate === "fallback" || rate === undefined;
    return {
      price: fellBack
        ? { amount: input.amount, currency: input.sourceCurrency, unavailable: false, fellBackToSource: true }
        : { amount: input.amount * (rate as number), currency: input.displayCurrency, unavailable: false },
      compareAtPrice: null,
    };
  },
}));
vi.mock("./cart.repository", () => ({ getCartView: vi.fn() }));
vi.mock("../lib/analytics", () => ({ emitCommerceEvent: vi.fn() }));
vi.mock("../server/shop-notifications", () => ({ notifyShopOrderEvent: vi.fn() }));

beforeEach(() => {
  state.methods = [{ id: "post", code: "post", name: "Post", description: "", baseFee: 1_500_000, etaMin: 2, etaMax: 4, rules: {} }];
  state.rates = { IRT: 0.1, USD: "fallback" };
});

describe("free shipping threshold", () => {
  it("is 3,000,000 toman = 30,000,000 rial", () => {
    expect(FREE_SHIPPING_THRESHOLD_RIAL).toBe(30_000_000);
  });

  it("calculateShipping: free at or above the threshold, the fee below it, never free without a threshold", () => {
    expect(calculateShipping(29_999_999, 1_500_000, 30_000_000)).toEqual({ amount: 1_500_000, label: "standard" });
    expect(calculateShipping(30_000_000, 1_500_000, 30_000_000)).toEqual({ amount: 0, label: "free" });
    expect(calculateShipping(90_000_000, 1_500_000, 30_000_000)).toEqual({ amount: 0, label: "free" });
    expect(calculateShipping(90_000_000, 1_500_000, null)).toEqual({ amount: 1_500_000, label: "standard" });
    // The old default (75) no longer applies to rial orders.
    expect(calculateShipping(100, 1_500_000, 30_000_000).label).toBe("standard");
  });

  it("is converted to the display currency: 30,000,000 in rial, 3,000,000 in toman", async () => {
    expect(await freeShippingThreshold("IRR")).toBe(30_000_000);
    expect(await freeShippingThreshold("IRT")).toBe(3_000_000);
  });

  it("without a usable rate there is no free shipping (never the rial number compared to dollars)", async () => {
    expect(await freeShippingThreshold("USD")).toBeNull();
    const [option] = await getDeliveryOptions("USD", "en", 50_000_000, {});
    expect(option.fee).toBe(1_500_000);
  });

  it("delivery options: a 2,500,000-toman rial cart pays shipping, a 3,000,000-toman one does not", async () => {
    expect((await getDeliveryOptions("IRR", "fa", 25_000_000, {}))[0].fee).toBe(1_500_000);
    expect((await getDeliveryOptions("IRR", "fa", 30_000_000, {}))[0].fee).toBe(0);
    expect((await getDeliveryOptions("IRT", "fa", 2_999_999, {}))[0].fee).toBe(1_500_000);
    expect((await getDeliveryOptions("IRT", "fa", 3_000_000, {}))[0].fee).toBe(0);
  });

  it("the Lsevin office pickup option is always offered, with no fee and no transit, whatever the address", async () => {
    state.methods = [
      { id: "post", code: "post", name: "Post", description: "", baseFee: 1_500_000, etaMin: 2, etaMax: 4, isPickup: false,
        rules: { geo: { includeCountries: ["IR"] } } },
      { id: "office", code: "lsevin_office_pickup", name: "Office", description: "", baseFee: 999, etaMin: 9, etaMax: 9, isPickup: true,
        rules: { geo: { includeCountries: ["XX"] } }, officeAddress: "Tehran", officePhone: "021", officeHours: "9-17" },
    ];
    const abroad = await getDeliveryOptions("IRR", "fa", 1_000, { country: "DE" });
    expect(abroad.map((o) => o.id)).toEqual(["office"]);
    expect(abroad[0]).toMatchObject({ fee: 0, etaMinDays: 0, etaMaxDays: 0, isPickup: true, office: { address: "Tehran", phone: "021", hours: "9-17" } });
    const home = await getDeliveryOptions("IRR", "fa", 1_000, { country: "IR" });
    expect(home.map((o) => [o.id, o.isPickup, o.fee])).toEqual([["post", false, 1_500_000], ["office", true, 0]]);
  });
});
