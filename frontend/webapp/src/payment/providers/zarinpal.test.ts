import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PaymentInitiationRequest } from "../types";
import { zarinpalPaymentProvider } from "./zarinpal";

/**
 * Regression test for Shaparak's callback_url/Referrer domain-match rule: both
 * must carry the exact domain registered for this merchant id. callback_url is
 * caller-supplied (the app services build it from NEXT_PUBLIC_URL), but Referer
 * is zarinpal.ts's own responsibility -- a server-to-server fetch sends none on
 * its own, and an app-origin mismatch here (e.g. a stale env fallback resolving
 * to localhost) was the actual cause of the "عدم تطابق Callback و Referrer" error
 * in production for booking/wallet payments.
 */
describe("zarinpalPaymentProvider.initiate", () => {
  const domain = "https://appmain.lsevin.com";

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_URL", domain);
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "11111111-1111-1111-1111-111111111111");
    vi.stubEnv("ZARINPAL_SANDBOX", "false");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: { code: 100, authority: "A000000000000000000000000000000000" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends a Referer header matching the registered app domain", async () => {
    const input: PaymentInitiationRequest = {
      payment: {
        paymentId: "pay_1",
        bookingId: "book_1",
        userId: "user_1",
        amount: 50000,
        currency: "IRR",
        sourceAmount: 50000,
        sourceCurrency: "IRR",
        description: "test payment",
      },
      locale: "fa",
      callbackUrl: `${domain}/fa/api/payments/zarinpal/callback`,
    };

    await zarinpalPaymentProvider.initiate(input);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = requestInit.headers as Record<string, string>;
    expect(headers.Referer).toBe(`${domain}/`);

    const body = JSON.parse(requestInit.body as string);
    expect(new URL(body.callback_url).origin).toBe(domain);
  });
});
