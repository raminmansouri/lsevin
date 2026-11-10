import "server-only";

import db from "@/config/database/db";
import { listPaymentMethodsForUser } from "@/features/booking-pro/server/payment-repository";
import { seoOrigin } from "@/lib/seo/origin";
import { btcpayBillsDirectlyIn } from "@/payment/gateway-currencies";
import { getPaymentProvider } from "@/payment/providers";
import { filterGatewaysForRegion, resolveUserPaymentRegion } from "@/payment/server/gateway-eligibility";
import {
  getEnabledPaymentGatewayConfig,
  getPaymentGatewayConfig,
  listEnabledPaymentGatewayOptions,
} from "@/payment/server/payment-gateway.repository";

import { notifyVideoSessionConfirmed } from "./video-payment";
import {
  attachPaymentAuthority,
  closeSessionPayment,
  createSessionPayment,
  extendPaymentHold,
  findPaymentByAuthority,
  getSessionForPayment,
  settleSessionPayment,
} from "./video-payment-repository";

/**
 * Paying for a video consultation priced in a foreign currency, with the same methods a
 * service booking offers this patient: shop.payment_methods filtered by the patient's region
 * (listPaymentMethodsForUser). Anything an admin adds there for international patients shows
 * up here too. Pay-in-place methods make no sense for a video call and are left out; the
 * wallet is left out until consultations are written to the accounting ledger.
 */
export const VIDEO_EXCLUDED_METHOD_CODES = ["pay_on_delivery", "cash_on_delivery", "wallet"] as const;

const ONLINE_METHOD_CODES = ["card", "gateway_card", "online_card", "crypto"];

export type ForeignPaymentError = "notFound" | "alreadyPaid" | "expired" | "paymentUnavailable";

function isTomanCurrency(currency: string) {
  const code = currency.toUpperCase();
  return code === "IRT" || code === "IRR";
}

/** The methods this patient may use for a consultation, as the booking checkout lists them. */
export async function videoPaymentMethodsFor(userId: string) {
  const methods = await listPaymentMethodsForUser(userId);
  return methods.filter((method) => !(VIDEO_EXCLUDED_METHOD_CODES as readonly string[]).includes(method.code));
}

/** Whether a manual method (one that moves no money online) may be used by this patient. */
export async function manualMethodAllowed(userId: string, methodCode: string): Promise<boolean> {
  const code = methodCode.trim().toLowerCase();
  if (!code || ONLINE_METHOD_CODES.includes(code)) return false;
  const methods = await videoPaymentMethodsFor(userId);
  return methods.some((method) => method.code === code);
}

async function toUsd(amount: number, currency: string): Promise<number> {
  const [row] = await db<{ amount: string }[]>`
    select target_amount::text as amount
    from finance.convert_money(${amount}, ${currency.toUpperCase()}, 'USD', 'standard')
    limit 1
  `;
  const converted = Number(row?.amount);
  if (!Number.isFinite(converted) || converted <= 0) {
    throw new Error(`No exchange rate from ${currency} to USD. Add it in Finance → Exchange Rates.`);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Sends a foreign patient to the online gateway their region is offered (BTCPay), the same
 * gateway a service booking uses. The slot's hold is extended first, as for the Iranian gateway.
 */
export async function startForeignVideoSessionPayment(input: {
  sessionId: string;
  userId: string;
  locale: string;
  methodCode: string;
}): Promise<{ redirectUrl: string } | { error: ForeignPaymentError }> {
  const session = await getSessionForPayment(input.userId, input.sessionId);
  if (!session) return { error: "notFound" };
  if (isTomanCurrency(session.priceCurrency)) return { error: "paymentUnavailable" };
  if (session.status !== "awaiting_payment") return { error: "alreadyPaid" };

  // The code arrives from the browser: it must be an online method this patient is offered.
  const requested = input.methodCode.trim().toLowerCase();
  const region = await resolveUserPaymentRegion(input.userId);
  const gateways = filterGatewaysForRegion(
    await listEnabledPaymentGatewayOptions({ context: "booking_online_card" }),
    region
  );
  const methods = await videoPaymentMethodsFor(input.userId);
  if (!methods.some((method) => method.code === "gateway_card")) return { error: "paymentUnavailable" };
  const gateway =
    gateways.find((item) => item.code.toLowerCase() === requested) ??
    (ONLINE_METHOD_CODES.includes(requested) ? gateways[0] : undefined);
  // Only BTCPay is wired for foreign currencies; Zarinpal charges Rial and serves Iranian patients.
  if (!gateway || gateway.code !== "btcpay") return { error: "paymentUnavailable" };

  if (session.expired || !(await extendPaymentHold(session.id))) return { error: "expired" };

  let gatewayConfig;
  try {
    gatewayConfig = await getEnabledPaymentGatewayConfig({ code: "btcpay" });
  } catch (error) {
    console.error("[consultation] BTCPay unavailable", error);
    return { error: "paymentUnavailable" };
  }

  const direct = btcpayBillsDirectlyIn(session.priceCurrency);
  const gatewayCurrency = direct ? session.priceCurrency.toUpperCase() : "USD";
  let gatewayAmount: number;
  try {
    gatewayAmount = direct ? session.priceAmount : await toUsd(session.priceAmount, session.priceCurrency);
  } catch (error) {
    console.error("[consultation] BTCPay amount conversion failed", error);
    return { error: "paymentUnavailable" };
  }

  const paymentId = await createSessionPayment({
    sessionId: session.id,
    userId: input.userId,
    gateway: "btcpay",
    amount: session.priceAmount,
    currency: session.priceCurrency,
    gatewayAmount,
    gatewayCurrency,
    raw: { stage: "created", methodCode: requested },
  });

  try {
    const result = await getPaymentProvider("btcpay").initiate(
      {
        payment: {
          paymentId,
          bookingId: session.id, // opaque reference field on the shared PaymentAttempt type
          userId: input.userId,
          amount: gatewayAmount,
          currency: gatewayCurrency,
          sourceAmount: session.priceAmount,
          sourceCurrency: session.priceCurrency,
          description: `LSevin video consultation ${session.id.slice(0, 8)}`,
          customer: { mobile: session.patientPhone, email: session.patientEmail },
          metadata: { kind: "video_consultation", sessionId: session.id },
        },
        locale: input.locale,
        // BTCPay only takes the origin from this; its return goes to /api/payments/btcpay/return,
        // which recognises a consultation payment id and settles it here.
        callbackUrl: `${seoOrigin()}/${input.locale}/api/consultation/payments/btcpay/callback`,
      },
      gatewayConfig
    );
    if (!result.authority) throw new Error("BTCPay returned no invoice id.");
    await attachPaymentAuthority(paymentId, result.authority);
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    console.error("[consultation] BTCPay initiation failed", error);
    await closeSessionPayment(paymentId, "failed", error instanceof Error ? error.message : "Initiation failed.");
    return { error: "paymentUnavailable" };
  }
}

export type VideoBtcPaySettlement = {
  sessionId: string;
  outcome: "paid" | "pending" | "failed" | "refund";
};

/**
 * Settles a consultation's BTCPay invoice, for both the webhook and the browser return.
 * Like the booking path it is settle-only: a not-yet-paid invoice stays pending, and only an
 * expired or invalid one fails. Returns null when the invoice is not a consultation's.
 */
export async function settleVideoSessionBtcPay(invoiceId: string, locale = "fa"): Promise<VideoBtcPaySettlement | null> {
  const payment = await findPaymentByAuthority("btcpay", invoiceId);
  if (!payment) return null;
  const sessionId = payment.sessionId;
  if (payment.status === "succeeded") return { sessionId, outcome: "paid" };
  if (payment.status === "needs_refund") return { sessionId, outcome: "refund" };
  if (payment.status !== "pending") return { sessionId, outcome: "failed" };

  const config = await getPaymentGatewayConfig({ code: "btcpay", includeSecrets: true });
  if (!config) return { sessionId, outcome: "pending" };
  const verification = await getPaymentProvider("btcpay").verify(
    { authority: invoiceId, status: null, amount: payment.gatewayAmount, currency: payment.gatewayCurrency },
    config
  );
  if (!verification.success) {
    const dead = Boolean((verification.raw as { dead?: boolean } | null | undefined)?.dead);
    if (!dead) return { sessionId, outcome: "pending" };
    await closeSessionPayment(payment.id, "failed", verification.message || "The invoice expired.", verification.raw);
    return { sessionId, outcome: "failed" };
  }

  const settled = await settleSessionPayment({
    paymentId: payment.id,
    referenceId: verification.referenceId != null ? String(verification.referenceId) : invoiceId,
    cardPan: null,
    raw: verification.raw ?? null,
  });
  if (settled === "needsRefund") {
    console.error(`[consultation] BTCPay payment ${payment.id} was taken but its slot was lost; refund it`);
    return { sessionId, outcome: "refund" };
  }
  if (settled === "confirmed") await notifyVideoSessionConfirmed(sessionId, locale);
  return { sessionId, outcome: "paid" };
}

/** The BTCPay invoice of a consultation payment, for the browser return that only knows our id. */
export async function findVideoBtcPayInvoice(paymentId: string): Promise<{ sessionId: string; invoiceId: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) return null;
  const rows = await db<{ sessionId: string; invoiceId: string | null }[]>`
    select session_id::text as "sessionId", authority as "invoiceId"
    from consultation.video_session_payments
    where id = ${paymentId}::uuid and gateway = 'btcpay'
  `;
  return rows[0] ?? null;
}
