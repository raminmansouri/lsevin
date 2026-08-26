"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserIdOrThrow } from "./auth";
import { listEnabledPaymentGatewayOptions } from "@/payment/server/payment-gateway.repository";
import { walletPaymentGateway } from "./payment-gateway";
import {
  createWalletSqlClient,
  ensureWalletAccount,
  getWalletPageData,
  insertTopUpIntentAndMaybePendingTransaction,
} from "./queries";
import type {
  CreateTopUpIntentInput,
  CreateTopUpIntentResult,
  WalletPageData,
} from "./types";

function assertValidTopUpInput(input: CreateTopUpIntentInput) {
  const currencyCode = String(input.currencyCode || "").trim().toUpperCase();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Top-up amount must be greater than zero.");
  }

  if (!["IRR", "IRT", "USD", "EUR", "GBP", "AED"].includes(currencyCode)) {
    throw new Error("Unsupported wallet currency.");
  }

  const maxAmountByCurrency: Record<string, number> = {
    IRR: 5_000_000_000,
    IRT: 500_000_000,
    USD: 100_000,
    EUR: 100_000,
    GBP: 100_000,
    AED: 500_000,
  };

  if (input.amount > (maxAmountByCurrency[currencyCode] ?? 100_000)) {
    throw new Error("Top-up amount is too large.");
  }

  if (!["card", "bank"].includes(input.paymentMethod)) {
    throw new Error("Unsupported payment method.");
  }

  if (input.paymentMethod === "card" && !input.gateway) {
    throw new Error("Select an online payment gateway.");
  }
}

export async function getWalletPageDataAction(): Promise<WalletPageData> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createWalletSqlClient();

  const data = await getWalletPageData(sql, userId);
  const paymentGateways = await listEnabledPaymentGatewayOptions({ context: "wallet_topup" });

  return {
    ...data,
    paymentGateways,
  };
}

export async function createWalletTopUpIntentAction(
  input: CreateTopUpIntentInput
): Promise<CreateTopUpIntentResult> {
  try {
    assertValidTopUpInput(input);

    const userId = await getCurrentUserIdOrThrow();
    const sql = createWalletSqlClient();

    const wallet = await ensureWalletAccount(sql, userId);

    const gateway = await walletPaymentGateway.createTopUpIntent({
      ...input,
      intentId: crypto.randomUUID(),
      userId,
    });

    await insertTopUpIntentAndMaybePendingTransaction(sql, {
      userId,
      walletAccountId: wallet.walletAccountId,
      input,
      gateway,
    });

    revalidatePath("/app/wallet");

    if (gateway.status === "pending") {
      return {
        ok: true,
        status: "pending",
        message:
          input.paymentMethod === "bank"
            ? "Bank transfer top-up created. Keep the UI flow and show bank instructions or proof upload in your next step."
            : "Payment intent created and is pending.",
      };
    }

    return {
      ok: true,
      status: gateway.status,
      redirectUrl: gateway.redirectUrl ?? null,
      clientSecret: gateway.clientSecret ?? null,
      message: "Continue with the payment provider.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create top-up intent.",
    };
  }
}
