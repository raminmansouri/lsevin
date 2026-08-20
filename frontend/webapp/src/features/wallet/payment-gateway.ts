import sharedSql from "@/config/database/db";

import { getPaymentProvider } from "@/payment/providers";
import { getEnabledPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import type { PaymentGatewayCode } from "@/payment/types";
import type {
  CreateTopUpIntentInput,
} from "./types";

export interface WalletGatewayCreateIntentInput extends CreateTopUpIntentInput {
  intentId: string;
  userId: string;
  locale?: string | null;
}

export interface WalletPaymentGateway {
  createTopUpIntent(
    input: WalletGatewayCreateIntentInput
  ): Promise<{
    gatewayName: string;
    gatewayReference?: string | null;
    redirectUrl?: string | null;
    clientSecret?: string | null;
    status: "pending" | "requires_action" | "processing";
    raw?: unknown;
  }>;
}

function normalizeGateway(value?: string | null): PaymentGatewayCode {
  const gateway = String(value || "").trim().toLowerCase();
  if (gateway !== "zarinpal") {
    throw new Error("Unsupported online payment gateway.");
  }

  return gateway as PaymentGatewayCode;
}

function normalizeCurrency(value: string): string {
  return String(value || "USD").trim().toUpperCase();
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

function buildWalletCallbackUrl(gateway: PaymentGatewayCode, locale?: string | null) {
  const safeLocale = String(locale || "fa").trim() || "fa";
  return `${getAppBaseUrl()}/${safeLocale}/api/wallet/payments/${gateway}/callback`;
}

function getGatewayCurrency(settings?: { currency?: string | null }): "IRR" | "IRT" {
  const currency = String(settings?.currency || process.env.ZARINPAL_CURRENCY || "IRR").trim().toUpperCase();
  return currency === "IRT" ? "IRT" : "IRR";
}

// This used to build a fresh `postgres()` client per call and nothing ever
// `.end()`ed it, so every wallet top-up leaked a pool. The shared client in
// @/config/database/db is the single pool for the process and already reads
// DATABASE_URL — which points at PgBouncer in production.
function createSqlClient() {
  return sharedSql;
}

async function convertAmount(input: {
  amount: number;
  sourceCurrency: string;
  targetCurrency: "IRR" | "IRT";
}) {
  const sourceCurrency = normalizeCurrency(input.sourceCurrency);
  const targetCurrency = normalizeCurrency(input.targetCurrency) as "IRR" | "IRT";

  if (sourceCurrency === targetCurrency) {
    return {
      walletAmount: input.amount,
      walletCurrency: sourceCurrency,
      gatewayAmount: Math.round(input.amount),
      gatewayCurrency: targetCurrency,
      exchangeRate: 1,
      ratePath: [sourceCurrency, targetCurrency],
    };
  }

  if (sourceCurrency === "IRT" && targetCurrency === "IRR") {
    return {
      walletAmount: input.amount,
      walletCurrency: sourceCurrency,
      gatewayAmount: Math.round(input.amount * 10),
      gatewayCurrency: targetCurrency,
      exchangeRate: 10,
      ratePath: ["IRT", "IRR"],
    };
  }

  if (sourceCurrency === "IRR" && targetCurrency === "IRT") {
    return {
      walletAmount: input.amount,
      walletCurrency: sourceCurrency,
      gatewayAmount: Math.round(input.amount / 10),
      gatewayCurrency: targetCurrency,
      exchangeRate: 0.1,
      ratePath: ["IRR", "IRT"],
    };
  }

  const sql = createSqlClient();

  try {
    const [conversion] = await sql<{
      targetAmount: string;
      appliedRate: string | null;
      ratePath: string[] | null;
    }[]>`
      select
        target_amount::text as "targetAmount",
        applied_rate::text as "appliedRate",
        rate_path as "ratePath"
      from finance.convert_money(${input.amount}, ${sourceCurrency}, ${targetCurrency}, 'standard')
      limit 1
    `;

    if (!conversion) {
      throw new Error(`No exchange rate found from ${sourceCurrency} to ${targetCurrency}. Add it in Finance → Exchange Rates before enabling Zarinpal for this currency.`);
    }

    const gatewayAmount = Math.round(Number(conversion.targetAmount));
    if (!Number.isFinite(gatewayAmount) || gatewayAmount <= 0) {
      throw new Error("Converted wallet top-up amount is not valid.");
    }

    return {
      walletAmount: input.amount,
      walletCurrency: sourceCurrency,
      gatewayAmount,
      gatewayCurrency: targetCurrency,
      exchangeRate: Number(conversion.appliedRate || 0),
      ratePath: conversion.ratePath || [sourceCurrency, targetCurrency],
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

class ProductionWalletPaymentGateway implements WalletPaymentGateway {
  async createTopUpIntent(input: WalletGatewayCreateIntentInput) {
    if (input.paymentMethod === "bank") {
      return {
        gatewayName: "manual-bank-transfer",
        gatewayReference: input.intentId,
        status: "pending" as const,
        raw: {
          source: "wallet-topup",
          paymentMethod: "bank",
        },
      };
    }

    if (input.paymentMethod !== "card") {
      throw new Error("This wallet top-up payment method is not implemented yet.");
    }

    const gateway = normalizeGateway(input.gateway);
    const gatewayConfig = await getEnabledPaymentGatewayConfig({ code: gateway });
    const provider = getPaymentProvider(gateway);
    const gatewayCurrency = getGatewayCurrency(gatewayConfig.settings);
    const converted = await convertAmount({
      amount: input.amount,
      sourceCurrency: input.currencyCode,
      targetCurrency: gatewayCurrency,
    });

    const result = await provider.initiate(
      {
        payment: {
          paymentId: input.intentId,
          bookingId: input.intentId,
          userId: input.userId,
          amount: converted.gatewayAmount,
          currency: converted.gatewayCurrency,
          sourceAmount: converted.walletAmount,
          sourceCurrency: converted.walletCurrency,
          exchangeRate: converted.exchangeRate,
          description: `LSevin wallet top-up ${input.intentId}`,
          metadata: {
            paymentTarget: "wallet_topup",
          },
        },
        locale: input.locale || "fa",
        callbackUrl: buildWalletCallbackUrl(gateway, input.locale),
      },
      gatewayConfig
    );

    return {
      gatewayName: gateway,
      gatewayReference: result.authority || null,
      redirectUrl: result.redirectUrl,
      status: "requires_action" as const,
      raw: {
        source: "wallet-topup",
        gateway,
        walletAmount: converted.walletAmount,
        walletCurrency: converted.walletCurrency,
        gatewayAmount: converted.gatewayAmount,
        gatewayCurrency: converted.gatewayCurrency,
        exchangeRate: converted.exchangeRate,
        ratePath: converted.ratePath,
        provider: result.raw,
      },
    };
  }
}

export const walletPaymentGateway: WalletPaymentGateway =
  new ProductionWalletPaymentGateway();
