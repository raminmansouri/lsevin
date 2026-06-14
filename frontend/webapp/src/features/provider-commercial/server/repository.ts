import 'server-only';

import sql from '@/config/database/db';
import { getBookingFinancialBreakdown, getRefundRequestById } from '@/features/commercial/lib/server/commercial-queries';
import { getBookingPaymentTerms } from '@/features/commercial/lib/server/payment-policy-queries';

function providerBookingScope(providerId: string, bookingId: string) {
  return sql`
    exists (
      select 1
      from commercial.booking_charge_lines cl
      where cl.booking_id = ${bookingId}
        and cl.provider_id = ${providerId}
    )
    or exists (
      select 1
      from booking.bookings b
      where b.id = ${bookingId}
        and b.provider_id = ${providerId}
    )
  `;
}

export async function getProviderCommercialDashboard(providerId: string) {
  const [summary] = await sql<any[]>`
    with ledger as (
      select
        count(*) filter (where status = 'pending') as pending_ledgers,
        count(*) filter (where status = 'approved') as approved_ledgers,
        count(*) filter (where status = 'paid') as paid_ledgers,
        coalesce(sum(amount) filter (where status in ('pending','approved')), 0)::numeric(18,2) as open_amount,
        coalesce(sum(amount) filter (where status = 'paid'), 0)::numeric(18,2) as paid_amount
      from commercial.provider_ledgers
      where provider_id = ${providerId}
    ), refunds as (
      select
        count(distinct rr.id) filter (where rr.status = 'requested') as requested_refunds,
        count(distinct rr.id) filter (where rr.status = 'approved') as approved_refunds,
        count(distinct rr.id) filter (where rr.status = 'refunded') as refunded_refunds
      from commercial.refund_requests rr
      where exists (
        select 1
        from commercial.refund_lines rl
        join commercial.booking_charge_lines cl on cl.id = rl.charge_line_id
        where rl.refund_request_id = rr.id
          and cl.provider_id = ${providerId}
      )
    )
    select * from ledger cross join refunds
  `;

  const [provider] = await sql<any[]>`
    select id, common.get_translation_t(name_translations, 'en-US', 'en') as name
    from category.service_providers
    where id = ${providerId}
    limit 1
  `;

  return { provider, ...(summary ?? {}) };
}

export async function getProviderLedgers(providerId: string, params?: { status?: string; bookingId?: string }) {
  return sql<any[]>`
    select
      pl.id,
      pl.booking_id as "bookingId",
      pl.booking_child_id as "bookingChildId",
      pl.charge_line_id as "chargeLineId",
      pl.entry_type as "entryType",
      pl.amount::float8 as amount,
      pl.currency_code as "currencyCode",
      pl.status,
      pl.reference_type as "referenceType",
      pl.reference_id as "referenceId",
      pl.notes,
      pl.metadata,
      pl.created_at::text as "createdAt",
      common.get_translation_t(ps.display_name_translations, 'en-US', 'en') as "serviceName"
    from commercial.provider_ledgers pl
    left join commercial.booking_charge_lines cl on cl.id = pl.charge_line_id
    left join category.provider_services ps on ps.id = cl.provider_service_id
    where pl.provider_id = ${providerId}
      and (${params?.status ?? null} is null or pl.status = ${params?.status ?? null})
      and (${params?.bookingId ?? null} is null or pl.booking_id = ${params?.bookingId ?? null})
    order by pl.created_at desc
  `;
}

export async function getProviderRefundRequests(
  providerId: string,
  params?: { status?: string; bookingId?: string }
) {
  return sql<any[]>`
    with input as (
      select
        ${providerId}::uuid as provider_id,
        ${params?.status ?? null}::text as status_filter,
        ${params?.bookingId ?? null}::uuid as booking_id_filter
    )
    select
      rr.*,
      p.amount::float8 as payment_amount,
      p.currency as payment_currency,
      p.payment_method,
      b.id as booking_id,
      b.booking_status,
      b.payment_status,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', rl.id,
              'lineType', rl.line_type,
              'bookingChildId', rl.booking_child_id,
              'bookingAddonId', rl.booking_addon_id,
              'sourceRefundAmount', rl.source_refund_amount,
              'paymentRefundAmount', rl.payment_refund_amount,
              'settlementReversalAmount', rl.settlement_reversal_amount,
              'sourceCurrencyCode', rl.source_currency_code,
              'paymentCurrencyCode', rl.payment_currency_code,
              'settlementCurrencyCode', rl.settlement_currency_code,
              'snapshotJson', rl.snapshot_json
            )
            order by rl.created_at asc
          ),
          '[]'::jsonb
        )
      ) as refund_lines
    from input i
    join commercial.refund_requests rr
      on true
    left join booking.bookings b
      on b.id = rr.booking_id
    left join booking.payments p
      on p.id = rr.payment_id
    left join commercial.refund_lines rl
      on rl.refund_request_id = rr.id
    where
      exists (
        select 1
        from commercial.provider_ledgers pl
        where pl.provider_id = i.provider_id
          and pl.booking_id = rr.booking_id
      )
      and (i.status_filter is null or rr.status = i.status_filter)
      and (i.booking_id_filter is null or rr.booking_id = i.booking_id_filter)
    group by
      rr.id,
      p.amount,
      p.currency,
      p.payment_method,
      b.id,
      b.booking_status,
      b.payment_status
    order by rr.created_at desc
  `;
}

export async function getProviderRefundRequest(providerId: string, refundRequestId: string) {
  const data = await getRefundRequestById(refundRequestId);
  if (!data) return null;
  const lines = (data.lines ?? []).filter((line: any) => line.snapshot_json?.provider_id === providerId || line.snapshot_json?.providerId === providerId);
  if (lines.length === 0) return null;
  return { ...data, lines };
}

export async function getProviderBookingFinancial(providerId: string, bookingId: string) {
  const [allowed] = await sql<{ allowed: boolean }[]>`
    select ${providerBookingScope(providerId, bookingId)} as allowed
  `;
  if (!allowed?.allowed) return null;

  const data = await getBookingFinancialBreakdown(bookingId);
  if (!data) return null;

  return {
    booking: data.booking,
    chargeLines: (data.chargeLines ?? []).filter((line: any) => line.provider_id === providerId || line.providerId === providerId),
    providerLedgers: (data.providerLedgers ?? []).filter((line: any) => line.providerId === providerId),
    refundRequests: (data.refundRequests ?? []).filter((request: any) => {
      const refundLines = (request.lines ?? []);
      return refundLines.some((line: any) => line.snapshot_json?.provider_id === providerId || line.snapshot_json?.providerId === providerId);
    }),
  };
}

export async function getProviderBookingPaymentTerms(providerId: string, bookingId: string) {
  const [allowed] = await sql<{ allowed: boolean }[]>`
    select ${providerBookingScope(providerId, bookingId)} as allowed
  `;
  if (!allowed?.allowed) return null;
  return getBookingPaymentTerms(bookingId);
}

export async function getProviderChargeLinesForRefund(providerId: string, bookingId: string) {
  return sql<any[]>`
    select *
    from commercial.booking_charge_lines
    where booking_id = ${bookingId}
      and provider_id = ${providerId}
    order by created_at asc
  `;
}
