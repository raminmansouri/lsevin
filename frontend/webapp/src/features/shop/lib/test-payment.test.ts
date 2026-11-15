import { describe, expect, it } from "vitest";

import { isTestPaymentEnabled, testPaymentMethod } from "./test-payment";

describe("isTestPaymentEnabled", () => {
  it("needs both a non-production NODE_ENV and the flag", () => {
    expect(isTestPaymentEnabled({ NODE_ENV: "development", SHOP_TEST_PAYMENT_ENABLED: "true" })).toBe(true);
    expect(isTestPaymentEnabled({ NODE_ENV: "test", SHOP_TEST_PAYMENT_ENABLED: "true" })).toBe(true);
  });
  it("is off in production even with the flag", () => {
    expect(isTestPaymentEnabled({ NODE_ENV: "production", SHOP_TEST_PAYMENT_ENABLED: "true" })).toBe(false);
  });
  it("is off without the flag or with any other value", () => {
    expect(isTestPaymentEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isTestPaymentEnabled({ NODE_ENV: "development", SHOP_TEST_PAYMENT_ENABLED: "1" })).toBe(false);
  });
});

describe("testPaymentMethod", () => {
  it("is labelled in Persian for fa", () => {
    expect(testPaymentMethod("fa", "IRR").name).toBe("پرداخت آزمایشی (فقط تست)");
    expect(testPaymentMethod("en", "USD").currency).toBe("USD");
  });
});
