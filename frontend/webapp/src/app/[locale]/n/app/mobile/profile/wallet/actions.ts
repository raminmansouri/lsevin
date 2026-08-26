"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserIdOrThrow } from "./auth";
import { listEnabledPaymentGatewayOptions } from "@/payment/server/payment-gateway.repository";
import { storeBugReportFiles } from "@/features/bug-reports/server/upload";
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

// Receipt image cap kept in line with the shared bug-reports upload pipeline.
const MAX_RECEIPT_BYTES = 15 * 1024 * 1024;

function assertValidTopUpAmount(amount: number, currencyRaw: string): string {
  const currencyCode = String(currencyRaw || "").trim().toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) {
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

  if (amount > (maxAmountByCurrency[currencyCode] ?? 100_000)) {
    throw new Error("Top-up amount is too large.");
  }

  return currencyCode;
}

function assertValidTopUpInput(input: CreateTopUpIntentInput) {
  assertValidTopUpAmount(input.amount, input.currencyCode);

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

/**
 * Crypto wallet top-up with a manual receipt. The receipt image travels as
 * multipart FormData (JSON server actions cannot carry a File). This NEVER
 * credits the wallet: it only inserts a pending intent + a pending
 * `status = 'pending'` credit transaction. The balance is credited later, when
 * an admin approves the intent (which flips the transaction to 'completed').
 */
export async function createWalletCryptoTopUpAction(
  formData: FormData
): Promise<CreateTopUpIntentResult> {
  try {
    const amount = Number(formData.get("amount"));
    const currencyCode = assertValidTopUpAmount(
      amount,
      String(formData.get("currencyCode") || "")
    );

    const network = String(formData.get("network") || "").trim().slice(0, 60) || null;
    const txHashRaw = String(formData.get("txHash") || "").trim();
    const txHash = txHashRaw ? txHashRaw.slice(0, 200) : null;

    const receipt = formData.get("receipt");
    if (!(receipt instanceof File) || receipt.size === 0) {
      throw new Error("A payment receipt image is required.");
    }
    const mimeType = receipt.type || "application/octet-stream";
    if (!mimeType.startsWith("image/")) {
      throw new Error("The receipt must be an image file.");
    }
    if (receipt.size > MAX_RECEIPT_BYTES) {
      throw new Error("The receipt image must be 15MB or smaller.");
    }

    const userId = await getCurrentUserIdOrThrow();

    // Reuse the proven bug-reports/media upload pipeline to store the receipt.
    const [attachment] = await storeBugReportFiles({
      files: [receipt],
      createdByUserId: userId,
    });

    if (!attachment?.fileUrl) {
      throw new Error("Unable to store the payment receipt.");
    }

    const cryptoMetadata = {
      source: "crypto" as const,
      topUpMethod: "crypto" as const,
      network,
      txHash,
      receipt: {
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName ?? null,
        mimeType: attachment.mimeType ?? null,
        fileSize: attachment.fileSize ?? null,
        mediaId: attachment.mediaId ?? null,
      },
    };

    const sql = createWalletSqlClient();

    const wallet = await ensureWalletAccount(sql, userId);

    await insertTopUpIntentAndMaybePendingTransaction(sql, {
      userId,
      walletAccountId: wallet.walletAccountId,
      input: {
        amount,
        currencyCode,
        paymentMethod: "crypto",
        txHash,
        network,
      },
      gateway: {
        gatewayName: "crypto-manual",
        gatewayReference: txHash,
        status: "pending",
        raw: cryptoMetadata,
      },
    });

    revalidatePath("/app/wallet");

    return {
      ok: true,
      status: "pending",
      message:
        "Crypto deposit submitted. It will be credited after admin approval.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to submit the crypto top-up.",
    };
  }
}
