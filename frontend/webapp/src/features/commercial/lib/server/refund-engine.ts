import 'server-only';

import sql from '@/config/database/db';

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createRefundRequest(input: any) {
  return sql.begin(async (tx) => {
    const [request] = await tx<any[]>`
      insert into commercial.refund_requests (
        booking_id, payment_id, requested_by_user_id, refund_scope, reason, customer_note, admin_note, status
      ) values (
        ${input.bookingId}, ${input.paymentId ?? null}, ${input.requestedByUserId ?? null}, ${input.refundScope}, ${input.reason}, ${input.customerNote ?? null}, ${input.adminNote ?? null}, 'requested'
      )
      returning *
    `;

    const chargeLines = await tx<any[]>`select * from commercial.booking_charge_lines where booking_id = ${input.bookingId} order by created_at asc`;
    const linesToCreate = input.refundLines?.length ? input.refundLines : chargeLines.map((line) => ({ chargeLineId: line.id, bookingChildId: line.booking_child_id, bookingAddonId: line.booking_addon_id, lineType: line.line_type, quantity: line.quantity ?? 1, paymentRefundAmount: Number(line.net_amount ?? 0) }));

    for (const line of linesToCreate) {
      const chargeLine = chargeLines.find((x) => x.id === line.chargeLineId) ?? null;
      const paymentRefundAmount = round2(Number(line.paymentRefundAmount));
      const sourceRefundAmount = chargeLine ? round2((Number(chargeLine.source_gross_amount ?? 0) / Math.max(Number(chargeLine.payment_gross_amount ?? 1), 1)) * paymentRefundAmount) : paymentRefundAmount;
      const settlementReversalAmount = chargeLine ? round2((Number(chargeLine.provider_payable_amount ?? 0) / Math.max(Number(chargeLine.net_amount ?? 1), 1)) * paymentRefundAmount) : paymentRefundAmount;
      await tx`
        insert into commercial.refund_lines (
          refund_request_id, booking_id, booking_child_id, booking_addon_id, charge_line_id,
          line_type, quantity, source_currency_code, payment_currency_code, settlement_currency_code,
          source_refund_amount, payment_refund_amount, settlement_reversal_amount,
          exchange_rate, exchange_rate_ids, fx_quote_id, snapshot_json
        ) values (
          ${request.id}, ${input.bookingId}, ${line.bookingChildId ?? null}, ${line.bookingAddonId ?? null}, ${line.chargeLineId ?? null},
          ${line.lineType}, ${line.quantity ?? 1},
          ${chargeLine?.source_currency_code ?? 'USD'}, ${chargeLine?.payment_currency_code ?? 'USD'}, ${chargeLine?.settlement_currency_code ?? 'USD'},
          ${sourceRefundAmount}, ${paymentRefundAmount}, ${settlementReversalAmount},
          ${chargeLine?.exchange_rate ?? null}, ${chargeLine?.exchange_rate_ids ?? []}, ${chargeLine?.fx_quote_id ?? null}, ${chargeLine ?? {} as any}
        )
      `;
    }

    return request;
  });
}

export async function approveRefundRequest(refundRequestId: string, _adminUserId?: string | null, adminNote?: string | null) {
  const rows = await sql<any[]>`
    update commercial.refund_requests
       set status = 'approved', admin_note = coalesce(${adminNote ?? null}, admin_note), updated_at = now()
     where id = ${refundRequestId} and status = 'requested'
    returning *
  `;
  if (!rows[0]) throw new Error('Refund request was not in requested state.');
  return rows[0];
}

export async function rejectRefundRequest(refundRequestId: string, _adminUserId?: string | null, adminNote?: string | null) {
  const rows = await sql<any[]>`
    update commercial.refund_requests
       set status = 'rejected', admin_note = coalesce(${adminNote ?? null}, admin_note), updated_at = now()
     where id = ${refundRequestId} and status in ('requested', 'approved')
    returning *
  `;
  if (!rows[0]) throw new Error('Refund request could not be rejected from its current state.');
  return rows[0];
}

export async function executeRefundRequest(refundRequestId: string, adminUserId?: string | null) {
  return sql.begin(async (tx) => {
    const [request] = await tx<any[]>`
      update commercial.refund_requests
         set status = 'processing', updated_at = now()
       where id = ${refundRequestId} and status = 'approved'
      returning *
    `;
    if (!request) throw new Error('Refund request must be approved before execution.');

    const lines = await tx<any[]>`select * from commercial.refund_lines where refund_request_id = ${refundRequestId} order by created_at asc`;
    const totalRefundAmount = round2(lines.reduce((sum, line) => sum + Number(line.payment_refund_amount ?? 0), 0));
    const [payment] = request.payment_id ? await tx<any[]>`select * from booking.payments where id = ${request.payment_id} limit 1` : [];
    const refundCurrency = payment?.currency ?? lines[0]?.payment_currency_code ?? 'USD';

    const [refund] = await tx<any[]>`
      insert into commercial.refunds (
        refund_request_id, payment_id, gateway, gateway_reference, refund_amount, currency_code, status, payload, processed_at
      ) values (
        ${refundRequestId}, ${request.payment_id ?? null}, ${payment?.gateway ?? null}, null, ${totalRefundAmount}, ${refundCurrency}, 'refunded', ${
          { mode: payment?.payment_method === 'wallet' ? 'wallet' : 'gateway_stub', executedByUserId: adminUserId ?? null } as any
        }, now())
      returning *
    `;

    for (const line of lines) {
      const [chargeLine] = line.charge_line_id ? await tx<any[]>`select * from commercial.booking_charge_lines where id = ${line.charge_line_id} limit 1` : [];
      if (payment?.payment_method === 'wallet' && payment?.user_id) {
        const [wallet] = await tx<any[]>`select * from customer.wallet_accounts where user_id = ${payment.user_id} limit 1`;
        if (wallet) {
          await tx`
            insert into customer.wallet_transactions (
              wallet_account_id, user_id, booking_id, payment_intent_id,
              transaction_type, direction, status, payment_method, title, subtitle,
              currency_code, amount, metadata
            ) values (
              ${wallet.id}, ${payment.user_id}, ${request.booking_id}, null,
              'refund', 'credit', 'completed', 'wallet', 'Booking refund', 'Refund request ' || ${refundRequestId},
              ${refundCurrency}, ${Number(line.payment_refund_amount ?? 0)}, ${line.snapshot_json as any}
            )
          `;
        }
      }

      if (chargeLine?.provider_id && Number(line.settlement_reversal_amount ?? 0) > 0) {
        const [ledger] = await tx<any[]>`
          insert into commercial.provider_ledgers (
            provider_id, booking_id, booking_child_id, charge_line_id,
            entry_type, amount, currency_code, status, reference_type, reference_id, metadata
          ) values (
            ${chargeLine.provider_id}, ${request.booking_id}, ${line.booking_child_id ?? null}, ${chargeLine.id},
            'reversal', ${-Math.abs(Number(line.settlement_reversal_amount ?? 0))}, ${line.settlement_currency_code}, 'pending',
            'refund_request', ${refundRequestId}, ${line.snapshot_json as any}
          ) returning *
        `;

        await tx`
          insert into commercial.provider_settlement_reversals (
            provider_id, booking_id, booking_child_id, refund_line_id, provider_ledger_id, amount, currency_code, status, notes
          ) values (
            ${chargeLine.provider_id}, ${request.booking_id}, ${line.booking_child_id ?? null}, ${line.id}, ${ledger.id}, ${Math.abs(Number(line.settlement_reversal_amount ?? 0))}, ${line.settlement_currency_code}, 'applied', 'Auto-created from booking refund execution'
          )
        `;
      }
    }

    await tx`update commercial.refund_requests set status = 'refunded', updated_at = now() where id = ${refundRequestId}`;
    return refund;
  });
}
