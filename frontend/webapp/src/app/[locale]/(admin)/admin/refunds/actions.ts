"use server";

import { revalidatePath } from "next/cache";
import { approveRefundToWallet, rejectRefundRequest } from "@/features/refunds/server/repository";
import { assertAdmin } from "@/lib/auth/admin-guard";

function positiveNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function approveRefundToWalletAction(formData: FormData) {
  // Server actions are public POST endpoints — this one credited a caller-supplied
  // amount to a caller-supplied refund request with no session read at all, so anyone
  // could pay themselves out of the platform's wallet.
  await assertAdmin();

  const refundRequestId = String(formData.get("refundRequestId") || "").trim();
  if (!refundRequestId) throw new Error("refundRequestId is required.");

  await approveRefundToWallet({
    refundRequestId,
    amount: positiveNumber(formData.get("amount")),
    adminNote: String(formData.get("adminNote") || "").trim() || null,
  });

  revalidatePath("/admin/refunds");
  revalidatePath("/admin/wallet-transactions");
}

export async function rejectRefundRequestAction(formData: FormData) {
  await assertAdmin();

  const refundRequestId = String(formData.get("refundRequestId") || "").trim();
  if (!refundRequestId) throw new Error("refundRequestId is required.");

  await rejectRefundRequest({
    refundRequestId,
    adminNote: String(formData.get("adminNote") || "Rejected by admin").trim(),
  });

  revalidatePath("/admin/refunds");
}
