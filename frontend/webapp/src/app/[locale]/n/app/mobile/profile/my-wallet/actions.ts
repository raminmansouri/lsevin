"use server";

import { revalidatePath } from "next/cache";

// import { getCurrentUserIdOrThrow } from "./auth";
// import { walletPaymentGateway } from "./payment-gateway";
import {
  createWalletSqlClient,
  ensureWalletAccount,
  getWalletHistoryPageData,
  getWalletPageData,
  getWalletTransactionDetail,
  insertTopUpIntentAndMaybePendingTransaction,
} from "./queries";
import type {
  CreateTopUpIntentInput,
  CreateTopUpIntentResult,
  WalletHistoryPageData,
  WalletPageData,
  WalletTransactionDetailData,
} from "./types";
import { getCurrentUserIdOrThrow } from "../wallet/auth";
import { walletPaymentGateway } from "../wallet/payment-gateway";

function assertValidTopUpInput(input: CreateTopUpIntentInput) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Top-up amount must be greater than zero.");
  }

  if (input.amount > 100000) {
    throw new Error("Top-up amount is too large.");
  }

  if (!["USD", "EUR", "GBP", "AED"].includes(input.currencyCode)) {
    throw new Error("Unsupported wallet currency.");
  }

  if (!["card", "bank", "apple"].includes(input.paymentMethod)) {
    throw new Error("Unsupported payment method.");
  }
}

export async function getWalletPageDataAction(): Promise<WalletPageData> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createWalletSqlClient();

  try {
    return await getWalletPageData(sql, userId);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function getWalletHistoryPageDataAction(): Promise<WalletHistoryPageData> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createWalletSqlClient();

  try {
    return await getWalletHistoryPageData(sql, userId);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function getWalletTransactionDetailAction(
  transactionId: string
): Promise<WalletTransactionDetailData | null> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createWalletSqlClient();

  try {
    return await getWalletTransactionDetail(sql, userId, transactionId);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function createWalletTopUpIntentAction(
  input: CreateTopUpIntentInput
): Promise<CreateTopUpIntentResult> {
  try {
    assertValidTopUpInput(input);

    const userId = await getCurrentUserIdOrThrow();
    const sql = createWalletSqlClient();

    try {
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
      revalidatePath("/app/wallet/history");

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
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create top-up intent.",
    };
  }
}
