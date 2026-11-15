import { currentRequestHost, currentRequestOrigin } from "@/lib/http/request-host";

import { findDomainMerchant } from "../domain-merchants";
import { IRANIAN_GATEWAY_MAX_AMOUNT, zibalSandboxAllowed } from "../gateways";
import type {
  PaymentGatewayRuntimeConfig,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationRequest,
  PaymentVerificationResult,
} from "../types";

/**
 * Zibal IPG (https://help.zibal.ir/ipg). Every domain has its own merchant token: the token
 * is picked by the domain the request arrived on, and the callback goes back to that same
 * domain (Shaparak rejects a callback on a domain the merchant was not registered for).
 *
 *   request  POST {base}/v1/request {merchant, amount (Rial), callbackUrl, description, orderId, mobile}
 *            -> {result: 100, trackId}
 *   pay      {base}/start/{trackId}
 *   return   GET callbackUrl?success=1|0&trackId=..&orderId=..&status=..
 *   verify   POST {base}/v1/verify {merchant, trackId} -> {result: 100|201, amount, refNumber, cardNumber, ...}
 *
 * Zibal's verify takes no amount, so the verified amount is compared here: a mismatch is a
 * failure, never a credit.
 */

const REQUEST_TIMEOUT_MS = 20_000;
/** Zibal's own test merchant: works on the live endpoint without a real token. */
export const ZIBAL_SANDBOX_MERCHANT = "zibal";

/** Overridable for local tests (a stub server); production always uses Zibal's gateway. */
function apiBase(): string {
  const configured = process.env.NODE_ENV !== "production" ? process.env.ZIBAL_API_BASE_URL?.trim() : "";
  return (configured || "https://gateway.zibal.ir").replace(/\/+$/, "");
}

export const ZIBAL_RESULT_MESSAGES: Record<number, string> = {
  100: "Success.",
  102: "Merchant not found.",
  103: "Merchant is disabled.",
  104: "Merchant is invalid.",
  105: "Amount is below the minimum.",
  106: "Callback URL is invalid.",
  113: "Amount is above the maximum.",
  115: "The server IP is not registered in the Zibal panel.",
  201: "Already verified.",
  202: "The order was not paid or the payment failed.",
  203: "trackId is invalid.",
};

export class ZibalConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZibalConfigurationError";
  }
}

type ZibalResponse = Record<string, unknown> & { result?: unknown; message?: unknown };

/** The merchant token for this request's domain (sandbox: Zibal's test merchant). */
export async function resolveZibalMerchant(runtime?: PaymentGatewayRuntimeConfig, host?: string | null): Promise<string> {
  if (runtime?.settings?.sandbox) {
    if (zibalSandboxAllowed()) return ZIBAL_SANDBOX_MERCHANT;
    // Never fall through to a real token either: the admin asked for test mode.
    throw new ZibalConfigurationError("Zibal sandbox mode is not allowed in production. Turn it off in Admin > Payment gateways > Zibal.");
  }
  const requestHost = host === undefined ? await currentRequestHost() : host;
  const merchant = findDomainMerchant(runtime?.settings?.domainMerchants, requestHost);
  if (!merchant) {
    throw new ZibalConfigurationError(
      `Zibal has no merchant token for ${requestHost ?? "this domain"}. Add it in Admin > Payment gateways > Zibal.`
    );
  }
  return merchant;
}

function toRial(amount: number, currency: string): number {
  const value = Math.round(Number(amount || 0));
  if (!Number.isFinite(value) || value <= 0) throw new Error("Payment amount must be a positive integer for Zibal.");
  return String(currency || "IRR").toUpperCase() === "IRT" ? value * 10 : value;
}

/** Iranian mobile in 09xxxxxxxxx form, or undefined (optional field; never send garbage). */
function normalizeMobile(value?: string | null): string | undefined {
  const mobile = String(value || "").replace(/[\s-]/g, "");
  if (/^09\d{9}$/.test(mobile)) return mobile;
  if (/^\+989\d{9}$/.test(mobile)) return `0${mobile.slice(3)}`;
  if (/^00989\d{9}$/.test(mobile)) return `0${mobile.slice(4)}`;
  return undefined;
}

/** The callback goes to the domain the payment started on, keeping the flow's own path. */
async function callbackOnRequestDomain(callbackUrl: string): Promise<string> {
  const built = new URL(callbackUrl);
  const origin = await currentRequestOrigin();
  // Rebuilt from the request's origin, keeping only the flow's path and query. Setting just
  // `host` would keep the built URL's port: a base of http://localhost:3000 (the legacy wallet
  // copy's fallback) became https://appmain.lsevin.com:3000/...
  const target = origin ? new URL(`${built.pathname}${built.search}`, origin) : built;
  // Production is always HTTPS (currentRequestOrigin forces it); plain http only in development.
  if (target.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Zibal callback URL must be HTTPS.");
  }
  return target.toString();
}

async function post(path: "/v1/request" | "/v1/verify", payload: Record<string, unknown>): Promise<ZibalResponse> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "LSevin-Zibal/1.0" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Zibal returned a non-JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(`Zibal HTTP ${response.status}: ${describe(body as ZibalResponse)}`);
  if (!body || typeof body !== "object") throw new Error("Zibal returned an empty response.");
  return body as ZibalResponse;
}

function resultCode(body: ZibalResponse): number | null {
  const value = Number(body.result);
  return Number.isInteger(value) ? value : null;
}

function describe(body: ZibalResponse | null): string {
  const code = body ? resultCode(body) : null;
  const known = code != null ? ZIBAL_RESULT_MESSAGES[code] : null;
  const message = body?.message != null ? String(body.message) : "";
  return [code != null ? `result ${code}` : null, known, message && message !== known ? message : null].filter(Boolean).join(" - ");
}

function text(value: unknown): string | null {
  return value === undefined || value === null || String(value).trim() === "" ? null : String(value).trim();
}

export const zibalPaymentProvider: PaymentProvider = {
  code: "zibal",

  async initiate(input: PaymentInitiationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentInitiationResult> {
    const merchant = await resolveZibalMerchant(runtime);
    const currency = String(input.payment.currency || runtime?.settings?.currency || "IRR").toUpperCase();
    const amount = toRial(input.payment.amount, currency);
    const minimum = toRial(
      Number(runtime?.settings?.minimumAmount) || (String(runtime?.settings?.currency).toUpperCase() === "IRT" ? 1_000 : 10_000),
      String(runtime?.settings?.currency || "IRR")
    );
    if (amount < minimum) throw new Error(`Zibal minimum payment amount is ${minimum} IRR.`);
    if (amount > IRANIAN_GATEWAY_MAX_AMOUNT.IRR) throw new Error("GATEWAY_AMOUNT_LIMIT_EXCEEDED");

    const callbackUrl = await callbackOnRequestDomain(input.callbackUrl);
    const request = {
      amount,
      callbackUrl,
      description: input.payment.description || `LSevin payment ${input.payment.paymentId}`,
      orderId: input.payment.paymentId,
      mobile: normalizeMobile(input.payment.customer?.mobile),
    };

    const response = await post("/v1/request", { merchant, ...request });
    const code = resultCode(response);
    const trackId = text(response.trackId);
    if (code !== 100 || !trackId || !/^\d+$/.test(trackId)) {
      throw new Error(`Zibal rejected the payment request: ${describe(response)}`);
    }

    return {
      paymentId: input.payment.paymentId,
      bookingId: input.payment.bookingId,
      gateway: "zibal",
      status: "requires_action",
      redirectUrl: `${apiBase()}/start/${encodeURIComponent(trackId)}`,
      authority: trackId,
      amount,
      currency: "IRR",
      // The merchant token is a secret: it is never stored with the attempt.
      raw: { request, response, sandbox: Boolean(runtime?.settings?.sandbox) },
    };
  },

  async verify(input: PaymentVerificationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentVerificationResult> {
    if (String(input.status || "").toUpperCase() !== "OK") {
      return { success: false, code: input.status || "NOK", message: "The payment was cancelled or failed before verification." };
    }

    let merchant: string;
    try {
      merchant = await resolveZibalMerchant(runtime);
    } catch (error) {
      return { success: false, code: "NO_MERCHANT", message: error instanceof Error ? error.message : "Zibal is not configured." };
    }

    const trackId = String(input.authority || "").trim();
    if (!/^\d+$/.test(trackId)) return { success: false, code: 203, message: ZIBAL_RESULT_MESSAGES[203] };

    let response: ZibalResponse;
    try {
      response = await post("/v1/verify", { merchant, trackId: Number(trackId) });
    } catch (error) {
      return {
        success: false,
        code: "VERIFY_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unable to verify the Zibal payment.",
      };
    }

    const code = resultCode(response);
    const raw = { request: { trackId }, response };
    if (code !== 100 && code !== 201) {
      return { success: false, code, message: `Zibal verification failed: ${describe(response)}`, raw };
    }

    // Zibal verifies by trackId alone; the paid amount must be the one this attempt asked for.
    const expected = toRial(input.amount, input.currency || runtime?.settings?.currency || "IRR");
    const paid = Number(response.amount);
    if (response.amount !== undefined && response.amount !== null && paid !== expected) {
      return {
        success: false,
        code: "AMOUNT_MISMATCH",
        message: `Zibal reported ${paid} IRR paid, expected ${expected} IRR.`,
        raw,
      };
    }
    if (code === 100 && (response.amount === undefined || response.amount === null)) {
      return { success: false, code: "AMOUNT_MISSING", message: "Zibal did not report the paid amount.", raw };
    }

    return {
      success: true,
      alreadyVerified: code === 201,
      referenceId: text(response.refNumber) ?? trackId,
      cardPan: text(response.cardNumber),
      code,
      message: null,
      raw,
    };
  },
};
