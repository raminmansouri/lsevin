import 'server-only';

import sql from '@/config/database/db';
import type { CompensationPolicy, ProviderLedgerEntry } from '../../types';

export async function getCompensationPolicies(params?: {
  search?: string;
  scopeType?: string;
  appliesTo?: string;
  isActive?: boolean;
}) {
  const search = params?.search?.trim() || null;
  const rows = await sql<CompensationPolicy[]>`
    select
      id,
      name,
      description,
      scope_type as "scopeType",
      scope_id as "scopeId",
      applies_to as "appliesTo",
      fee_mode as "feeMode",
      platform_percent::float8 as "platformPercent",
      platform_fixed_amount::float8 as "platformFixedAmount",
      minimum_platform_amount::float8 as "minimumPlatformAmount",
      provider_percent_override::float8 as "providerPercentOverride",
      gateway_fee_mode as "gatewayFeeMode",
      currency_code as "currencyCode",
      priority,
      is_active as "isActive",
      effective_from::text as "effectiveFrom",
      effective_to::text as "effectiveTo",
      metadata
    from commercial.compensation_policies
    where (${search} is null or name ilike ${search ? `%${search}%` : null} or coalesce(description, '') ilike ${search ? `%${search}%` : null})
      and (${params?.scopeType ?? null} is null or scope_type = ${params?.scopeType ?? null})
      and (${params?.appliesTo ?? null} is null or applies_to = ${params?.appliesTo ?? null})
      and (${params?.isActive ?? null} is null or is_active = ${params?.isActive ?? null})
    order by priority asc, created_at desc
  `;

  return rows;
}

export async function getCompensationPolicyById(policyId: string) {
  const rows = await sql<CompensationPolicy[]>`
    select
      id,
      name,
      description,
      scope_type as "scopeType",
      scope_id as "scopeId",
      applies_to as "appliesTo",
      fee_mode as "feeMode",
      platform_percent::float8 as "platformPercent",
      platform_fixed_amount::float8 as "platformFixedAmount",
      minimum_platform_amount::float8 as "minimumPlatformAmount",
      provider_percent_override::float8 as "providerPercentOverride",
      gateway_fee_mode as "gatewayFeeMode",
      currency_code as "currencyCode",
      priority,
      is_active as "isActive",
      effective_from::text as "effectiveFrom",
      effective_to::text as "effectiveTo",
      metadata
    from commercial.compensation_policies
    where id = ${policyId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getProviderLedgerEntries(params?: {
  providerId?: string;
  bookingId?: string;
  status?: string;
}) {
  return sql<(ProviderLedgerEntry & { providerName: string | null })[]>`
    select
      pl.id,
      pl.provider_id as "providerId",
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
      common.get_translation_t(sp.name_translations, 'en-US', 'en') as "providerName"
    from commercial.provider_ledgers pl
    join category.service_providers sp on sp.id = pl.provider_id
    where (${params?.providerId ?? null} is null or pl.provider_id = ${params?.providerId ?? null})
      and (${params?.bookingId ?? null} is null or pl.booking_id = ${params?.bookingId ?? null})
      and (${params?.status ?? null} is null or pl.status = ${params?.status ?? null})
    order by pl.created_at desc
  `;
}

export async function getRefundRequests(params?: { status?: string; bookingId?: string }) {
  return sql<any[]>`
    select
      rr.*,
      p.amount::float8 as payment_amount,
      p.currency as payment_currency,
      b.payment_status,
      b.booking_status
    from commercial.refund_requests rr
    left join booking.payments p on p.id = rr.payment_id
    left join booking.bookings b on b.id = rr.booking_id
    where (${params?.status ?? null} is null or rr.status = ${params?.status ?? null})
      and (${params?.bookingId ?? null} is null or rr.booking_id = ${params?.bookingId ?? null})
    order by rr.created_at desc
  `;
}

export async function getRefundRequestById(refundRequestId: string) {
  const [request] = await sql<any[]>`
    select *
    from commercial.refund_requests
    where id = ${refundRequestId}
    limit 1
  `;

  if (!request) return null;

  const lines = await sql<any[]>`
    select *
    from commercial.refund_lines
    where refund_request_id = ${refundRequestId}
    order by created_at asc
  `;

  const refunds = await sql<any[]>`
    select *
    from commercial.refunds
    where refund_request_id = ${refundRequestId}
    order by created_at desc
  `;

  return { request, lines, refunds };
}

export async function getBookingFinancialBreakdown(bookingId: string) {
  const [booking] = await sql<any[]>`
    select
      b.id,
      b.user_id as "userId",
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.source_currency_code as "sourceCurrencyCode",
      b.display_currency_code as "displayCurrencyCode",
      b.payment_currency_code as "paymentCurrencyCode",
      b.settlement_currency_code as "settlementCurrencyCode",
      b.source_total_amount::float8 as "sourceTotalAmount",
      b.display_total_amount::float8 as "displayTotalAmount",
      b.total_amount::float8 as "paymentTotalAmount",
      b.pricing_snapshot as "pricingSnapshot",
      bfs.payment_gross_amount::float8 as "paymentGrossAmount",
      bfs.discount_amount::float8 as "discountAmount",
      bfs.net_amount::float8 as "netAmount",
      bfs.platform_fee_amount::float8 as "platformFeeAmount",
      bfs.provider_payable_amount::float8 as "providerPayableAmount",
      bfs.gateway_fee_amount::float8 as "gatewayFeeAmount",
      bfs.refunded_amount::float8 as "refundedAmount",
      bfs.remaining_net_amount::float8 as "remainingNetAmount"
    from booking.bookings b
    left join commercial.booking_financial_summaries bfs on bfs.booking_id = b.id
    where b.id = ${bookingId}
    limit 1
  `;

  if (!booking) return null;

  const chargeLines = await sql<any[]>`
    select
      cl.*,
      common.get_translation_t(sp.name_translations, 'en-US', 'en') as "providerName",
      common.get_translation_t(ps.display_name_translations, 'en-US', 'en') as "providerServiceName",
      a.name as "addonName"
    from commercial.booking_charge_lines cl
    left join category.service_providers sp on sp.id = cl.provider_id
    left join category.provider_services ps on ps.id = cl.provider_service_id
    left join category.addons a on a.id = cl.addon_id
    where cl.booking_id = ${bookingId}
    order by cl.created_at asc
  `;

  const providerLedgers = await getProviderLedgerEntries({ bookingId });
  const refundRequests = await getRefundRequests();
  const bookingRefunds = refundRequests.filter((x) => x.booking_id === bookingId);

  return { booking, chargeLines, providerLedgers, refundRequests: bookingRefunds };
}
