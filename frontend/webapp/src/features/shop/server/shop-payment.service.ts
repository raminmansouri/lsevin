import "server-only";

import { getPaymentProvider } from "@/payment/providers";
import { getEnabledPaymentGatewayConfig, getPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import type { PaymentGatewayCode } from "@/payment/types";

import sql from "@/config/database/db";
import { getShopContext } from "../lib/context";
import { emitCommerceEvent } from "../lib/analytics";
import { notifyShopOrderEvent } from "./shop-notifications";
import {
  attachProviderReference,
  createPaymentTransaction,
  findTransactionByProviderRef,
  getOrderForPayment,
  markTransactionFailed,
  roundGatewayAmount,
  settlePaymentOnce,
} from "./shop-payment.repository";

/**
 * Shop payment integration. It does NOT introduce a second payment engine
 * (SHP-BASE-006, SHP-PAY-001/002): the gateway provider adapters, gateway config
 * and region rules are the platform's existing `@/payment` capability. This
 * module only maps a `shop.orders` row onto them and records attempts in
 * `shop.payment_transactions`.
 */

function getAppBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000";
  return String(configured).replace(/\/$/, "");
}

function callbackUrl(gateway: string, locale: string): string {
  return `${getAppBaseUrl()}/${locale || "fa"}/api/shop/payments/${gateway}/callback`;
}

function gatewayForPaymentCurrency(currency: string): PaymentGatewayCode {
  return ["IRR", "IRT"].includes(String(currency).toUpperCase()) ? "zarinpal" : "btcpay";
}

async function assertOrderBelongsToCaller(orderCustomerId: string | null, orderEmail: string): Promise<void> {
  const ctx = await getShopContext();
  if (ctx.customerId && orderCustomerId && ctx.customerId === orderCustomerId) return;
  if (!orderCustomerId) return; // guest order: possession of the order number + email flow guards it
  throw new Error("This order does not belong to your account.");
}

export type StartPaymentResult =
  | { mode: "redirect"; redirectUrl: string; transactionId: string; provider: string }
  | { mode: "manual"; transactionId: string; provider: string; instructionsKey: string; amount: number; currency: string }
  | { mode: "already_paid" };

/**
 * Begins payment for an order. `methodCode` selects between an online gateway
 * and the manual bank-transfer flow (SHP-V01-018).
 */
export async function startOrderPayment(input: {
  orderId: string;
  methodCode?: string | null;
  locale?: string | null;
}): Promise<StartPaymentResult> {
  const order = await getOrderForPayment(input.orderId);
  if (!order) throw new Error("Order not found.");
  await assertOrderBelongsToCaller(order.customerId, order.email);

  if (["captured", "refunded", "partially_refunded"].includes(order.paymentStatus) || ["paid", "processing", "shipped", "completed"].includes(order.status)) {
    return { mode: "already_paid" };
  }

  const method = await resolvePaymentMethod(input.methodCode);
  const locale = (input.locale || (await getShopContext()).locale || "fa").split("-")[0];

  await emitCommerceEvent("shop_checkout_started", { orderId: order.orderId, value: order.paymentTotal, currency: order.paymentCurrency });

  // --- manual / bank transfer -------------------------------------------------
  if (method.provider === "manual" || method.code === "bank_transfer") {
    const txnId = await createPaymentTransaction({
      orderId: order.orderId,
      paymentMethodId: method.id,
      provider: "manual",
      amount: order.paymentTotal,
      currency: order.paymentCurrency,
      type: "manual",
      requestPayload: { method: "bank_transfer" },
    });
    return {
      mode: "manual",
      transactionId: txnId,
      provider: "manual",
      instructionsKey: "bank_transfer",
      amount: roundGatewayAmount(order.paymentTotal, order.paymentCurrency),
      currency: order.paymentCurrency,
    };
  }

  // --- online gateway -------------------------------------------------------
  const gateway: PaymentGatewayCode =
    method.provider === "zarinpal" || method.provider === "btcpay"
      ? (method.provider as PaymentGatewayCode)
      : gatewayForPaymentCurrency(order.paymentCurrency);

  const gatewayConfig = await getEnabledPaymentGatewayConfig({ code: gateway });
  const provider = getPaymentProvider(gateway);

  const txnId = await createPaymentTransaction({
    orderId: order.orderId,
    paymentMethodId: method.id,
    provider: gateway,
    amount: order.paymentTotal,
    currency: order.paymentCurrency,
    type: "charge",
    requestPayload: { gateway },
  });

  try {
    const result = await provider.initiate(
      {
        payment: {
          paymentId: txnId,
          bookingId: order.orderId, // opaque reference field on the shared PaymentAttempt type
          userId: order.customerId ?? "00000000-0000-0000-0000-000000000000",
          amount: roundGatewayAmount(order.paymentTotal, order.paymentCurrency),
          currency: order.paymentCurrency,
          sourceAmount: order.grandTotal,
          sourceCurrency: order.currency,
          description: `LSevin order ${order.orderNumber}`,
          customer: { email: order.email || undefined },
          metadata: { orderNumber: order.orderNumber, kind: "shop_order" },
        },
        locale,
        callbackUrl: callbackUrl(gateway, locale),
      },
      gatewayConfig
    );

    await attachProviderReference({
      transactionId: txnId,
      providerTransactionId: result.authority || "",
      responsePayload: { stage: "initiated", redirectUrl: result.redirectUrl },
    });

    return { mode: "redirect", redirectUrl: result.redirectUrl, transactionId: txnId, provider: gateway };
  } catch (error) {
    await markTransactionFailed({
      transactionId: txnId,
      reason: error instanceof Error ? error.message : "Payment initiation failed.",
    });
    throw error;
  }
}

async function resolvePaymentMethod(code?: string | null): Promise<{ id: string; code: string; provider: string | null }> {
  const rows = await sql<any[]>`
    select id::text as id, code, provider from shop.payment_methods
    where is_active = true and (${code ?? null}::text is null or code = ${code ?? null})
    order by sort_order asc limit 1
  `;
  if (!rows[0]) throw new Error("No active payment method.");
  return rows[0];
}

export type VerifyPaymentResult = {
  orderNumber: string;
  orderId: string;
  status: "succeeded" | "failed" | "cancelled";
  message: string;
};

/**
 * Server-side verification of a gateway callback. Verification is
 * server-to-server via the provider adapter — a browser cannot forge success
 * (SHP-V01-019, SHP-PAY-005) — and settlement is idempotent (SHP-PAY-006).
 */
export async function verifyGatewayCallback(input: {
  gateway: string;
  authority: string;
  status?: string | null;
}): Promise<VerifyPaymentResult> {
  const gateway = String(input.gateway || "").toLowerCase();
  if (gateway !== "zarinpal" && gateway !== "btcpay") {
    return { orderNumber: "", orderId: "", status: "failed", message: "Unknown gateway." };
  }
  const authority = String(input.authority || "").trim();
  const txn = await findTransactionByProviderRef(gateway, authority);
  if (!txn) {
    return { orderNumber: "", orderId: "", status: "failed", message: "No matching payment attempt." };
  }

  if (String(input.status || "").toUpperCase() !== "OK") {
    await markTransactionFailed({ transactionId: txn.transactionId, reason: "Gateway reported a cancelled/failed status.", payload: { status: input.status } });
    await emitCommerceEvent("shop_payment_failed", { orderId: txn.orderId });
    await notifyShopOrderEvent({ orderId: txn.orderId, event: "order.payment_failed" });
    return { orderNumber: txn.orderNumber, orderId: txn.orderId, status: "cancelled", message: "Payment was cancelled." };
  }

  const gatewayConfig = await getPaymentGatewayConfig({ code: gateway as PaymentGatewayCode, includeSecrets: true });
  if (!gatewayConfig) {
    return { orderNumber: txn.orderNumber, orderId: txn.orderId, status: "failed", message: `Gateway ${gateway} is not configured.` };
  }

  const provider = getPaymentProvider(gateway as PaymentGatewayCode);
  const verification = await provider.verify(
    { authority, status: input.status, amount: Number(txn.amount || 0), currency: txn.currency },
    gatewayConfig
  );

  if (!verification.success) {
    await markTransactionFailed({ transactionId: txn.transactionId, reason: verification.message || "Verification failed.", payload: verification.raw });
    await emitCommerceEvent("shop_payment_failed", { orderId: txn.orderId });
    await notifyShopOrderEvent({ orderId: txn.orderId, event: "order.payment_failed" });
    return { orderNumber: txn.orderNumber, orderId: txn.orderId, status: "failed", message: verification.message || "Verification failed." };
  }

  const settled = await settlePaymentOnce({
    transactionId: txn.transactionId,
    orderId: txn.orderId,
    referenceId: verification.referenceId != null ? String(verification.referenceId) : null,
    verificationPayload: verification.raw ?? { code: verification.code },
    manualReview: false,
  });

  if (settled.applied) {
    await emitCommerceEvent("shop_payment_succeeded", { orderId: txn.orderId, value: Number(txn.amount), currency: txn.currency });
    await emitCommerceEvent("shop_purchase_completed", { orderId: txn.orderId, value: Number(txn.amount), currency: txn.currency });
    await notifyShopOrderEvent({ orderId: txn.orderId, event: "order.paid" });
  }

  return {
    orderNumber: txn.orderNumber,
    orderId: txn.orderId,
    status: "succeeded",
    message: verification.alreadyVerified || !settled.applied ? "Payment already verified." : "Payment verified.",
  };
}
