"use server";

import { revalidatePath } from "next/cache";

import {
  approveDepositRequest,
  rejectDepositRequest,
} from "@/accounting/server/deposit.service";
import {
  approveWithdrawal,
  markWithdrawalPaid,
  releaseWithdrawal,
} from "@/accounting/server/withdrawal.service";
import { assertAccounting } from "@/accounting/server/access";

/**
 * Money-moving admin actions.
 *
 * Every export of a `"use server"` module is a public POST endpoint reachable by action
 * id, not by URL — the admin URL guard in middleware does nothing for them.
 * assertAccounting("operate") on the first line of each is the authorization boundary,
 * and it is the reason a customer cannot approve their own deposit. Do not remove it.
 */

function requiredString(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`${field} is required.`);
  return value;
}

function optionalAmount(formData: FormData, field: string): string | undefined {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return undefined;
  // Validated as a plain decimal, then passed on as text — parsing it into a JS number
  // here would round an 18-decimal amount before it ever reached the ledger.
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("The amount must be a positive decimal number.");
  }
  return raw;
}

function revalidateAccounting() {
  revalidatePath("/admin/accounting");
  revalidatePath("/admin/accounting/deposits");
  revalidatePath("/admin/accounting/withdrawals");
  revalidatePath("/admin/accounting/journal");
}

export async function approveDepositAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await approveDepositRequest({
    depositRequestId: requiredString(formData, "depositRequestId"),
    actorUserId: userId,
    confirmedAmount: optionalAmount(formData, "confirmedAmount"),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });

  revalidateAccounting();
}

export async function rejectDepositAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await rejectDepositRequest({
    depositRequestId: requiredString(formData, "depositRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Rejected by admin",
  });

  revalidateAccounting();
}

export async function approveWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await approveWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    note: String(formData.get("note") ?? "").trim() || undefined,
  });

  revalidateAccounting();
}

export async function rejectWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await releaseWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Rejected by admin",
    outcome: "rejected",
  });

  revalidateAccounting();
}

/**
 * Records that the payout actually left. Separate from approval on purpose: approving is
 * a decision, paying is a fact, and the fact needs the bank or chain reference that
 * proves it.
 */
export async function markWithdrawalPaidAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await markWithdrawalPaid({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    payoutReference: requiredString(formData, "payoutReference"),
  });

  revalidateAccounting();
}

export async function failWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await releaseWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Payout failed",
    outcome: "failed",
  });

  revalidateAccounting();
}
