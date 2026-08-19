import "server-only";
import type { GatewayPaymentRequest, GatewayPaymentStartResult, GatewayVerificationRequest, GatewayVerificationResult } from "../types";
import { convertIranianGatewayAmount } from "../amount";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required ZarinPal environment variable: ${name}.`);
  return value;
}

function optionalEnv(name: string) {
  return process.env[name];
}

function toZarinPalAmount(amount: number, currencyCode: string) {
  return convertIranianGatewayAmount(amount, currencyCode, process.env.ZARINPAL_AMOUNT_UNIT || "IRR");
}

export async function startZarinPalPayment(input: GatewayPaymentRequest): Promise<GatewayPaymentStartResult> {
  const merchantId = env("ZARINPAL_MERCHANT_ID");
  const requestUrl = env("ZARINPAL_REQUEST_URL");
  const startPayBaseUrl = env("ZARINPAL_STARTPAY_BASE_URL");

  const body = {
    merchant_id: merchantId,
    amount: toZarinPalAmount(input.amount, input.currencyCode),
    callback_url: input.callbackUrl,
    description: input.description,
    metadata: {
      email: input.payerEmail ?? undefined,
      mobile: input.payerMobile ?? undefined,
      paymentIntentId: input.paymentIntentId,
      invoiceId: input.invoiceId,
      ...(input.metadata ?? {}),
    },
  };

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, any>;
  const authority = json?.data?.authority || json?.authority;
  if (!response.ok || !authority) {
    throw new Error(`ZarinPal payment request failed: ${JSON.stringify(json)}`);
  }
  return {
    gatewayReference: String(authority),
    redirectUrl: `${startPayBaseUrl.replace(/\/+$/, "")}/${authority}`,
    rawResponse: json,
  };
}

export async function verifyZarinPalPayment(input: GatewayVerificationRequest): Promise<GatewayVerificationResult> {
  const merchantId = env("ZARINPAL_MERCHANT_ID");
  const verifyUrl = env("ZARINPAL_VERIFY_URL");
  const authority = input.authority;
  if (!authority) throw new Error("ZarinPal authority is required for verification.");
  if (input.status && input.status.toUpperCase() !== "OK") {
    return { verified: false, gatewayReference: authority, verifiedAmount: null, rawResponse: { callbackStatus: input.status } };
  }
  const gatewayAmount = toZarinPalAmount(Number(input.amount), input.currencyCode || "IRR");

  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ merchant_id: merchantId, amount: gatewayAmount, authority }),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, any>;
  const code = Number(json?.data?.code ?? json?.code ?? 0);
  return {
    verified: response.ok && [100, 101].includes(code),
    gatewayReference: String(json?.data?.ref_id ?? authority),
    verifiedAmount: gatewayAmount,
    cardPan: json?.data?.card_pan ?? null,
    rawResponse: json,
  };
}

export function zarinPalCallbackUrl(intentId: string) {
  const explicit = optionalEnv("ZARINPAL_CALLBACK_URL");
  if (explicit) return `${explicit}${explicit.includes("?") ? "&" : "?"}intentId=${intentId}`;
  const appUrl = env("NEXT_PUBLIC_APP_URL");
  return `${appUrl.replace(/\/+$/, "")}/api/billing/zarinpal/callback?intentId=${intentId}`;
}
