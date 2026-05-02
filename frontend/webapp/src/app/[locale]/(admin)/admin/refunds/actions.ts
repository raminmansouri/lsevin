"use server";

import { revalidatePath } from "next/cache";
import { approveRefundToWallet, rejectRefundRequest } from "@/features/refunds/server/repository";

function positiveNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function approveRefundToWalletAction(formData: FormData) {
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
  const refundRequestId = String(formData.get("refundRequestId") || "").trim();
  if (!refundRequestId) throw new Error("refundRequestId is required.");

  await rejectRefundRequest({
    refundRequestId,
    adminNote: String(formData.get("adminNote") || "Rejected by admin").trim(),
  });

  revalidatePath("/admin/refunds");
}
