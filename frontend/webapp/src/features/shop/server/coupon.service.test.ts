import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coupon eligibility + discount maths (SHP-CHK-002, SHP-V02-004). The coupon row
 * and any FX conversion are mocked; this asserts Shop's own rules.
 */

const convertMoney = vi.fn();
vi.mock("@/features/finance/lib/server/currency-queries", () => ({
  convertMoney: (...a: unknown[]) => convertMoney(...a),
}));

let couponRow: Record<string, unknown> | null = null;
let usageCount = 0;
let perCustomerCount = 0;
vi.mock("@/config/database/db", () => ({
  default: (strings: TemplateStringsArray) => {
    const text = strings.join(" ");
    if (text.includes("from shop.coupons")) return Promise.resolve(couponRow ? [couponRow] : []);
    if (text.includes("coupon_redemptions") && text.includes("customer_id =")) return Promise.resolve([{ n: perCustomerCount }]);
    if (text.includes("coupon_redemptions")) return Promise.resolve([{ n: usageCount }]);
    return Promise.resolve([]);
  },
}));

import { evaluateCoupon } from "./coupon.service";

beforeEach(() => {
  vi.clearAllMocks();
  couponRow = null;
  usageCount = 0;
  perCustomerCount = 0;
  convertMoney.mockImplementation(async ({ amount }: { amount: number }) => ({ targetAmount: amount, appliedRate: 1 }));
});

function coupon(over: Record<string, unknown> = {}) {
  couponRow = {
    id: "c1",
    code: "TEST",
    coupon_type: "percentage",
    value: 10,
    currency: null,
    is_active: true,
    starts_at: null,
    expires_at: null,
    min_subtotal: 0,
    max_discount_amount: null,
    usage_limit: null,
    usage_per_customer: null,
    stackable: false,
    scope: "cart",
    title: "Test",
    ...over,
  };
}

describe("evaluateCoupon", () => {
  it("rejects unknown code", async () => {
    const r = await evaluateCoupon({ code: "NOPE", subtotal: 100, displayCurrency: "USD", customerId: null });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("not_found");
  });

  it("rejects inactive / expired / not-started", async () => {
    coupon({ is_active: false });
    expect((await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null })).reason).toBe("inactive");
    coupon({ expires_at: new Date(Date.now() - 1000).toISOString() });
    expect((await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null })).reason).toBe("expired");
    coupon({ starts_at: new Date(Date.now() + 100000).toISOString() });
    expect((await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null })).reason).toBe("not_started");
  });

  it("enforces min subtotal", async () => {
    coupon({ min_subtotal: 50 });
    expect((await evaluateCoupon({ code: "TEST", subtotal: 40, displayCurrency: "USD", customerId: null })).reason).toBe("below_min_subtotal");
    expect((await evaluateCoupon({ code: "TEST", subtotal: 60, displayCurrency: "USD", customerId: null })).valid).toBe(true);
  });

  it("percentage discount, capped by max_discount_amount", async () => {
    coupon({ coupon_type: "percentage", value: 20, max_discount_amount: 15 });
    const r = await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null });
    expect(r.discountAmount).toBe(15); // 20% of 100 = 20, capped at 15
  });

  it("fixed discount never exceeds subtotal", async () => {
    coupon({ coupon_type: "fixed", value: 30, currency: "USD" });
    const r = await evaluateCoupon({ code: "TEST", subtotal: 12, displayCurrency: "USD", customerId: null });
    expect(r.discountAmount).toBe(12);
  });

  it("free_shipping sets the flag, zero discount", async () => {
    coupon({ coupon_type: "free_shipping", value: 0 });
    const r = await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null });
    expect(r.valid).toBe(true);
    expect(r.freeShipping).toBe(true);
    expect(r.discountAmount).toBe(0);
  });

  it("respects usage_limit and usage_per_customer", async () => {
    coupon({ usage_limit: 5 });
    usageCount = 5;
    expect((await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: null })).reason).toBe("usage_limit_reached");

    coupon({ usage_per_customer: 1 });
    usageCount = 0;
    perCustomerCount = 1;
    expect((await evaluateCoupon({ code: "TEST", subtotal: 100, displayCurrency: "USD", customerId: "cust1" })).reason).toBe("per_customer_limit_reached");
  });

  it("converts a foreign-currency fixed value into the display currency", async () => {
    coupon({ coupon_type: "fixed", value: 100, currency: "TRY" });
    convertMoney.mockResolvedValue({ targetAmount: 3.1, appliedRate: 0.031 });
    const r = await evaluateCoupon({ code: "TEST", subtotal: 50, displayCurrency: "USD", customerId: null });
    expect(convertMoney).toHaveBeenCalled();
    expect(r.discountAmount).toBe(3.1);
  });
});
