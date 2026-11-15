import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The request's domain decides the merchant token; tests set it per case.
const requestHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.value }));

import type { PaymentGatewayRuntimeConfig, PaymentInitiationRequest } from "../types";
import { zibalPaymentProvider } from "./zibal";

const config = (overrides: Partial<PaymentGatewayRuntimeConfig["settings"]> = {}): PaymentGatewayRuntimeConfig => ({
  code: "zibal",
  provider: "zibal",
  displayName: "Zibal",
  isEnabled: true,
  settings: {
    sandbox: false,
    currency: "IRR",
    minimumAmount: 10_000,
    domainMerchants: [
      { host: "lsevincare.com", merchant: "merchant-com" },
      { host: "lsevin.ir", merchant: "merchant-ir" },
    ],
    ...overrides,
  },
});

const payment = (amount = 250_000, currency = "IRR"): PaymentInitiationRequest => ({
  payment: {
    paymentId: "pay-1",
    bookingId: "booking-1",
    userId: "user-1",
    amount,
    currency,
    sourceAmount: amount,
    sourceCurrency: currency,
    description: "LSevin booking booking-1",
    customer: { mobile: "+989121234567" },
  },
  locale: "fa",
  // Built by the flow from the canonical origin; Zibal must move it to the request's domain.
  callbackUrl: "https://lsevincare.com/fa/api/payments/zibal/callback",
});

function onDomain(host: string) {
  requestHeaders.value = new Headers({ "x-forwarded-host": host, "x-forwarded-proto": "https" });
}

const fetchMock = vi.fn();
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
const sentBody = (call = 0) => JSON.parse(String(fetchMock.mock.calls[call]![1].body));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("zibalPaymentProvider.initiate", () => {
  it("uses the token of the domain the customer is on and calls back to that same domain", async () => {
    onDomain("www.lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 100, trackId: 3001 }));

    const result = await zibalPaymentProvider.initiate(payment(), config());

    expect(fetchMock.mock.calls[0]![0]).toBe("https://gateway.zibal.ir/v1/request");
    const body = sentBody();
    expect(body.merchant).toBe("merchant-ir");
    expect(body.callbackUrl).toBe("https://www.lsevin.ir/fa/api/payments/zibal/callback");
    expect(body.amount).toBe(250_000);
    expect(body.orderId).toBe("pay-1");
    expect(body.mobile).toBe("09121234567");
    expect(result.redirectUrl).toBe("https://gateway.zibal.ir/start/3001");
    expect(result.authority).toBe("3001");
    // The token is a secret: never part of what is stored with the attempt.
    expect(JSON.stringify(result.raw)).not.toContain("merchant-ir");
  });

  it("never keeps the port of the URL the flow built (regression: :3000 leaked into the callback)", async () => {
    onDomain("appmain.lsevin.com");
    vi.stubEnv("NODE_ENV", "production");
    fetchMock.mockResolvedValueOnce(json({ result: 100, trackId: 3005 }));
    await zibalPaymentProvider.initiate(
      { ...payment(), callbackUrl: "http://localhost:3000/fa/api/wallet/payments/zibal/callback?x=1" },
      config({ domainMerchants: [{ host: "appmain.lsevin.com", merchant: "merchant-app" }] })
    );
    expect(sentBody().callbackUrl).toBe("https://appmain.lsevin.com/fa/api/wallet/payments/zibal/callback?x=1");
  });

  it("refuses to start a payment on a domain that has no token (no fallback to another domain's)", async () => {
    onDomain("appmain.lsevin.com");
    await expect(zibalPaymentProvider.initiate(payment(), config())).rejects.toThrow(/no merchant token for appmain\.lsevin\.com/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses when the request has no usable host at all", async () => {
    requestHeaders.value = new Headers({ host: "0.0.0.0:3000" });
    await expect(zibalPaymentProvider.initiate(payment(), config())).rejects.toThrow(/no merchant token/);
  });

  it("converts Toman to Rial and enforces the minimum and the per-charge cap", async () => {
    onDomain("lsevincare.com");
    fetchMock.mockResolvedValue(json({ result: 100, trackId: 3002 }));
    await zibalPaymentProvider.initiate(payment(5_000, "IRT"), config());
    expect(sentBody().amount).toBe(50_000);

    await expect(zibalPaymentProvider.initiate(payment(9_999), config())).rejects.toThrow(/minimum/);
    await expect(zibalPaymentProvider.initiate(payment(1_000_000_001), config())).rejects.toThrow("GATEWAY_AMOUNT_LIMIT_EXCEEDED");
  });

  it("surfaces Zibal's rejection with its result code", async () => {
    onDomain("lsevincare.com");
    fetchMock.mockResolvedValueOnce(json({ result: 102, message: "merchant not found" }));
    await expect(zibalPaymentProvider.initiate(payment(), config())).rejects.toThrow(/result 102 - Merchant not found/);
  });

  it("sandbox uses Zibal's test merchant on any domain, but never in production", async () => {
    onDomain("appmain.lsevin.com");
    // Production: a sandbox switch left on must not complete payments without money.
    await expect(zibalPaymentProvider.initiate(payment(), config({ sandbox: true }))).rejects.toThrow(/sandbox mode is not allowed in production/);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("ZIBAL_SANDBOX_ALLOWED", "true"); // a staging server, on purpose
    fetchMock.mockResolvedValueOnce(json({ result: 100, trackId: 3003 }));
    await zibalPaymentProvider.initiate(payment(), config({ sandbox: true }));
    expect(sentBody().merchant).toBe("zibal");
  });

  it("never uses the test API base in production", async () => {
    vi.stubEnv("ZIBAL_API_BASE_URL", "http://127.0.0.1:3921");
    onDomain("lsevincare.com");
    fetchMock.mockResolvedValueOnce(json({ result: 100, trackId: 3004 }));
    await zibalPaymentProvider.initiate(payment(), config());
    expect(fetchMock.mock.calls[0]![0]).toBe("https://gateway.zibal.ir/v1/request");
  });
});

describe("zibalPaymentProvider.verify", () => {
  const verifyInput = { authority: "3001", status: "OK", amount: 250_000, currency: "IRR" };

  it("verifies with the domain's token and reports the bank reference", async () => {
    onDomain("lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 100, status: 1, amount: 250_000, refNumber: 778899, cardNumber: "6037****1234" }));

    const result = await zibalPaymentProvider.verify(verifyInput, config());

    expect(fetchMock.mock.calls[0]![0]).toBe("https://gateway.zibal.ir/v1/verify");
    expect(sentBody()).toEqual({ merchant: "merchant-ir", trackId: 3001 });
    expect(result).toMatchObject({ success: true, alreadyVerified: false, referenceId: "778899", cardPan: "6037****1234" });
  });

  it("treats 201 (already verified) as success, so a refreshed callback does not fail a paid order", async () => {
    onDomain("lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 201, amount: 250_000, refNumber: 778899 }));
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: true, alreadyVerified: true });
  });

  it("fails when the paid amount differs from the attempt (Zibal verifies by trackId alone)", async () => {
    onDomain("lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 100, amount: 1_000, refNumber: 1 }));
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: false, code: "AMOUNT_MISMATCH" });
  });

  it("fails when a successful verify reports no amount", async () => {
    onDomain("lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 100, refNumber: 1 }));
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: false, code: "AMOUNT_MISSING" });
  });

  it("does not call Zibal for a cancelled return or a malformed trackId", async () => {
    onDomain("lsevin.ir");
    expect(await zibalPaymentProvider.verify({ ...verifyInput, status: "NOK" }, config())).toMatchObject({ success: false });
    expect(await zibalPaymentProvider.verify({ ...verifyInput, authority: "12ab" }, config())).toMatchObject({ success: false, code: 203 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports unpaid/failed (202) and network errors as failures, never as success", async () => {
    onDomain("lsevin.ir");
    fetchMock.mockResolvedValueOnce(json({ result: 202, message: "not paid" }));
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: false, code: 202 });
    fetchMock.mockRejectedValueOnce(new Error("socket hang up"));
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: false, code: "VERIFY_REQUEST_FAILED" });
  });

  it("fails without calling Zibal on a domain with no token", async () => {
    onDomain("appmain.lsevin.com");
    expect(await zibalPaymentProvider.verify(verifyInput, config())).toMatchObject({ success: false, code: "NO_MERCHANT" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
