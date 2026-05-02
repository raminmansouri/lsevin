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

async function createZarinPalClient(config: ZarinPalRuntimeConfig): Promise<any> {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
    const mod = await dynamicImport("zarinpal-node-sdk");
    const ZarinPal = mod?.ZarinPal || mod?.default;

    if (!ZarinPal) {
      throw new Error("ZarinPal export was not found in zarinpal-node-sdk.");
    }

    return new ZarinPal({
      merchantId: config.merchantId,
      sandbox: config.sandbox,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SDK loading error";
    throw new Error(`Unable to load zarinpal-node-sdk. Install it with: npm install zarinpal-node-sdk. ${message}`);
  }
}

function getDeepValue(source: unknown, keys: string[]): unknown {
  const stack = [source];
  const seen = new Set<unknown>();

  while (stack.length) {
    const current = stack.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const value = (current as Record<string, unknown>)[key];
        if (value !== undefined && value !== null && value !== "") return value;
      }
    }

    for (const value of Object.values(current as Record<string, unknown>)) {
      if (value && typeof value === "object") stack.push(value);
    }
  }

  return undefined;
}

function toIntegerAmount(value: number): number {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer for Zarinpal.");
  }
  return amount;
}


function toZarinpalApiAmount(value: number, currency: string): number {
  const amount = toIntegerAmount(value);
  // zarinpal-node-sdk payment request does not expose a currency field on
  // payments.create; it sends amount directly to /pg/v4/payment/request.json.
  // Keep the API amount in Rial. If a caller/admin works in Toman, convert to Rial.
  return String(currency || "IRR").toUpperCase() === "IRT" ? amount * 10 : amount;
}

function getGatewayErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const anyError = error as any;
  const responseData = anyError?.response?.data;
  const data = responseData?.data ?? responseData;
  const errors = responseData?.errors ?? data?.errors;
  const message =
    data?.message ||
    responseData?.message ||
    (Array.isArray(errors) ? errors.join(", ") : undefined) ||
    errors?.message ||
    anyError?.message;

  const status = anyError?.response?.status;
  const prefix = status ? `Zarinpal request failed with status ${status}` : fallback;
  return message ? `${prefix}: ${message}` : prefix;
}

async function resolveRedirectUrl(client: any, authority: string): Promise<string> {
  const candidate =
    (typeof client?.payments?.getRedirectUrl === "function" ? client.payments.getRedirectUrl(authority) : undefined) ||
    (typeof client?.getRedirectUrl === "function" ? client.getRedirectUrl(authority) : undefined);

  const resolved = candidate instanceof Promise ? await candidate : candidate;
  if (typeof resolved === "string" && resolved.trim()) return resolved.trim();

  return `https://www.zarinpal.com/pg/StartPay/${authority}`;
}

export const zarinpalPaymentProvider: PaymentProvider = {
  code: "zarinpal",

  async initiate(input: PaymentInitiationRequest, runtime?: PaymentGatewayRuntimeConfig): Promise<PaymentInitiationResult> {
    const config = getZarinPalConfig(runtime);
    const client = await createZarinPalClient(config);
    const apiAmount = toZarinpalApiAmount(input.payment.amount, input.payment.currency || config.currency);
    const minimumApiAmount = toZarinpalApiAmount(config.minimumAmount, config.currency);

    if (apiAmount < minimumApiAmount) {
      throw new Error(`Zarinpal minimum payment amount is ${config.minimumAmount} ${config.currency}.`);
    }

    const requestPayload = {
      amount: apiAmount,
      callback_url: input.callbackUrl,
      description: input.payment.description,
      mobile: input.payment.customer?.mobile || undefined,
      email: input.payment.customer?.email || undefined,
    };

    let response: unknown;
    try {
      response = await client.payments.create(requestPayload);
    } catch (error) {
      throw new Error(getGatewayErrorMessage(error, "Unable to create Zarinpal payment request"));
    }
    const authority = String(getDeepValue(response, ["authority", "Authority"]) || "").trim();

    if (!authority) {
      throw new Error("Zarinpal did not return an authority for this payment request.");
    }

    const redirectUrl = await resolveRedirectUrl(client, authority);

    return {
      paymentId: input.payment.paymentId,
      bookingId: input.payment.bookingId,
      gateway: "zarinpal",
      status: "requires_action",
      redirectUrl,
      authority,
      amount: apiAmount,
      currency: "IRR",
      raw: {
        request: requestPayload,
        response,
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
    const client = await createZarinPalClient(config);
    const apiAmount = toZarinpalApiAmount(input.amount, input.currency || config.currency);
    let response: unknown;
    try {
      response = await client.verifications.verify({
        amount: apiAmount,
        authority: input.authority,
      });
    } catch (error) {
      return {
        success: false,
        code: "VERIFY_REQUEST_FAILED",
        message: getGatewayErrorMessage(error, "Unable to verify Zarinpal payment"),
        raw: error,
      };
    }

    const code = getDeepValue(response, ["code", "Code"]);
    const numericCode = Number(code);
    const success = numericCode === 100 || numericCode === 101;

    return {
      success,
      alreadyVerified: numericCode === 101,
      referenceId: (getDeepValue(response, ["ref_id", "refId", "reference_id", "referenceId"]) as string | number | undefined) ?? null,
      cardPan: (getDeepValue(response, ["card_pan", "cardPan"]) as string | undefined) ?? null,
      fee: (getDeepValue(response, ["fee"]) as string | number | undefined) ?? null,
      code: code as string | number | null,
      message: (getDeepValue(response, ["message", "Message"]) as string | undefined) ?? null,
      raw: response,
    };
  },
};
