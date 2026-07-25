import "server-only";

import { getPaymentProvider } from "../providers";
import type {
  InitiateBookingPaymentInput,
  InitiateBookingPaymentOutput,
  PaymentGatewayCode,
  VerifyGatewayPaymentInput,
  VerifyGatewayPaymentOutput,
} from "../types";
import { gatewayForRegion, isGatewayAllowedForRegion, resolveUserPaymentRegion } from "./gateway-eligibility";
import { getEnabledPaymentGatewayConfig, getPaymentGatewayConfig } from "./payment-gateway.repository";
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

function getAppBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return String(configured || "http://localhost:3000").replace(/\/$/, "");
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

  // An omitted gateway is not an error — the region decides. Only an explicit
  // request for the wrong rail is rejected.
  if (input.gateway && !isGatewayAllowedForRegion(normalizeGateway(input.gateway), region)) {
    throw new Error(
      region === "iran"
        ? "Crypto payment is not available for Iranian accounts. Please pay with Zarinpal."
        : "Zarinpal is only available for Iranian accounts. Please pay with crypto."
    );
  }

  const gateway = gatewayForRegion(region);
  const gatewayConfig = await getEnabledPaymentGatewayConfig({ code: gateway });
  const provider = getPaymentProvider(gateway);

  const targetCurrency =
    gateway === "btcpay"
      ? getCryptoInvoiceCurrency(gatewayConfig.settings)
      : getGatewayCurrency(gatewayConfig.settings);

  const payment = await prepareBookingPaymentAttempt({
    bookingId: input.bookingId,
    userId: input.userId,
    gateway,
    locale: input.locale,
    targetCurrency,
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
    await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: "Gateway returned a cancelled or failed status.",
      payload: { status: input.status, authority },
    });

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
    await markPaymentFailed({
      paymentId: payment.paymentId,
      reason: verification.message || `Payment verification failed with code ${verification.code ?? "unknown"}.`,
      payload: verification.raw,
    });

    return {
      bookingId: payment.bookingId,
      paymentId: payment.paymentId,
      status: "failed",
      message: verification.message || "Payment verification failed.",
    };
  }

  await markGatewayPaymentVerified({ payment, verification });

  return {
    bookingId: payment.bookingId,
    paymentId: payment.paymentId,
    status: "succeeded",
    referenceId: verification.referenceId,
    message: verification.alreadyVerified ? "Payment was already verified." : "Payment verified successfully.",
  };
}
