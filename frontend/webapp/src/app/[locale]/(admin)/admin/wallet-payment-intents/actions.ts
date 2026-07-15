"use server";

import { revalidatePath } from "next/cache";
import db from "@/config/database/db";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

/**
 * Enforce that the caller is an admin and return their user id. Server actions are
 * public POST endpoints and the middleware only gates the admin area by URL, so a
 * non-admin could otherwise invoke these money-crediting actions directly (e.g.
 * self-approve their own pending crypto top-up). This is the authorization boundary
 * for wallet approval — do NOT weaken it.
 */
async function assertAdminUserId(): Promise<string> {
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id;
  const roles = session?.user?.roles;
  const isAdmin = roles?.includes(UserRole.Admin) || roles?.includes(UserRole.SuperAdmin);
  if (!userId || !isAdmin) {
    throw new Error("Not authorized: admin role required.");
  }
  return userId;
}

function jsonb(value: unknown) {
  return JSON.stringify(value ?? {});
}

function decimalFromForm(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function completeWalletIntent(
  intentId: string,
  amountOverride?: number | null,
  approvedByUserId?: string | null
) {
  await db.begin(async (tx) => {
    const [intent] = await tx<any[]>`
      select
        id,
        wallet_account_id,
        user_id,
        booking_id,
        intent_type,
        payment_method,
        gateway_name,
        currency_code,
        amount,
        status,
        metadata
      from customer.wallet_payment_intents
      where id = ${intentId}::uuid
      limit 1
      for update
    `;

    if (!intent) throw new Error("Wallet payment intent not found.");
    if (String(intent.status).toLowerCase() === "succeeded") return;

    const amount = amountOverride && amountOverride > 0 ? amountOverride : Number(intent.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Wallet top-up amount is invalid.");

    await tx`
      update customer.wallet_payment_intents
         set status = 'succeeded',
             metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
               adminConfirmed: true,
               adminConfirmedAt: new Date().toISOString(),
               amountConfirmed: amount,
               approvedByUserId: approvedByUserId ?? null,
             })}::jsonb,
             last_modified_date = now()
       where id = ${intent.id}
    `;

    const [existingTransaction] = await tx<any[]>`
      select id
      from customer.wallet_transactions
      where payment_intent_id = ${intent.id}
        and transaction_type = 'topup'
      order by create_date desc
      limit 1
      for update
    `;

    if (existingTransaction) {
      await tx`
        update customer.wallet_transactions
           set status = 'completed',
               amount = ${Math.abs(amount)},
               currency_code = ${intent.currency_code},
               subtitle = 'Confirmed by admin',
               metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
                 adminConfirmedAt: new Date().toISOString(),
                 approvedByUserId: approvedByUserId ?? null,
               })}::jsonb,
               last_modified_date = now()
         where id = ${existingTransaction.id}
      `;
    } else {
      await tx`
        insert into customer.wallet_transactions (
          wallet_account_id,
          user_id,
          booking_id,
          payment_intent_id,
          transaction_type,
          direction,
          status,
          payment_method,
          title,
          subtitle,
          currency_code,
          amount,
          metadata
        ) values (
          ${intent.wallet_account_id},
          ${intent.user_id},
          ${intent.booking_id},
          ${intent.id},
          'topup',
          'credit',
          'completed',
          ${intent.payment_method},
          'Wallet Top-up',
          'Confirmed by admin',
          ${intent.currency_code},
          ${Math.abs(amount)},
          ${jsonb({ source: 'admin-confirmed-topup', intentId: intent.id })}::jsonb
        )
      `;
    }
  });
}

export async function approveWalletPaymentIntentAction(formData: FormData) {
  const approvedByUserId = await assertAdminUserId();
  const intentId = String(formData.get("intentId") || "").trim();
  if (!intentId) throw new Error("intentId is required.");
  await completeWalletIntent(intentId, decimalFromForm(formData.get("amount")), approvedByUserId);
  revalidatePath("/admin/wallet-payment-intents");
  revalidatePath("/admin/wallet-transactions");
}

export async function rejectWalletPaymentIntentAction(formData: FormData) {
  const rejectedByUserId = await assertAdminUserId();
  const intentId = String(formData.get("intentId") || "").trim();
  const reason = String(formData.get("reason") || "Rejected by admin").trim();
  if (!intentId) throw new Error("intentId is required.");

  await db.begin(async (tx) => {
    await tx`
      update customer.wallet_payment_intents
         set status = 'failed',
             metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
               adminRejected: true,
               adminRejectedAt: new Date().toISOString(),
               rejectedByUserId: rejectedByUserId ?? null,
               reason,
             })}::jsonb,
             last_modified_date = now()
       where id = ${intentId}::uuid
         and status in ('pending', 'requires_action', 'processing')
    `;

    await tx`
      update customer.wallet_transactions
         set status = 'cancelled',
             subtitle = ${reason},
             metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
               adminRejectedAt: new Date().toISOString(),
               rejectedByUserId: rejectedByUserId ?? null,
               reason,
             })}::jsonb,
             last_modified_date = now()
       where payment_intent_id = ${intentId}::uuid
         and status in ('pending', 'processing')
    `;
  });

  revalidatePath("/admin/wallet-payment-intents");
  revalidatePath("/admin/wallet-transactions");
}
