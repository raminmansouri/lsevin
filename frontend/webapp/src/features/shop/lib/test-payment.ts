/**
 * Development-only "test payment": places the order and settles it through the same success path a
 * verified gateway callback uses, without a real gateway. Enabled only when BOTH hold:
 *   NODE_ENV !== "production"  and  SHOP_TEST_PAYMENT_ENABLED === "true".
 * The server refuses the method otherwise (it is not only hidden). Never set the flag on a server.
 */
export const TEST_PAYMENT_CODE = "test_payment";
export const TEST_PAYMENT_PROVIDER = "test";

export function isTestPaymentEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" && env.SHOP_TEST_PAYMENT_ENABLED === "true";
}

export function testPaymentMethod(lang: string, currency: string) {
  const fa = String(lang || "").toLowerCase().startsWith("fa");
  return {
    id: TEST_PAYMENT_CODE,
    code: TEST_PAYMENT_CODE,
    provider: TEST_PAYMENT_PROVIDER,
    name: fa ? "پرداخت آزمایشی (فقط تست)" : "Test payment (testing only)",
    description: fa ? "بدون درگاه؛ سفارش فوراً پرداخت‌شده ثبت می‌شود. فقط در محیط توسعه." : "No gateway; the order is marked paid at once. Development only.",
    supportsRefund: false,
    currency,
  };
}
