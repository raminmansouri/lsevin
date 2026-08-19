import "server-only";
import type { GatewayPaymentRequest, GatewayPaymentStartResult, GatewayVerificationRequest, GatewayVerificationResult } from "../types";
import { convertIranianGatewayAmount } from "../amount";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required IDPay environment variable: ${name}.`);
  return value;
}

function optionalEnv(name: string) {
  return process.env[name];
}

export async function startIDPayPayment(input: GatewayPaymentRequest): Promise<GatewayPaymentStartResult> {
  const apiKey = env("IDPAY_API_KEY");
  const createUrl = env("IDPAY_CREATE_URL");
  const body = {
    order_id: input.paymentIntentId,
    amount: convertIranianGatewayAmount(input.amount, input.currencyCode, process.env.IDPAY_AMOUNT_UNIT || "IRR"),
    name: input.metadata?.payerName,
    phone: input.payerMobile ?? undefined,
    mail: input.payerEmail ?? undefined,
    desc: input.description,
    callback: input.callbackUrl,
  };

  const response = await fetch(createUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": apiKey, "X-SANDBOX": process.env.IDPAY_SANDBOX === "true" ? "1" : "0" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, any>;
  const paymentId = json?.id;
  const link = json?.link;
  if (!response.ok || !paymentId || !link) {
    throw new Error(`IDPay payment request failed: ${JSON.stringify(json)}`);
  }
  return { gatewayReference: String(paymentId), redirectUrl: String(link), rawResponse: json };
}

export async function verifyIDPayPayment(input: GatewayVerificationRequest): Promise<GatewayVerificationResult> {
  const apiKey = env("IDPAY_API_KEY");
  const verifyUrl = env("IDPAY_VERIFY_URL");
  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": apiKey, "X-SANDBOX": process.env.IDPAY_SANDBOX === "true" ? "1" : "0" },
    body: JSON.stringify({ id: input.transactionId, order_id: input.paymentIntentId }),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, any>;
  const status = Number(json?.status ?? 0);
  const expectedAmount = convertIranianGatewayAmount(Number(input.amount), input.currencyCode || "IRR", process.env.IDPAY_AMOUNT_UNIT || "IRR");
  const returnedAmount = Number(json?.amount ?? json?.payment?.amount ?? expectedAmount);
  const returnedOrderId = String(json?.order?.id ?? json?.order_id ?? input.paymentIntentId ?? "");
  return {
    verified: response.ok && [100, 101, 200].includes(status) && returnedAmount === expectedAmount && returnedOrderId === input.paymentIntentId,
    gatewayReference: String(json?.track_id ?? input.transactionId ?? ""),
    verifiedAmount: returnedAmount,
    cardPan: json?.payment?.card_no ?? null,
    rawResponse: json,
  };
}

export function idPayCallbackUrl(intentId: string) {
  const explicit = optionalEnv("IDPAY_CALLBACK_URL");
  if (explicit) return `${explicit}${explicit.includes("?") ? "&" : "?"}intentId=${intentId}`;
  const appUrl = env("NEXT_PUBLIC_APP_URL");
  return `${appUrl.replace(/\/+$/, "")}/api/billing/idpay/callback?intentId=${intentId}`;
}
