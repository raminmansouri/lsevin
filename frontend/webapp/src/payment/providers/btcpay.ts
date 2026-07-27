import type {
  PaymentGatewayRuntimeConfig,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationRequest,
  PaymentVerificationResult,
} from "../types";

/**
 * BTCPay Server (self-hosted, non-custodial) crypto gateway.
 *
 * Unlike Zarinpal, settlement is asynchronous: the browser return only reflects
 * current state, and the HMAC-signed webhook (InvoiceSettled) is the source of
 * truth. `initiate()` creates a BTCPay invoice priced in a stable fiat unit
 * (USD by default) and hands the customer BTCPay's hosted checkout link;
 * `verify()` re-reads the invoice from the Greenfield API and only reports
 * success once the invoice status is "Settled".
 *
 * Connection secrets (store id, API key) are read from the gateway settings
 * first, then environment variables. Keys are intentionally kept out of the DB
 * in production and provided via env (BTCPAY_STORE_ID / BTCPAY_API_KEY /
 * BTCPAY_SERVER_URL).
 */

type BtcPayRuntimeConfig = {
  serverUrl: string;
  storeId: string;
  apiKey: string;
  invoiceCurrency: string;
  expirationMinutes: number;
};

type BtcPayInvoiceResponse = {
  id?: string;
  storeId?: string;
  checkoutLink?: string;
  status?: string;
  additionalStatus?: string;
  amount?: string | number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

// Greenfield invoice states considered a completed, credited payment.
const SETTLED_STATUSES = new Set(["settled", "complete", "confirmed", "paid"]);
// States that mean the invoice can never be paid — safe to fail the attempt.
const DEAD_STATUSES = new Set(["expired", "invalid"]);

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getBtcPayConfig(runtime?: PaymentGatewayRuntimeConfig): BtcPayRuntimeConfig {
  const settings = (runtime?.settings ?? {}) as Record<string, unknown>;

  const serverUrl = trimTrailingSlash(
    String(settings.serverUrl || process.env.BTCPAY_SERVER_URL || "").trim()
  );
  const storeId = String(settings.storeId || process.env.BTCPAY_STORE_ID || "").trim();
  const apiKey = String(settings.apiKey || process.env.BTCPAY_API_KEY || "").trim();

  if (!serverUrl) {
    throw new Error("BTCPay server URL is not configured. Set BTCPAY_SERVER_URL (e.g. https://pay.lsevin.com).");
  }
  if (!storeId) {
    throw new Error("BTCPay store id is not configured. Set BTCPAY_STORE_ID or add it in Admin > Payment Gateways.");
  }
  if (!apiKey) {
    throw new Error("BTCPay API key is not configured. Set BTCPAY_API_KEY (Greenfield API key).");
  }

  const invoiceCurrency = String(settings.currency || process.env.BTCPAY_INVOICE_CURRENCY || "USD")
    .trim()
    .toUpperCase() || "USD";

  const expirationMinutes = Number(settings.expirationMinutes || process.env.BTCPAY_INVOICE_EXPIRATION_MINUTES || 30);

  return {
    serverUrl,
    storeId,
    apiKey,
    invoiceCurrency,
    expirationMinutes: Number.isFinite(expirationMinutes) && expirationMinutes > 0 ? Math.round(expirationMinutes) : 30,
  };
}

function authHeaders(config: BtcPayRuntimeConfig): Record<string, string> {
  return {
    Authorization: `token ${config.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "LSevin-BTCPay-Greenfield/1.0",
  };
}

async function readJson<T>(response: Response): Promise<T | string> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text;
  }
}

function extractError(body: unknown, fallback: string): string {
  if (typeof body === "string") {
    const cleaned = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return cleaned ? `${fallback}: ${cleaned}` : fallback;
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.code;
    if (message) return `${fallback}: ${String(message)}`;
    return `${fallback}: ${JSON.stringify(body)}`;
  }
  return fallback;
}

function buildReturnUrl(input: PaymentInitiationRequest): string | undefined {
  // Derive the app origin from the callback URL the service already built, then
  // point BTCPay's post-payment redirect at our read-only return handler.
  try {
    const origin = new URL(input.callbackUrl).origin;
    const locale = String(input.locale || "fa").trim() || "fa";
    return `${origin}/${locale}/api/payments/btcpay/return?paymentId=${encodeURIComponent(input.payment.paymentId)}`;
  } catch {
    return undefined;
  }
}

export const btcpayPaymentProvider: PaymentProvider = {
  code: "btcpay",

  async initiate(input: PaymentInitiationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentInitiationResult> {
    const config = getBtcPayConfig(runtime);
    const currency = String(input.payment.currency || config.invoiceCurrency || "USD").trim().toUpperCase();
    const amount = Number(input.payment.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("BTCPay payment amount must be a positive number.");
    }

    const requestPayload: Record<string, unknown> = {
      amount: amount.toString(),
      currency,
      metadata: {
        orderId: input.payment.paymentId,
        bookingId: input.payment.bookingId,
        paymentId: input.payment.paymentId,
        buyerEmail: input.payment.customer?.email || undefined,
        itemDesc: input.payment.description || undefined,
      },
      checkout: {
        redirectURL: buildReturnUrl(input),
        redirectAutomatically: true,
        expirationMinutes: config.expirationMinutes,
      },
    };

    const url = `${config.serverUrl}/api/v1/stores/${encodeURIComponent(config.storeId)}/invoices`;
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify(requestPayload),
      cache: "no-store",
    });

    const body = await readJson<BtcPayInvoiceResponse>(response);

    if (!response.ok || typeof body === "string" || !body.id || !body.checkoutLink) {
      throw new Error(extractError(body, `BTCPay invoice creation failed (HTTP ${response.status})`));
    }

    return {
      paymentId: input.payment.paymentId,
      bookingId: input.payment.bookingId,
      gateway: "btcpay",
      status: "requires_action",
      redirectUrl: body.checkoutLink,
      authority: body.id,
      amount,
      currency,
      raw: { request: requestPayload, response: body, transport: "greenfield_fetch" },
    };
  },

  async verify(input: PaymentVerificationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentVerificationResult> {
    const config = getBtcPayConfig(runtime);
    const invoiceId = String(input.authority || "").trim();
    if (!invoiceId) {
      return { success: false, code: "MISSING_INVOICE_ID", message: "BTCPay invoice id is missing." };
    }

    const url = `${config.serverUrl}/api/v1/stores/${encodeURIComponent(config.storeId)}/invoices/${encodeURIComponent(invoiceId)}`;

    let response: Response;
    try {
      response = await fetch(url, { method: "GET", headers: authHeaders(config), cache: "no-store" });
    } catch (error) {
      return {
        success: false,
        code: "VERIFY_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unable to reach BTCPay to verify the invoice.",
        raw: error,
      };
    }

    const body = await readJson<BtcPayInvoiceResponse>(response);
    if (!response.ok || typeof body === "string") {
      return {
        success: false,
        code: `HTTP_${response.status}`,
        message: extractError(body, `BTCPay invoice lookup failed (HTTP ${response.status})`),
        raw: body,
      };
    }

    const status = String(body.status || "").trim().toLowerCase();
    const success = SETTLED_STATUSES.has(status);
    const dead = DEAD_STATUSES.has(status);

    return {
      success,
      referenceId: body.id || invoiceId,
      code: body.status || "unknown",
      // `dead` distinguishes "will never pay" (expired/invalid) from "not yet"
      // (new/processing); the settle-only service uses this to decide whether a
      // pending crypto payment may be failed. Surfaced via message + raw.
      message: success
        ? "BTCPay invoice settled."
        : dead
          ? `BTCPay invoice is ${status} and can no longer be paid.`
          : `BTCPay invoice is not settled yet (status: ${status || "unknown"}).`,
      raw: { status: body.status, additionalStatus: body.additionalStatus, dead, response: body },
    };
  },
};
