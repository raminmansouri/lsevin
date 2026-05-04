import type {
  PaymentGatewayRuntimeConfig,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationRequest,
  PaymentVerificationResult,
} from "../types";

type ZarinPalRuntimeConfig = {
  merchantId: string;
  sandbox: boolean;
  currency: "IRR" | "IRT";
  minimumAmount: number;
};

type ZarinpalApiResponse = {
  data?: Record<string, unknown> | null;
  errors?: Record<string, unknown> | unknown[] | string | null;
  [key: string]: unknown;
};

function normalizeBoolean(value?: string | boolean | null): boolean {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

function getZarinPalConfig(runtime?: PaymentGatewayRuntimeConfig): ZarinPalRuntimeConfig {
  const settings = runtime?.settings ?? {};
  const merchantId = String(settings.merchantId || process.env.ZARINPAL_MERCHANT_ID || "").trim();

  if (!merchantId) {
    throw new Error("Zarinpal merchant id is not configured. Add it in Admin > Payment Gateways > Zarinpal or set ZARINPAL_MERCHANT_ID.");
  }

  const currency = String(settings.currency || process.env.ZARINPAL_CURRENCY || "IRR").trim().toUpperCase();
  if (currency !== "IRR" && currency !== "IRT") {
    throw new Error("Zarinpal currency must be IRR or IRT.");
  }

  const sandbox = settings.sandbox ?? normalizeBoolean(process.env.ZARINPAL_SANDBOX ?? "true");
  const minimumAmount = toPositiveInteger(settings.minimumAmount, currency === "IRT" ? 1000 : 10000);

  return {
    merchantId,
    sandbox: Boolean(sandbox),
    currency,
    minimumAmount,
  };
}

function toIntegerAmount(value: number): number {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer for Zarinpal.");
  }
  return amount;
}

/**
 * Zarinpal API expects Rial amounts. If admin/user-facing gateway currency is
 * Toman (IRT), convert to Rial before request/verification.
 */
function toZarinpalApiAmount(value: number, currency: string): number {
  const amount = toIntegerAmount(value);
  return String(currency || "IRR").toUpperCase() === "IRT" ? amount * 10 : amount;
}

function getApiBaseUrl(config: ZarinPalRuntimeConfig): string {
  return config.sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
}

function getStartPayBaseUrl(config: ZarinPalRuntimeConfig): string {
  return config.sandbox ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com";
}

function buildStartPayUrl(config: ZarinPalRuntimeConfig, authority: string): string {
  return `${getStartPayBaseUrl(config)}/pg/StartPay/${encodeURIComponent(authority)}`;
}

function compactPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as T;
}

function normalizeMobile(value?: string | null): string | undefined {
  const mobile = String(value || "").trim();
  // Zarinpal accepts Iranian mobile numbers. Avoid sending invalid optional data.
  if (/^09\d{9}$/.test(mobile)) return mobile;
  if (/^\+989\d{9}$/.test(mobile)) return `0${mobile.slice(3)}`;
  return undefined;
}

function normalizeEmail(value?: string | null): string | undefined {
  const email = String(value || "").trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  return undefined;
}

async function readZarinpalResponse(response: Response): Promise<ZarinpalApiResponse | string> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ZarinpalApiResponse;
  } catch {
    return text;
  }
}

function extractZarinpalError(body: ZarinpalApiResponse | string, fallback: string): string {
  if (typeof body === "string") {
    const cleaned = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return cleaned ? `${fallback}: ${cleaned}` : fallback;
  }

  const data = body?.data;
  const errors = body?.errors;

  const candidates: unknown[] = [
    data?.message,
    (errors as Record<string, unknown> | null | undefined)?.message,
    (errors as Record<string, unknown> | null | undefined)?.code,
    body?.message,
  ];

  if (Array.isArray(errors)) {
    candidates.push(errors.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(", "));
  } else if (typeof errors === "string") {
    candidates.push(errors);
  } else if (errors && typeof errors === "object") {
    candidates.push(JSON.stringify(errors));
  }

  const message = candidates.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return message ? `${fallback}: ${String(message)}` : `${fallback}: ${JSON.stringify(body)}`;
}

async function postZarinpal(
  config: ZarinPalRuntimeConfig,
  path: "/pg/v4/payment/request.json" | "/pg/v4/payment/verify.json",
  payload: Record<string, unknown>
): Promise<ZarinpalApiResponse> {
  const url = `${getApiBaseUrl(config)}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "LSevin-Zarinpal-Direct/1.0",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await readZarinpalResponse(response);

  if (!response.ok) {
    throw new Error(extractZarinpalError(body, `Zarinpal HTTP ${response.status} request failed`));
  }

  if (typeof body === "string") {
    throw new Error(extractZarinpalError(body, "Zarinpal returned a non-JSON response"));
  }

  return body;
}

function getDataNumber(body: ZarinpalApiResponse, key: string): number | null {
  const value = body?.data?.[key] ?? (body as Record<string, unknown>)[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDataString(body: ZarinpalApiResponse, keys: string[]): string | null {
  for (const key of keys) {
    const value = body?.data?.[key] ?? (body as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function validateCallbackUrl(callbackUrl: string): string {
  const normalized = String(callbackUrl || "").trim();
  if (!normalized) throw new Error("Zarinpal callback URL is missing.");

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("Zarinpal callback URL must be HTTPS for public environments.");
    }
    return parsed.toString();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Zarinpal callback URL is invalid.");
  }
}

export const zarinpalPaymentProvider: PaymentProvider = {
  code: "zarinpal",

  async initiate(input: PaymentInitiationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentInitiationResult> {
    const config = getZarinPalConfig(runtime);
    const apiAmount = toZarinpalApiAmount(input.payment.amount, input.payment.currency || config.currency);
    const minimumApiAmount = toZarinpalApiAmount(config.minimumAmount, config.currency);

    if (apiAmount < minimumApiAmount) {
      throw new Error(`Zarinpal minimum payment amount is ${config.minimumAmount} ${config.currency}.`);
    }

    const requestPayload = compactPayload({
      merchant_id: config.merchantId,
      amount: apiAmount,
      callback_url: validateCallbackUrl(input.callbackUrl),
      description: input.payment.description || `LSevin payment ${input.payment.paymentId}`,
      mobile: normalizeMobile(input.payment.customer?.mobile),
      email: normalizeEmail(input.payment.customer?.email),
      // Do not send currency. The direct sandbox request confirmed working without
      // it, and API amount is always sent in Rial after conversion above.
    });

    const response = await postZarinpal(config, "/pg/v4/payment/request.json", requestPayload);
    const code = getDataNumber(response, "code");

    if (code !== 100) {
      throw new Error(extractZarinpalError(response, `Zarinpal rejected payment request with code ${code ?? "unknown"}`));
    }

    const authority = getDataString(response, ["authority", "Authority"]);
    if (!authority) {
      throw new Error(`Zarinpal did not return an authority. Response: ${JSON.stringify(response)}`);
    }

    return {
      paymentId: input.payment.paymentId,
      bookingId: input.payment.bookingId,
      gateway: "zarinpal",
      status: "requires_action",
      redirectUrl: buildStartPayUrl(config, authority),
      authority,
      amount: apiAmount,
      currency: "IRR",
      raw: {
        request: requestPayload,
        response,
        transport: "direct_fetch",
      },
    };
  },

  async verify(input: PaymentVerificationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentVerificationResult> {
    if (String(input.status || "").toUpperCase() !== "OK") {
      return {
        success: false,
        code: input.status || "NOK",
        message: "The payment was cancelled or failed before verification.",
      };
    }

    const config = getZarinPalConfig(runtime);
    const apiAmount = toZarinpalApiAmount(input.amount, input.currency || config.currency);
    const requestPayload = {
      merchant_id: config.merchantId,
      amount: apiAmount,
      authority: input.authority,
    };

    let response: ZarinpalApiResponse;
    try {
      response = await postZarinpal(config, "/pg/v4/payment/verify.json", requestPayload);
    } catch (error) {
      return {
        success: false,
        code: "VERIFY_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unable to verify Zarinpal payment.",
        raw: error,
      };
    }

    const numericCode = getDataNumber(response, "code");
    const success = numericCode === 100 || numericCode === 101;

    return {
      success,
      alreadyVerified: numericCode === 101,
      referenceId: getDataString(response, ["ref_id", "refId", "reference_id", "referenceId"]),
      cardPan: getDataString(response, ["card_pan", "cardPan"]),
      fee: getDataString(response, ["fee"]),
      code: numericCode,
      message:
        getDataString(response, ["message", "Message"]) ||
        (!success ? extractZarinpalError(response, `Zarinpal verification failed with code ${numericCode ?? "unknown"}`) : null),
      raw: {
        request: requestPayload,
        response,
        transport: "direct_fetch",
      },
    };
  },
};
