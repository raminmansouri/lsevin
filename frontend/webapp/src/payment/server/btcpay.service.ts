import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getPaymentProvider } from "../providers";
import type { GatewayPaymentStatus } from "../types";
import { getPaymentGatewayConfig } from "./payment-gateway.repository";
import {
  getGatewayPaymentByAuthority,
  markGatewayPaymentVerified,
  markPaymentFailed,
} from "./payment.repository";

const ALREADY_SETTLED = ["succeeded", "paid", "captured", "completed"];

export type SettleBtcPayResult = {
  status: GatewayPaymentStatus;
  bookingId?: string;
  paymentId?: string;
  referenceId?: string | number | null;
  message?: string;
};

/**
 * Settle a BTCPay payment from an invoice id — the shared path for BOTH the
 * webhook (source of truth) and the browser return handler.
 *
 * Crucially this is *settle-only*: a not-yet-settled invoice returns "pending"
 * and is NOT marked failed. Only invoices BTCPay reports as dead
 * (expired/invalid) transition the attempt to Failed. This prevents an
 * impatient customer who returns before confirmation from cancelling a payment
 * that is still on its way. Re-crediting is guarded by markGatewayPaymentVerified.
 */
export async function settleBtcPayPayment(input: { invoiceId: string }): Promise<SettleBtcPayResult> {
  const invoiceId = String(input.invoiceId || "").trim();
  if (!invoiceId) return { status: "failed", message: "BTCPay invoice id is missing." };

  const payment = await getGatewayPaymentByAuthority({ gateway: "btcpay", authority: invoiceId });
  if (!payment) {
    return { status: "failed", message: "No matching payment attempt was found for this invoice." };
  }

  if (ALREADY_SETTLED.includes(String(payment.status || "").trim().toLowerCase())) {
    return {
      status: "succeeded",
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      message: "Payment was already settled.",
    };
  }

  const gatewayConfig = await getPaymentGatewayConfig({ code: "btcpay", includeSecrets: true });
  if (!gatewayConfig) {
    return {
      status: "pending",
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      message: "BTCPay gateway is not configured.",
    };
  }

  const provider = getPaymentProvider("btcpay");
  const verification = await provider.verify(
    { authority: invoiceId, status: null, amount: Number(payment.amount || 0), currency: payment.currency },
    gatewayConfig
  );

  if (verification.success) {
    await markGatewayPaymentVerified({ payment, verification });
    return {
      status: "succeeded",
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      referenceId: verification.referenceId,
      message: "Payment settled.",
    };
  }

  const dead = Boolean((verification.raw as { dead?: boolean } | null | undefined)?.dead);
  if (dead) {
    await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: verification.message || "BTCPay invoice expired or was invalidated.",
      payload: verification.raw,
    });
    return {
      status: "failed",
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      message: verification.message || "The invoice expired before it was paid.",
    };
  }

  // New / Processing — settlement still pending. Leave the attempt untouched.
  return {
    status: "pending",
    bookingId: payment.bookingId,
    paymentId: payment.paymentId,
    message: verification.message || "Payment is pending confirmation.",
  };
}

/**
 * The shared webhook secret, env first so the hot path stays a single string
 * read on an unauthenticated endpoint. Only when env is unset do we pay for a
 * DB round-trip to honour a secret an admin typed into the gateway settings —
 * without this the settings field would be silently ignored.
 */
export async function resolveBtcPayWebhookSecret(): Promise<string> {
  const fromEnv = String(process.env.BTCPAY_WEBHOOK_SECRET || "").trim();
  if (fromEnv) return fromEnv;

  const gatewayConfig = await getPaymentGatewayConfig({ code: "btcpay", includeSecrets: true });
  return String(gatewayConfig?.settings?.webhookSecret || "").trim();
}

/**
 * Verify BTCPay's `BTCPay-Sig: sha256=<hex>` header against the raw request body
 * using the shared webhook secret. Timing-safe. Returns false on any mismatch,
 * missing header, or unconfigured secret.
 */
export function verifyBtcPayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!secret) return false;

  const header = String(signatureHeader || "").trim();
  const provided = header.toLowerCase().startsWith("sha256=") ? header.slice(7).trim() : header;
  if (!provided) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  let expectedBuf: Buffer;
  let providedBuf: Buffer;
  try {
    expectedBuf = Buffer.from(expected, "hex");
    providedBuf = Buffer.from(provided, "hex");
  } catch {
    return false;
  }

  if (expectedBuf.length !== providedBuf.length || expectedBuf.length === 0) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
