import "server-only";

import { getPaymentProvider } from "../providers";
import type {
  InitiateBookingPaymentInput,
  InitiateBookingPaymentOutput,
  PaymentGatewayCode,
  VerifyGatewayPaymentInput,
  VerifyGatewayPaymentOutput,
} from "../types";
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
  if (gateway !== "zarinpal") {
    throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
  return gateway;
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

function buildCallbackUrl(gateway: PaymentGatewayCode, locale?: string | null): string {
  const safeLocale = String(locale || "en").trim() || "en";
  return `${getAppBaseUrl()}/${safeLocale}/api/payments/${gateway}/callback`;
}

function renderDescription(template: string | null | undefined, values: Record<string, string | null | undefined>) {
  const fallback = "LSevin booking {{bookingId}}";
  return String(template || fallback).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
    return values[key] || "";
  });
}

export async function initiateBookingPayment(input: InitiateBookingPaymentInput & { userId: string; locale?: string | null }): Promise<InitiateBookingPaymentOutput> {
  const gateway = normalizeGateway(input.gateway);
  const gatewayConfig = await getEnabledPaymentGatewayConfig({ code: gateway });
  const provider = getPaymentProvider(gateway);

  const payment = await prepareBookingPaymentAttempt({
    bookingId: input.bookingId,
    userId: input.userId,
    gateway,
    locale: input.locale,
    targetCurrency: getGatewayCurrency(gatewayConfig.settings),
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
        locale: input.locale || "en",
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
