import "server-only";
import { BTCPAY_PASS_THROUGH_CURRENCIES } from "@/payment/gateway-currencies";

import { seoOrigin } from "@/lib/seo/origin";
import { notifyBookingPaymentResult } from "@/features/notification/server/booking-notifications";
import { getPaymentProvider } from "../providers";
import type {
  InitiateBookingPaymentInput,
  InitiateBookingPaymentOutput,
  PaymentGatewayCode,
  VerifyGatewayPaymentInput,
  VerifyGatewayPaymentOutput,
} from "../types";
import { resolveUserPaymentRegion, selectEnabledGatewayForRegion } from "./gateway-eligibility";
import { getEnabledPaymentGatewayConfig, getPaymentGatewayConfig, listEnabledPaymentGatewayOptions } from "./payment-gateway.repository";
import {
  getGatewayPaymentByAuthority,
  markGatewayPaymentVerified,
  markPaymentFailed,
  markPaymentRequiresAction,
  prepareBookingPaymentAttempt,
} from "./payment.repository";

function normalizeGateway(value?: string | null): PaymentGatewayCode {
  const gateway = String(value || "zarinpal").trim().toLowerCase();
  if (gateway !== "zarinpal" && gateway !== "btcpay") {
    throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
  return gateway as PaymentGatewayCode;
}

/**
 * This used to read NEXT_PUBLIC_APP_URL/NEXT_PUBLIC_SITE_URL/APP_URL/NEXTAUTH_URL,
 * none of which are actually set in production (only NEXT_PUBLIC_URL and AUTH_URL
 * are) -- so it silently fell back to http://localhost:3000 and sent that as
 * Zarinpal's callback_url, mismatching the domain registered in the gateway and
 * triggering Shaparak's callback/Referrer domain check. seoOrigin() is the
 * project's single canonical app-origin source (already used by layout.tsx,
 * robots.ts, shop-payment.service.ts) and reads NEXT_PUBLIC_URL, which is set in
 * every environment this app runs in.
 */
function getAppBaseUrl(): string {
  return seoOrigin();
}

function getGatewayCurrency(settings?: { currency?: string | null }): "IRR" | "IRT" {
  const currency = String(settings?.currency || process.env.ZARINPAL_CURRENCY || "IRR").trim().toUpperCase();
  if (currency !== "IRR" && currency !== "IRT") return "IRR";
  return currency;
}

/**
 * Crypto gateways bill in a stable fiat unit; BTCPay converts to BTC/USDT at
 * checkout. Never IRR/IRT (no BTC<->IRR rate provider exists).
 */
function getCryptoInvoiceCurrency(settings?: { currency?: string | null }): string {
  const currency = String(settings?.currency || process.env.BTCPAY_INVOICE_CURRENCY || "USD").trim().toUpperCase();
  return currency || "USD";
}

function buildCallbackUrl(gateway: PaymentGatewayCode, locale?: string | null): string {
  const safeLocale = String(locale || "fa").trim() || "fa";
  return `${getAppBaseUrl()}/${safeLocale}/api/payments/${gateway}/callback`;
}

function renderDescription(template: string | null | undefined, values: Record<string, string | null | undefined>) {
  const fallback = "LSevin booking {{bookingId}}";
  return String(template || fallback).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
    return values[key] || "";
  });
}

export async function initiateBookingPayment(input: InitiateBookingPaymentInput & { userId: string; locale?: string | null }): Promise<InitiateBookingPaymentOutput> {
  // Region is enforced here, not only in the UI: this function is reachable with
  // a client-supplied gateway code, so hiding the option would not stop a
  // crafted request from routing an Iranian customer to crypto (or the reverse).
  const region = await resolveUserPaymentRegion(input.userId);

  const enabledGateways = await listEnabledPaymentGatewayOptions({ context: "booking_online_card" });
  const gateway = selectEnabledGatewayForRegion(enabledGateways, region);
  if (input.gateway && normalizeGateway(input.gateway) !== gateway) {
    throw new Error(`Payment gateway ${input.gateway} is not available for this payment.`);
  }
  const gatewayConfig = await getEnabledPaymentGatewayConfig({ code: gateway });
  const provider = getPaymentProvider(gateway);

  const targetCurrency =
    gateway === "btcpay"
      ? getCryptoInvoiceCurrency(gatewayConfig.settings)
      : getGatewayCurrency(gatewayConfig.settings);

  const payment = await prepareBookingPaymentAttempt({
    passThroughCurrencies: gateway === "btcpay" ? [...BTCPAY_PASS_THROUGH_CURRENCIES] : undefined,
    bookingId: input.bookingId,
    userId: input.userId,
    gateway,
    locale: input.locale,
    targetCurrency,
    maximumAmount: gateway === "zarinpal" ? (targetCurrency === "IRT" ? 100_000_000 : 1_000_000_000) : null,
  });

  payment.description = renderDescription(gatewayConfig.settings.descriptionTemplate, {
    bookingId: payment.bookingId,
    paymentId: payment.paymentId,
    providerName: String(payment.metadata?.providerName || ""),
    serviceName: String(payment.metadata?.serviceName || ""),
  });

  try {
    const result = await provider.initiate(
      {
        payment,
        locale: input.locale || "fa",
        callbackUrl: buildCallbackUrl(gateway, input.locale),
      },
      gatewayConfig
    );

    await markPaymentRequiresAction({
      paymentId: payment.paymentId,
      authority: result.authority || "",
      redirectUrl: result.redirectUrl,
      payload: result.raw,
    });

    return result;
  } catch (error) {
    await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: error instanceof Error ? error.message : "Payment request failed.",
    });
    throw error;
  }
}

export async function verifyGatewayPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentOutput> {
  const gateway = normalizeGateway(input.gateway);
  const authority = String(input.authority || "").trim();

  if (!authority) {
    return { status: "failed", message: "Payment authority is missing." };
  }

  const payment = await getGatewayPaymentByAuthority({ gateway, authority });
  if (!payment) {
    return { status: "failed", message: "No matching payment attempt was found for this authority." };
  }

  if (String(input.status || "").toUpperCase() !== "OK") {
    const { transitioned } = await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: "Gateway returned a cancelled or failed status.",
      payload: { status: input.status, authority },
    });

    if (transitioned && payment.userId) {
      notifyBookingPaymentResult({ bookingId: payment.bookingId, customerUserId: payment.userId, status: "failed" }).catch((error) =>
        console.error("verifyGatewayPayment: failure notification failed", error)
      );
    }

    return {
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      status: "cancelled",
      message: "The payment was cancelled or failed.",
    };
  }

  const gatewayConfig = await getPaymentGatewayConfig({ code: gateway, includeSecrets: true });
  if (!gatewayConfig) {
    return {
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      status: "failed",
      message: `Payment gateway ${gateway} is not configured.`,
    };
  }

  const provider = getPaymentProvider(gateway);
  const verification = await provider.verify(
    {
      authority,
      status: input.status,
      amount: Number(payment.amount || 0),
      currency: payment.currency,
    },
    gatewayConfig
  );

  if (!verification.success) {
    const { transitioned } = await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: verification.message || `Payment verification failed with code ${verification.code ?? "unknown"}.`,
      payload: verification.raw,
    });

    if (transitioned && payment.userId) {
      notifyBookingPaymentResult({ bookingId: payment.bookingId, customerUserId: payment.userId, status: "failed" }).catch((error) =>
        console.error("verifyGatewayPayment: failure notification failed", error)
      );
    }

    return {
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      status: "failed",
      message: verification.message || "Payment verification failed.",
    };
  }

  const { credited } = await markGatewayPaymentVerified({ payment, verification });

  if (credited && payment.userId) {
    notifyBookingPaymentResult({ bookingId: payment.bookingId, customerUserId: payment.userId, status: "succeeded" }).catch((error) =>
      console.error("verifyGatewayPayment: success notification failed", error)
    );
  }

  return {
    bookingId: payment.bookingId,
    paymentId: payment.paymentId,
    status: "succeeded",
    referenceId: verification.referenceId,
    message: verification.alreadyVerified ? "Payment was already verified." : "Payment verified successfully.",
  };
}
