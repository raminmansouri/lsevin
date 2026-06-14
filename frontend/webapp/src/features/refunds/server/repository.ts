import "server-only";

import db from "@/config/database/db";

function jsonb(value: unknown) {
  return JSON.stringify(value ?? {});
}

function toPositiveAmount(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed * 100) / 100;
}

export async function requestBookingRefund(input: {
  bookingId: string;
  userId: string;
  reason: string;
  customerNote?: string | null;
  refundScope?: "full" | "partial";
}) {
  const [booking] = await db<any[]>`
    select id, user_id, coalesce(paid_amount, 0) as paid_amount, currency_code, payment_status
    from booking.bookings
    where id = ${input.bookingId}::uuid
      and user_id = ${input.userId}::uuid
    limit 1
  `;

  if (!booking) throw new Error("Booking not found.");
  if (Number(booking.paid_amount ?? 0) <= 0) throw new Error("This booking has no captured payment to refund.");

  const [existing] = await db<any[]>`
    select id, status
    from commercial.refund_requests
    where booking_id = ${input.bookingId}::uuid
      and status in ('requested', 'approved', 'processing')
    order by created_at desc
    limit 1
  `;

  if (existing) {
    return { refundRequestId: existing.id, status: existing.status, alreadyExists: true };
  }

  const [request] = await db<any[]>`
    insert into commercial.refund_requests (
      booking_id,
      requested_by_user_id,
      refund_scope,
      reason,
      customer_note,
      status
    ) values (
      ${input.bookingId}::uuid,
      ${input.userId}::uuid,
      ${input.refundScope ?? 'full'},
      ${input.reason || 'Customer requested refund'},
      ${input.customerNote ?? null},
      'requested'
    )
    returning id, status
  `;

  return { refundRequestId: request.id, status: request.status, alreadyExists: false };
}

export async function listAdminRefundRequests() {
  return db<any[]>`
    select
      rr.*,
      b.user_id,
      b.total_amount,
      b.paid_amount,
      b.currency_code,
      b.payment_status,
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name,
      u.email as customer_email,
      common.get_translation_t(sp.name_translations, 'en-US', 'en-US') as provider_name,
      common.get_translation_t(ps.display_name_translations, 'en-US', 'en-US') as service_name,
      coalesce((
        select sum(payment_refund_amount)
        from commercial.refund_lines rl
        where rl.booking_id = rr.booking_id
      ), 0) as already_refunded_amount
    from commercial.refund_requests rr
    join booking.bookings b on b.id = rr.booking_id
    left join identity.asp_net_users u on u.id = b.user_id
    left join category.service_providers sp on sp.id = b.provider_id
    left join category.provider_services ps on ps.id = b.service_id
    order by rr.created_at desc
    limit 300
  `;
}

async function ensureWalletAccount(tx: any, userId: string) {
  const [existing] = await tx<any[]>`
    select id, default_currency
    from customer.wallet_accounts
    where user_id = ${userId}::uuid
    limit 1
  `;

  if (existing) return existing.id;

  const [inserted] = await tx<any[]>`
    insert into customer.wallet_accounts (user_id)
    values (${userId}::uuid)
    returning id
  `;

  return inserted.id;
}

export async function approveRefundToWallet(input: {
  refundRequestId: string;
  amount?: number | null;
  adminNote?: string | null;
}) {
  await db.begin(async (tx) => {
    const [request] = await tx<any[]>`
      select
        rr.*,
        b.user_id,
        b.currency_code,
        b.payment_currency_code,
        b.settlement_currency_code,
        coalesce(b.paid_amount, 0) as paid_amount,
        coalesce((
          select sum(payment_refund_amount)
          from commercial.refund_lines rl
          where rl.booking_id = rr.booking_id
        ), 0) as already_refunded_amount
      from commercial.refund_requests rr
      join booking.bookings b on b.id = rr.booking_id
      where rr.id = ${input.refundRequestId}::uuid
      limit 1
      for update
    `;

    if (!request) throw new Error("Refund request not found.");
    if (!['requested', 'approved', 'processing', 'failed'].includes(String(request.status).toLowerCase())) {
      throw new Error(`Refund request cannot be approved from status ${request.status}.`);
    }

    const remaining = Math.max(0, Number(request.paid_amount ?? 0) - Number(request.already_refunded_amount ?? 0));
    const amount = toPositiveAmount(input.amount, remaining);
    if (amount <= 0 || amount > remaining) throw new Error("Refund amount is invalid or greater than remaining refundable amount.");

    const currency = String(request.currency_code || request.payment_currency_code || 'USD').toUpperCase();
    const walletAccountId = await ensureWalletAccount(tx, request.user_id);

    const [refund] = await tx<any[]>`
      insert into commercial.refunds (
        refund_request_id,
        payment_id,
        gateway,
        gateway_reference,
        refund_amount,
        currency_code,
        status,
        payload,
        processed_at
      ) values (
        ${request.id},
        ${request.payment_id ?? null},
        'wallet_credit',
        ${`WALLET-REFUND-${request.id}`},
        ${amount},
        ${currency},
        'refunded',
        ${jsonb({ mode: 'wallet_credit', adminNote: input.adminNote ?? null })}::jsonb,
        now()
      )
      returning id
    `;

    await tx`
      insert into commercial.refund_lines (
        refund_request_id,
        booking_id,
        line_type,
        quantity,
        source_currency_code,
        payment_currency_code,
        settlement_currency_code,
        source_refund_amount,
        payment_refund_amount,
        settlement_reversal_amount,
        snapshot_json
      ) values (
        ${request.id},
        ${request.booking_id},
        'main_service',
        1,
        ${currency},
        ${currency},
        ${currency},
        ${amount},
        ${amount},
        ${amount},
        ${jsonb({ refundId: refund.id, mode: 'wallet_credit' })}::jsonb
      )
    `;

    await tx`
      insert into customer.wallet_transactions (
        wallet_account_id,
        user_id,
        booking_id,
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
        ${walletAccountId},
        ${request.user_id},
        ${request.booking_id},
        'refund',
        'credit',
        'completed',
        'wallet',
        'Booking refund',
        ${input.adminNote || 'Refund approved by admin'},
        ${currency},
        ${amount},
        ${jsonb({ refundRequestId: request.id, refundId: refund.id })}::jsonb
      )
    `;

    const refundedAfter = Number(request.already_refunded_amount ?? 0) + amount;
    const fullyRefunded = refundedAfter >= Number(request.paid_amount ?? 0);

    await tx`
      update commercial.refund_requests
         set status = 'refunded',
             admin_note = ${input.adminNote ?? null},
             updated_at = now()
       where id = ${request.id}
    `;

    await tx`
      update booking.bookings
         set payment_status = ${fullyRefunded ? 'Refunded' : 'PartiallyRefunded'},
             metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
               lastRefundRequestId: request.id,
               lastRefundAmount: amount,
               lastRefundedAt: new Date().toISOString(),
             })}::jsonb,
             last_modified_date = now()
       where id = ${request.booking_id}
    `;
  });
}

export async function rejectRefundRequest(input: {
  refundRequestId: string;
  adminNote?: string | null;
}) {
  await db`
    update commercial.refund_requests
       set status = 'rejected',
           admin_note = ${input.adminNote ?? 'Rejected by admin'},
           updated_at = now()
     where id = ${input.refundRequestId}::uuid
       and status in ('requested', 'approved', 'processing')
  `;
}
