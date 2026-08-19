import "server-only";
import { sql } from "@core/db/client";
import { assertTimeZone, zonedDateRangeToUtc } from "@core/lib/dateTime";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import type {
  BookingEarningRow,
  BookingEarningsSummary,
  StaffCompensationRule,
  StaffFinanceProfile,
  CompensationPolicy,
  DateRangeInput,
  FinanceAdminOverview,
  FinanceOverview,
  MoneyTransfer,
  PayoutAccount,
  ProviderReportsBundle,
  ProviderWalletAccount,
  ProviderWalletTransaction,
  ReportKpis,
  ReportSnapshot,
  ServicePerformanceRow,
  SettlementBatch,
  SettlementItem,
  StaffPerformanceRow,
  TimeSeriesPoint,
  WithdrawalRequest,
} from "./types";

function rangeOrDefault(range?: DateRangeInput) {
  const now = new Date();
  const from = range?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = range?.to || now.toISOString().slice(0, 10);
  const currencyCode = (range?.currencyCode || "USD").toUpperCase();
  const timeZone = assertTimeZone(range?.timeZone);
  const { start, endExclusive } = zonedDateRangeToUtc(from, to, timeZone);
  return { from, to, currencyCode, timeZone, start, endExclusive };
}

export async function ensureProviderWalletAccount(providerId: string, currencyCode = "USD") {
  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.provider_wallet_accounts (service_provider_id, currency_code, create_date, last_modified_date)
    values (${providerId}::uuid, ${currencyCode}, now(), now())
    on conflict (service_provider_id, currency_code) do update
      set last_modified_date = provider_portal.provider_wallet_accounts.last_modified_date
    returning id::text as id
  `;
  return rows[0].id;
}

export async function getProviderFinanceOverview(providerId: string, range?: DateRangeInput) {
  const { currencyCode, start, endExclusive } = rangeOrDefault(range);
  const rows = await sql<FinanceOverview[]>`
    with charge_totals as (
      select
        coalesce(sum(payment_gross_amount), 0)::text as gross_revenue,
        coalesce(sum(net_amount), 0)::text as net_revenue,
        coalesce(sum(platform_fee_amount), 0)::text as platform_fee_amount,
        coalesce(sum(provider_payable_amount), 0)::text as provider_payable_amount
      from commercial.booking_charge_lines
      where provider_id = ${providerId}::uuid
        and payment_currency_code = ${currencyCode}
        and created_at >= ${start}::timestamptz and created_at < ${endExclusive}::timestamptz
    ),
    refund_totals as (
      select coalesce(sum(rl.payment_refund_amount), 0)::text as refunded_amount
      from commercial.refund_lines rl
      join booking.bookings b on b.id = rl.booking_id
      where b.provider_id = ${providerId}::uuid
        and rl.payment_currency_code = ${currencyCode}
        and rl.created_at >= ${start}::timestamptz and rl.created_at < ${endExclusive}::timestamptz
    ),
    booking_totals as (
      select
        count(*)::int as bookings_count,
        count(*) filter (where lower(coalesce(payment_status, '')) in ('paid','captured','succeeded','authorized'))::int as paid_bookings_count,
        coalesce(avg(total_amount), 0)::text as average_order_value
      from booking.bookings
      where provider_id = ${providerId}::uuid
        and coalesce(currency_code, ${currencyCode}) = ${currencyCode}
        and create_date >= ${start}::timestamptz and create_date < ${endExclusive}::timestamptz
    ),
    ledger_totals as (
      select
        coalesce(sum(amount) filter (where status = 'pending' and entry_type in ('earning','adjustment')), 0)::text as pending_ledger_amount,
        coalesce(sum(amount) filter (where status = 'approved' and entry_type in ('earning','adjustment')), 0)::text as approved_ledger_amount,
        coalesce(sum(abs(amount)) filter (where status = 'paid' or entry_type = 'payout'), 0)::text as paid_ledger_amount
      from commercial.provider_ledgers
      where provider_id = ${providerId}::uuid
        and currency_code = ${currencyCode}
        and created_at >= ${start}::timestamptz and created_at < ${endExclusive}::timestamptz
    ),
    wallet_totals as (
      select
        coalesce(sum(available_amount), 0)::text as wallet_available_amount,
        coalesce(sum(pending_amount), 0)::text as wallet_pending_amount
      from provider_portal.provider_wallet_accounts
      where service_provider_id = ${providerId}::uuid
        and currency_code = ${currencyCode}
    ),
    withdrawal_totals as (
      select coalesce(sum(amount) filter (where status in ('requested','in_review','approved','processing')), 0)::text as withdrawal_pending_amount
      from provider_portal.withdrawal_requests
      where service_provider_id = ${providerId}::uuid
        and currency_code = ${currencyCode}
    )
    select
      ${providerId}::text as "providerId",
      ${currencyCode}::text as "currencyCode",
      ct.gross_revenue as "grossRevenue",
      ct.net_revenue as "netRevenue",
      ct.platform_fee_amount as "platformFeeAmount",
      ct.provider_payable_amount as "providerPayableAmount",
      rt.refunded_amount as "refundedAmount",
      wt.wallet_available_amount as "walletAvailableAmount",
      wt.wallet_pending_amount as "walletPendingAmount",
      lt.pending_ledger_amount as "pendingLedgerAmount",
      lt.approved_ledger_amount as "approvedLedgerAmount",
      lt.paid_ledger_amount as "paidLedgerAmount",
      wd.withdrawal_pending_amount as "withdrawalPendingAmount",
      bt.bookings_count as "bookingsCount",
      bt.paid_bookings_count as "paidBookingsCount",
      bt.average_order_value as "averageOrderValue"
    from charge_totals ct, refund_totals rt, booking_totals bt, ledger_totals lt, wallet_totals wt, withdrawal_totals wd
  `;
  return rows[0];
}

export async function listProviderWalletAccounts(providerId: string) {
  return sql<ProviderWalletAccount[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      currency_code as "currencyCode",
      available_amount::text as "availableAmount",
      pending_amount::text as "pendingAmount",
      locked_amount::text as "lockedAmount",
      status,
      create_date::text as "createdAt",
      last_modified_date::text as "updatedAt"
    from provider_portal.provider_wallet_accounts
    where service_provider_id = ${providerId}::uuid
    order by currency_code
  `;
}

export async function listProviderWalletTransactions(providerId: string, limit = 100) {
  return sql<ProviderWalletTransaction[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      wallet_account_id::text as "walletAccountId",
      direction,
      transaction_type as "transactionType",
      status,
      amount::text,
      currency_code as "currencyCode",
      counterparty_type as "counterpartyType",
      counterparty_user_id::text as "counterpartyUserId",
      customer_id::text as "customerId",
      booking_id::text as "bookingId",
      settlement_batch_id::text as "settlementBatchId",
      withdrawal_request_id::text as "withdrawalRequestId",
      reference_type as "referenceType",
      reference_id::text as "referenceId",
      external_reference as "externalReference",
      notes,
      create_date::text as "createdAt"
    from provider_portal.provider_wallet_transactions
    where service_provider_id = ${providerId}::uuid
    order by create_date desc
    limit ${limit}
  `;
}

export async function listPayoutAccounts(providerId: string) {
  return sql<PayoutAccount[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      account_holder_name as "accountHolderName",
      bank_name as "bankName",
      iban,
      swift_code as "swiftCode",
      account_number_last4 as "accountNumberLast4",
      country,
      currency_code as "currencyCode",
      is_default as "isDefault"
    from provider_portal.payout_accounts
    where service_provider_id = ${providerId}::uuid
    order by is_default desc, create_date desc
  `;
}

export async function listWithdrawalRequests(providerId: string, limit = 50) {
  return sql<WithdrawalRequest[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      wallet_account_id::text as "walletAccountId",
      payout_account_id::text as "payoutAccountId",
      amount::text,
      currency_code as "currencyCode",
      status,
      requested_by_user_id::text as "requestedByUserId",
      reviewed_by_user_id::text as "reviewedByUserId",
      review_note as "reviewNote",
      gateway_reference as "gatewayReference",
      requested_at::text as "requestedAt",
      reviewed_at::text as "reviewedAt",
      paid_at::text as "paidAt"
    from provider_portal.withdrawal_requests
    where service_provider_id = ${providerId}::uuid
    order by requested_at desc
    limit ${limit}
  `;
}

export async function listSettlementBatches(providerId: string, limit = 50) {
  return sql<SettlementBatch[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      settlement_number as "settlementNumber",
      period_start::text as "periodStart",
      period_end::text as "periodEnd",
      currency_code as "currencyCode",
      gross_amount::text as "grossAmount",
      platform_fee_amount::text as "platformFeeAmount",
      provider_payable_amount::text as "providerPayableAmount",
      adjustment_amount::text as "adjustmentAmount",
      payout_amount::text as "payoutAmount",
      status,
      create_date::text as "createdAt",
      approved_at::text as "approvedAt",
      paid_at::text as "paidAt"
    from provider_portal.settlement_batches
    where service_provider_id = ${providerId}::uuid
    order by create_date desc
    limit ${limit}
  `;
}

export async function listSettlementItems(settlementBatchId: string) {
  return sql<SettlementItem[]>`
    select
      id::text,
      settlement_batch_id::text as "settlementBatchId",
      booking_id::text as "bookingId",
      charge_line_id::text as "chargeLineId",
      ledger_id::text as "ledgerId",
      item_type as "itemType",
      description,
      gross_amount::text as "grossAmount",
      platform_fee_amount::text as "platformFeeAmount",
      provider_payable_amount::text as "providerPayableAmount",
      currency_code as "currencyCode",
      create_date::text as "createdAt"
    from provider_portal.settlement_batch_items
    where settlement_batch_id = ${settlementBatchId}::uuid
    order by create_date desc
  `;
}

export async function listCompensationPolicies() {
  return sql<CompensationPolicy[]>`
    select
      id::text,
      name,
      description,
      scope_type as "scopeType",
      scope_id as "scopeId",
      applies_to as "appliesTo",
      fee_mode as "feeMode",
      platform_percent::text as "platformPercent",
      platform_fixed_amount::text as "platformFixedAmount",
      minimum_platform_amount::text as "minimumPlatformAmount",
      provider_percent_override::text as "providerPercentOverride",
      gateway_fee_mode as "gatewayFeeMode",
      currency_code as "currencyCode",
      priority,
      is_active as "isActive",
      effective_from::text as "effectiveFrom",
      effective_to::text as "effectiveTo"
    from commercial.compensation_policies
    order by is_active desc, priority asc, created_at desc
  `;
}

export async function upsertCompensationPolicy(input: {
  id?: string;
  name: string;
  description?: string;
  scopeType: string;
  scopeId?: string;
  appliesTo: string;
  feeMode: string;
  platformPercent: number;
  platformFixedAmount: number;
  minimumPlatformAmount: number;
  providerPercentOverride?: number | null;
  gatewayFeeMode: string;
  currencyCode?: string;
  priority: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  actorUserId: string;
}) {
  const rows = await sql<{ id: string }[]>`
    insert into commercial.compensation_policies (
      id, name, description, scope_type, scope_id, applies_to, fee_mode,
      platform_percent, platform_fixed_amount, minimum_platform_amount,
      provider_percent_override, gateway_fee_mode, currency_code, priority,
      is_active, effective_from, effective_to, metadata, created_at, updated_at
    ) values (
      coalesce(nullif(${input.id ?? ""}, '')::uuid, gen_random_uuid()),
      ${input.name}, nullif(${input.description ?? ""}, ''), ${input.scopeType}, nullif(${input.scopeId ?? ""}, ''),
      ${input.appliesTo}, ${input.feeMode}, ${input.platformPercent}, ${input.platformFixedAmount},
      ${input.minimumPlatformAmount}, ${input.providerPercentOverride ?? null}, ${input.gatewayFeeMode},
      nullif(${input.currencyCode ?? ""}, ''), ${input.priority}, ${input.isActive},
      nullif(${input.effectiveFrom ?? ""}, '')::timestamptz, nullif(${input.effectiveTo ?? ""}, '')::timestamptz,
      ${sql.json({ managedBy: "providers-portal", actorUserId: input.actorUserId })}, now(), now()
    ) on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      scope_type = excluded.scope_type,
      scope_id = excluded.scope_id,
      applies_to = excluded.applies_to,
      fee_mode = excluded.fee_mode,
      platform_percent = excluded.platform_percent,
      platform_fixed_amount = excluded.platform_fixed_amount,
      minimum_platform_amount = excluded.minimum_platform_amount,
      provider_percent_override = excluded.provider_percent_override,
      gateway_fee_mode = excluded.gateway_fee_mode,
      currency_code = excluded.currency_code,
      priority = excluded.priority,
      is_active = excluded.is_active,
      effective_from = excluded.effective_from,
      effective_to = excluded.effective_to,
      metadata = coalesce(commercial.compensation_policies.metadata, '{}'::jsonb) || excluded.metadata,
      updated_at = now()
    returning id::text
  `;
  return rows[0].id;
}

export async function setCompensationPolicyActive(input: { policyId: string; isActive: boolean; actorUserId: string }) {
  const result = await sql`
    update commercial.compensation_policies
    set is_active = ${input.isActive},
        metadata = coalesce(metadata, '{}'::jsonb) || ${sql.json({ managedBy: "providers-portal", actorUserId: input.actorUserId, statusChangedAt: new Date().toISOString() })},
        updated_at = now()
    where id = ${input.policyId}::uuid
  `;
  if (result.count === 0) throw new Error("Compensation policy not found.");
}

export async function getAdminFinanceOverview(range?: DateRangeInput) {
  const { currencyCode, start, endExclusive } = rangeOrDefault(range);
  const rows = await sql<FinanceAdminOverview[]>`
    with charge_totals as (
      select
        coalesce(sum(payment_gross_amount), 0)::text as gross_revenue,
        coalesce(sum(platform_fee_amount), 0)::text as platform_fees,
        coalesce(sum(provider_payable_amount), 0)::text as provider_payable,
        count(distinct booking_id)::int as bookings_count
      from commercial.booking_charge_lines
      where payment_currency_code = ${currencyCode}
        and created_at >= ${start}::timestamptz and created_at < ${endExclusive}::timestamptz
    ),
    refund_totals as (
      select coalesce(sum(payment_refund_amount), 0)::text as refunds
      from commercial.refund_lines
      where payment_currency_code = ${currencyCode}
        and created_at >= ${start}::timestamptz and created_at < ${endExclusive}::timestamptz
    ),
    payout_totals as (
      select coalesce(sum(amount), 0)::text as paid_out
      from provider_portal.provider_wallet_transactions
      where transaction_type = 'withdrawal'
        and direction = 'debit'
        and status = 'completed'
        and currency_code = ${currencyCode}
        and create_date >= ${start}::timestamptz and create_date < ${endExclusive}::timestamptz
    ),
    withdrawal_totals as (
      select coalesce(sum(amount), 0)::text as pending_withdrawals
      from provider_portal.withdrawal_requests
      where currency_code = ${currencyCode}
        and status in ('requested','in_review','approved','processing')
    ),
    provider_totals as (
      select count(distinct service_provider_id)::int as providers_with_balance
      from provider_portal.provider_wallet_accounts
      where currency_code = ${currencyCode}
        and available_amount > 0
    )
    select
      ${currencyCode}::text as "currencyCode",
      ct.gross_revenue as "totalGrossRevenue",
      ct.platform_fees as "totalPlatformFees",
      ct.provider_payable as "totalProviderPayable",
      rt.refunds as "totalRefunds",
      pt.paid_out as "totalPaidOut",
      wt.pending_withdrawals as "pendingWithdrawals",
      pvt.providers_with_balance as "providersWithBalance",
      ct.bookings_count as "bookingsCount"
    from charge_totals ct, refund_totals rt, payout_totals pt, withdrawal_totals wt, provider_totals pvt
  `;
  return rows[0];
}

export async function listRecentMoneyTransfers(limit = 100) {
  return sql<MoneyTransfer[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      booking_id::text as "bookingId",
      source_party_type as "sourcePartyType",
      source_user_id::text as "sourceUserId",
      target_party_type as "targetPartyType",
      target_user_id::text as "targetUserId",
      amount::text,
      currency_code as "currencyCode",
      transfer_type as "transferType",
      status,
      reference_type as "referenceType",
      reference_id::text as "referenceId",
      notes,
      create_date::text as "createdAt",
      completed_at::text as "completedAt"
    from provider_portal.money_transfers
    order by create_date desc
    limit ${limit}
  `;
}

export async function getProviderReportKpis(providerId: string, range?: DateRangeInput) {
  const { currencyCode, start, endExclusive } = rangeOrDefault(range);
  const rows = await sql<ReportKpis[]>`
    with booking_totals as (
      select
        count(*)::int as bookings_count,
        count(*) filter (where lower(coalesce(payment_status, '')) in ('paid','captured','succeeded','authorized'))::int as paid_bookings_count,
        count(*) filter (where lower(coalesce(booking_status, '')) in ('cancelled','canceled'))::int as cancelled_bookings_count,
        coalesce(avg(total_amount), 0)::text as average_order_value
      from booking.bookings
      where provider_id = ${providerId}::uuid
        and create_date >= ${start}::timestamptz and create_date < ${endExclusive}::timestamptz
    ),
    charge_totals as (
      select
        coalesce(sum(payment_gross_amount), 0)::text as gross_revenue,
        coalesce(sum(net_amount), 0)::text as net_revenue,
        coalesce(sum(platform_fee_amount), 0)::text as platform_fee_amount,
        coalesce(sum(provider_payable_amount), 0)::text as provider_payable_amount
      from commercial.booking_charge_lines
      where provider_id = ${providerId}::uuid
        and payment_currency_code = ${currencyCode}
        and created_at >= ${start}::timestamptz and created_at < ${endExclusive}::timestamptz
    ),
    refund_totals as (
      select coalesce(sum(rl.payment_refund_amount), 0)::text as refunded_amount
      from commercial.refund_lines rl
      join booking.bookings b on b.id = rl.booking_id
      where b.provider_id = ${providerId}::uuid
        and rl.payment_currency_code = ${currencyCode}
        and rl.created_at >= ${start}::timestamptz and rl.created_at < ${endExclusive}::timestamptz
    ),
    review_totals as (
      select
        coalesce(avg(rating), 0)::text as average_rating,
        count(*)::int as reviews_count
      from category.service_provider_comments
      where service_provider_id = ${providerId}::uuid
        and create_date >= ${start}::timestamptz and create_date < ${endExclusive}::timestamptz
    ),
    service_totals as (
      select count(*)::int as services_count, count(*) filter (where is_active)::int as active_services_count
      from category.provider_services
      where service_provider_id = ${providerId}::uuid
    ),
    staff_totals as (
      select count(*)::int as staff_count
      from category.provider_staffs
      where service_provider_id = ${providerId}::uuid
    )
    select
      ${providerId}::text as "providerId",
      ${currencyCode}::text as "currencyCode",
      bt.bookings_count as "bookingsCount",
      bt.paid_bookings_count as "paidBookingsCount",
      bt.cancelled_bookings_count as "cancelledBookingsCount",
      ct.gross_revenue as "grossRevenue",
      ct.net_revenue as "netRevenue",
      ct.platform_fee_amount as "platformFeeAmount",
      ct.provider_payable_amount as "providerPayableAmount",
      rt.refunded_amount as "refundedAmount",
      bt.average_order_value as "averageOrderValue",
      rv.average_rating as "averageRating",
      rv.reviews_count as "reviewsCount",
      st.services_count as "servicesCount",
      st.active_services_count as "activeServicesCount",
      sf.staff_count as "staffCount"
    from booking_totals bt, charge_totals ct, refund_totals rt, review_totals rv, service_totals st, staff_totals sf
  `;
  return rows[0];
}

export async function getProviderTimeSeries(providerId: string, range?: DateRangeInput) {
  const { from, to, currencyCode, timeZone, start, endExclusive } = rangeOrDefault(range);
  return sql<TimeSeriesPoint[]>`
    with booking_daily as (
      select (create_date at time zone ${timeZone})::date as day, count(*)::int as bookings_count
      from booking.bookings
      where provider_id = ${providerId}::uuid and create_date >= ${start}::timestamptz and create_date < ${endExclusive}::timestamptz
      group by 1
    ), charge_daily as (
      select (b.create_date at time zone ${timeZone})::date as day,
        coalesce(sum(cl.payment_gross_amount), 0) as gross_revenue,
        coalesce(sum(cl.net_amount), 0) as net_revenue,
        coalesce(sum(cl.provider_payable_amount), 0) as provider_payable_amount
      from commercial.booking_charge_lines cl
      join booking.bookings b on b.id = cl.booking_id
      where cl.provider_id = ${providerId}::uuid and cl.payment_currency_code = ${currencyCode}
        and b.create_date >= ${start}::timestamptz and b.create_date < ${endExclusive}::timestamptz
      group by 1
    ), refund_daily as (
      select (b.create_date at time zone ${timeZone})::date as day, coalesce(sum(rl.payment_refund_amount), 0) as refunded_amount
      from commercial.refund_lines rl
      join booking.bookings b on b.id = rl.booking_id
      where b.provider_id = ${providerId}::uuid and rl.payment_currency_code = ${currencyCode}
        and b.create_date >= ${start}::timestamptz and b.create_date < ${endExclusive}::timestamptz
      group by 1
    )
    select
      d::text as bucket,
      coalesce(b.bookings_count, 0)::int as "bookingsCount",
      coalesce(c.gross_revenue, 0)::text as "grossRevenue",
      coalesce(c.net_revenue, 0)::text as "netRevenue",
      coalesce(c.provider_payable_amount, 0)::text as "providerPayableAmount",
      coalesce(r.refunded_amount, 0)::text as "refundedAmount"
    from generate_series(${from}::date, ${to}::date, interval '1 day') d
    left join booking_daily b on b.day = d::date
    left join charge_daily c on c.day = d::date
    left join refund_daily r on r.day = d::date
    order by d
  `;
}

export async function listServicePerformance(providerId: string, range?: DateRangeInput) {
  const { currencyCode, start, endExclusive } = rangeOrDefault(range);
  return sql<ServicePerformanceRow[]>`
    select
      ps.id::text as "serviceId",
      coalesce(ps.display_name_translations ->> 'fa-IR', ps.display_name_translations ->> 'en-US', sd.name_translations ->> 'fa-IR', sd.name_translations ->> 'en-US', 'Service') as "serviceName",
      count(distinct b.id)::int as "bookingsCount",
      coalesce(sum(cl.payment_gross_amount), 0)::text as "grossRevenue",
      coalesce(sum(cl.provider_payable_amount), 0)::text as "providerPayableAmount",
      ps.rating::text as rating,
      coalesce(ps.review_count, 0)::int as "reviewCount"
    from category.provider_services ps
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join booking.bookings b on b.service_id = ps.id and b.provider_id = ${providerId}::uuid and b.create_date >= ${start}::timestamptz and b.create_date < ${endExclusive}::timestamptz
    left join commercial.booking_charge_lines cl on cl.booking_id = b.id and cl.provider_service_id = ps.id and cl.payment_currency_code = ${currencyCode}
    where ps.service_provider_id = ${providerId}::uuid
    group by ps.id, sd.id
    order by coalesce(sum(cl.provider_payable_amount), 0) desc, count(distinct b.id) desc
    limit 25
  `;
}

export async function listStaffPerformance(providerId: string, range?: DateRangeInput) {
  const { currencyCode, start, endExclusive } = rangeOrDefault(range);
  return sql<StaffPerformanceRow[]>`
    select
      s.id::text as "staffId",
      coalesce(s.name_translations ->> 'fa-IR', s.name_translations ->> 'en-US', 'Staff') as "staffName",
      count(distinct b.id)::int as "bookingsCount",
      coalesce(sum(cl.payment_gross_amount), 0)::text as "grossRevenue",
      s.rating::text as rating,
      coalesce(s.review_count, 0)::int as "reviewCount"
    from category.provider_staffs ps
    join category.staff s on s.id = ps.staff_id
    left join booking.bookings b on b.specialist_id = s.id and b.provider_id = ${providerId}::uuid and b.create_date >= ${start}::timestamptz and b.create_date < ${endExclusive}::timestamptz
    left join commercial.booking_charge_lines cl on cl.booking_id = b.id and cl.provider_id = ${providerId}::uuid and cl.payment_currency_code = ${currencyCode}
    where ps.service_provider_id = ${providerId}::uuid
    group by s.id
    order by coalesce(sum(cl.payment_gross_amount), 0) desc, count(distinct b.id) desc
    limit 25
  `;
}

export async function getProviderReportsBundle(providerId: string, range?: DateRangeInput): Promise<ProviderReportsBundle> {
  const [kpis, timeSeries, servicePerformance, staffPerformance] = await Promise.all([
    getProviderReportKpis(providerId, range),
    getProviderTimeSeries(providerId, range),
    listServicePerformance(providerId, range),
    listStaffPerformance(providerId, range),
  ]);
  return { kpis, timeSeries, servicePerformance, staffPerformance };
}

export async function listReportSnapshots(providerId?: string, limit = 25) {
  if (providerId) {
    return sql<ReportSnapshot[]>`
      select id::text, service_provider_id::text as "providerId", report_key as "reportKey", title, period_start::text as "periodStart", period_end::text as "periodEnd", currency_code as "currencyCode", payload, created_by_user_id::text as "createdByUserId", create_date::text as "createdAt"
      from provider_portal.finance_report_snapshots
      where service_provider_id = ${providerId}::uuid
      order by create_date desc
      limit ${limit}
    `;
  }
  return sql<ReportSnapshot[]>`
    select id::text, service_provider_id::text as "providerId", report_key as "reportKey", title, period_start::text as "periodStart", period_end::text as "periodEnd", currency_code as "currencyCode", payload, created_by_user_id::text as "createdByUserId", create_date::text as "createdAt"
    from provider_portal.finance_report_snapshots
    order by create_date desc
    limit ${limit}
  `;
}

export async function createReportSnapshot(input: { providerId?: string; reportKey: string; title: string; periodStart: string; periodEnd: string; currencyCode: string; payload: unknown; createdByUserId: string }) {
  await sql`
    insert into provider_portal.finance_report_snapshots (service_provider_id, report_key, title, period_start, period_end, currency_code, payload, created_by_user_id)
    values (${input.providerId ? sql`${input.providerId}::uuid` : sql`null`}, ${input.reportKey}, ${input.title}, ${input.periodStart}::date, ${input.periodEnd}::date, ${input.currencyCode}, ${JSON.stringify(input.payload)}::jsonb, ${input.createdByUserId}::uuid)
  `;
}

export async function requestWithdrawal(input: { providerId: string; currencyCode: string; amount: number; payoutAccountId?: string; requestedByUserId: string }) {
  await sql.begin(async (tx) => {
    const walletRows = await tx<{ id: string; availableAmount: string; lockedAmount: string }[]>`
      select id::text, available_amount::text as "availableAmount", locked_amount::text as "lockedAmount"
      from provider_portal.provider_wallet_accounts
      where service_provider_id = ${input.providerId}::uuid and currency_code = ${input.currencyCode}
      for update
    `;
    const wallet = walletRows[0];
    if (!wallet) throw new Error("No provider wallet account exists for this currency.");
    const withdrawable = Number(wallet.availableAmount) - Number(wallet.lockedAmount);
    if (input.amount <= 0 || input.amount > withdrawable) throw new Error("Withdrawal amount exceeds withdrawable provider wallet balance.");

    const requestRows = await tx<{ id: string }[]>`
      insert into provider_portal.withdrawal_requests (service_provider_id, wallet_account_id, payout_account_id, amount, currency_code, status, requested_by_user_id)
      values (${input.providerId}::uuid, ${wallet.id}::uuid, ${input.payoutAccountId ? sql`${input.payoutAccountId}::uuid` : sql`null`}, ${input.amount}, ${input.currencyCode}, 'requested', ${input.requestedByUserId}::uuid)
      returning id::text as id
    `;

    await tx`
      update provider_portal.provider_wallet_accounts
      set locked_amount = locked_amount + ${input.amount}, last_modified_date = now()
      where id = ${wallet.id}::uuid
    `;

    await tx`
      insert into provider_portal.provider_wallet_transactions (wallet_account_id, service_provider_id, direction, transaction_type, status, amount, currency_code, withdrawal_request_id, counterparty_type, notes, created_by_user_id)
      values (${wallet.id}::uuid, ${input.providerId}::uuid, 'debit', 'withdrawal', 'pending', ${input.amount}, ${input.currencyCode}, ${requestRows[0].id}::uuid, 'bank', 'Withdrawal requested by provider', ${input.requestedByUserId}::uuid)
    `;
  });
}

export async function approveWithdrawal(input: { withdrawalRequestId: string; reviewedByUserId: string; reviewNote?: string }) {
  await sql`
    update provider_portal.withdrawal_requests
    set status = 'approved', reviewed_by_user_id = ${input.reviewedByUserId}::uuid, review_note = ${input.reviewNote ?? null}, reviewed_at = now(), last_modified_date = now()
    where id = ${input.withdrawalRequestId}::uuid and status in ('requested','in_review')
  `;
}

export async function rejectWithdrawal(input: { withdrawalRequestId: string; reviewedByUserId: string; reviewNote?: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ walletAccountId: string; amount: string }[]>`
      update provider_portal.withdrawal_requests
      set status = 'rejected', reviewed_by_user_id = ${input.reviewedByUserId}::uuid, review_note = ${input.reviewNote ?? null}, reviewed_at = now(), last_modified_date = now()
      where id = ${input.withdrawalRequestId}::uuid and status in ('requested','in_review','approved')
      returning wallet_account_id::text as "walletAccountId", amount::text
    `;
    const request = rows[0];
    if (!request) return;
    await tx`
      update provider_portal.provider_wallet_accounts
      set locked_amount = greatest(locked_amount - ${Number(request.amount)}, 0), last_modified_date = now()
      where id = ${request.walletAccountId}::uuid
    `;
    await tx`
      update provider_portal.provider_wallet_transactions
      set status = 'cancelled', last_modified_date = now()
      where withdrawal_request_id = ${input.withdrawalRequestId}::uuid and transaction_type = 'withdrawal'
    `;
  });
}

export async function markWithdrawalPaid(input: { withdrawalRequestId: string; paidByUserId: string; gatewayReference?: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; walletAccountId: string; amount: string; currencyCode: string }[]>`
      update provider_portal.withdrawal_requests
      set status = 'paid', gateway_reference = ${input.gatewayReference ?? null}, paid_at = now(), last_modified_date = now()
      where id = ${input.withdrawalRequestId}::uuid and status in ('approved','processing')
      returning service_provider_id::text as "providerId", wallet_account_id::text as "walletAccountId", amount::text, currency_code as "currencyCode"
    `;
    const request = rows[0];
    if (!request) return;

    await tx`
      update provider_portal.provider_wallet_accounts
      set available_amount = greatest(available_amount - ${Number(request.amount)}, 0), locked_amount = greatest(locked_amount - ${Number(request.amount)}, 0), last_modified_date = now()
      where id = ${request.walletAccountId}::uuid
    `;

    await tx`
      update provider_portal.provider_wallet_transactions
      set status = 'completed', external_reference = ${input.gatewayReference ?? null}, last_modified_date = now()
      where withdrawal_request_id = ${input.withdrawalRequestId}::uuid and transaction_type = 'withdrawal'
    `;

    await tx`
      insert into provider_portal.money_transfers (service_provider_id, source_party_type, source_wallet_account_id, target_party_type, amount, currency_code, transfer_type, status, reference_type, reference_id, external_reference, created_by_user_id, completed_at)
      values (${request.providerId}::uuid, 'provider', ${request.walletAccountId}::uuid, 'bank', ${Number(request.amount)}, ${request.currencyCode}, 'provider_withdrawal', 'completed', 'withdrawal_request', ${input.withdrawalRequestId}::uuid, ${input.gatewayReference ?? null}, ${input.paidByUserId}::uuid, now())
    `;
  });
}

export async function createSettlementBatchFromLedger(input: { providerId: string; periodStart: string; periodEnd: string; currencyCode: string; createdByUserId: string; notes?: string; timeZone?: string }) {
  const { start, endExclusive } = zonedDateRangeToUtc(input.periodStart, input.periodEnd, assertTimeZone(input.timeZone));
  return sql.begin(async (tx) => {
    const batchRows = await tx<{ id: string }[]>`
      insert into provider_portal.settlement_batches (service_provider_id, period_start, period_end, currency_code, status, notes, created_by_user_id)
      values (${input.providerId}::uuid, ${input.periodStart}::date, ${input.periodEnd}::date, ${input.currencyCode}, 'draft', ${input.notes ?? null}, ${input.createdByUserId}::uuid)
      returning id::text as id
    `;
    const batchId = batchRows[0].id;

    await tx`
      insert into provider_portal.settlement_batch_items (settlement_batch_id, booking_id, booking_child_id, charge_line_id, ledger_id, item_type, description, gross_amount, platform_fee_amount, provider_payable_amount, currency_code, metadata)
      select
        ${batchId}::uuid,
        pl.booking_id,
        pl.booking_child_id,
        pl.charge_line_id,
        pl.id,
        case when pl.entry_type = 'reversal' then 'reversal' when pl.entry_type = 'adjustment' then 'adjustment' else 'earning' end,
        coalesce(pl.notes, concat('Provider ', pl.entry_type)),
        coalesce(cl.payment_gross_amount, pl.amount, 0),
        coalesce(cl.platform_fee_amount, 0),
        pl.amount,
        pl.currency_code,
        jsonb_build_object('providerLedgerEntryType', pl.entry_type, 'providerLedgerStatus', pl.status)
      from commercial.provider_ledgers pl
      left join commercial.booking_charge_lines cl on cl.id = pl.charge_line_id
      where pl.provider_id = ${input.providerId}::uuid
        and pl.currency_code = ${input.currencyCode}
        and pl.status = 'approved'
        and pl.created_at >= ${start}::timestamptz and pl.created_at < ${endExclusive}::timestamptz
        and not exists (select 1 from provider_portal.settlement_batch_items sbi where sbi.ledger_id = pl.id)
    `;

    await tx`
      update provider_portal.settlement_batches sb
      set
        gross_amount = coalesce((select sum(gross_amount) from provider_portal.settlement_batch_items where settlement_batch_id = sb.id), 0),
        platform_fee_amount = coalesce((select sum(platform_fee_amount) from provider_portal.settlement_batch_items where settlement_batch_id = sb.id), 0),
        provider_payable_amount = coalesce((select sum(provider_payable_amount) from provider_portal.settlement_batch_items where settlement_batch_id = sb.id), 0),
        payout_amount = coalesce((select sum(provider_payable_amount) from provider_portal.settlement_batch_items where settlement_batch_id = sb.id), 0) + adjustment_amount,
        last_modified_date = now()
      where sb.id = ${batchId}::uuid
    `;

    await tx`
      insert into provider_portal.finance_audit_events (service_provider_id, actor_user_id, event_type, entity_type, entity_id, after_json)
      values (${input.providerId}::uuid, ${input.createdByUserId}::uuid, 'settlement_batch_created', 'settlement_batch', ${batchId}::uuid, jsonb_build_object('periodStart', ${input.periodStart}, 'periodEnd', ${input.periodEnd}, 'currencyCode', ${input.currencyCode}))
    `;

    return batchId;
  });
}

export async function approveSettlementBatch(input: { settlementBatchId: string; approvedByUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; currencyCode: string; payoutAmount: string }[]>`
      update provider_portal.settlement_batches
      set status = 'approved', approved_by_user_id = ${input.approvedByUserId}::uuid, approved_at = now(), last_modified_date = now()
      where id = ${input.settlementBatchId}::uuid and status = 'draft'
      returning service_provider_id::text as "providerId", currency_code as "currencyCode", payout_amount::text as "payoutAmount"
    `;
    const batch = rows[0];
    if (!batch) return;
    const walletId = await ensureProviderWalletAccount(batch.providerId, batch.currencyCode);
    await tx`
      update provider_portal.provider_wallet_accounts
      set available_amount = available_amount + ${Number(batch.payoutAmount)}, last_modified_date = now()
      where id = ${walletId}::uuid
    `;
    await tx`
      insert into provider_portal.provider_wallet_transactions (wallet_account_id, service_provider_id, direction, transaction_type, status, amount, currency_code, settlement_batch_id, counterparty_type, notes, created_by_user_id)
      values (${walletId}::uuid, ${batch.providerId}::uuid, 'credit', 'settlement_credit', 'completed', ${Number(batch.payoutAmount)}, ${batch.currencyCode}, ${input.settlementBatchId}::uuid, 'lsevin', 'Settlement approved and credited to provider wallet', ${input.approvedByUserId}::uuid)
    `;
  });
}

export async function markSettlementPaid(input: { settlementBatchId: string; paidByUserId: string; externalReference?: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; currencyCode: string; payoutAmount: string }[]>`
      update provider_portal.settlement_batches
      set status = 'paid', paid_by_user_id = ${input.paidByUserId}::uuid, paid_at = now(), last_modified_date = now(), metadata = metadata || jsonb_build_object('externalReference', ${input.externalReference ?? null})
      where id = ${input.settlementBatchId}::uuid and status in ('approved','processing')
      returning service_provider_id::text as "providerId", currency_code as "currencyCode", payout_amount::text as "payoutAmount"
    `;
    const batch = rows[0];
    if (!batch) return;
    await tx`
      insert into provider_portal.money_transfers (service_provider_id, source_party_type, target_party_type, amount, currency_code, transfer_type, status, reference_type, reference_id, external_reference, created_by_user_id, completed_at)
      values (${batch.providerId}::uuid, 'lsevin', 'provider', ${Number(batch.payoutAmount)}, ${batch.currencyCode}, 'provider_settlement', 'completed', 'settlement_batch', ${input.settlementBatchId}::uuid, ${input.externalReference ?? null}, ${input.paidByUserId}::uuid, now())
    `;
  });
}

export async function createManualMoneyTransfer(input: { providerId?: string; bookingId?: string; sourcePartyType: string; targetPartyType: string; amount: number; currencyCode: string; transferType: string; notes?: string; createdByUserId: string }) {
  await sql`
    insert into provider_portal.money_transfers (service_provider_id, booking_id, source_party_type, target_party_type, amount, currency_code, transfer_type, status, notes, created_by_user_id)
    values (${input.providerId ? sql`${input.providerId}::uuid` : sql`null`}, ${input.bookingId ? sql`${input.bookingId}::uuid` : sql`null`}, ${input.sourcePartyType}, ${input.targetPartyType}, ${input.amount}, ${input.currencyCode}, ${input.transferType}, 'completed', ${input.notes ?? null}, ${input.createdByUserId}::uuid)
  `;
}

export async function addWalletManualAdjustment(input: { providerId: string; currencyCode: string; amount: number; direction: "credit" | "debit"; notes?: string; createdByUserId: string }) {
  await sql.begin(async (tx) => {
    const walletId = await ensureProviderWalletAccount(input.providerId, input.currencyCode);
    if (input.direction === "credit") {
      await tx`update provider_portal.provider_wallet_accounts set available_amount = available_amount + ${input.amount}, last_modified_date = now() where id = ${walletId}::uuid`;
    } else {
      await tx`update provider_portal.provider_wallet_accounts set available_amount = greatest(available_amount - ${input.amount}, 0), last_modified_date = now() where id = ${walletId}::uuid`;
    }
    await tx`
      insert into provider_portal.provider_wallet_transactions (wallet_account_id, service_provider_id, direction, transaction_type, status, amount, currency_code, counterparty_type, notes, created_by_user_id)
      values (${walletId}::uuid, ${input.providerId}::uuid, ${input.direction}, 'manual_adjustment', 'completed', ${input.amount}, ${input.currencyCode}, 'lsevin', ${input.notes ?? 'Manual wallet adjustment'}, ${input.createdByUserId}::uuid)
    `;
  });
}

export async function getSettlementBatchForPayment(providerId: string, settlementBatchId: string) {
  const rows = await sql<{ id: string; providerId: string; settlementNumber: string; payoutAmount: string; currencyCode: string; status: string }[]>`
    select
      id::text,
      service_provider_id::text as "providerId",
      settlement_number as "settlementNumber",
      payout_amount::text as "payoutAmount",
      currency_code as "currencyCode",
      status
    from provider_portal.settlement_batches
    where service_provider_id = ${providerId}::uuid and id = ${settlementBatchId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function attachPaymentBillingInvoiceToSettlement(input: { settlementBatchId: string; invoiceId: string; invoiceNumber: string }) {
  await sql`
    update provider_portal.settlement_batches
    set metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ paymentBilling: input })}::jsonb,
        last_modified_date = now()
    where id = ${input.settlementBatchId}::uuid
  `;
}


export async function searchPayoutAccountOptions(input:{providerId:string;query?:string;selected?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select pa.id::text as value,
      trim(concat_ws(' · ',pa.account_holder_name,pa.bank_name,pa.currency_code)) as label,
      nullif(trim(concat_ws(' · ',pa.iban,case when pa.account_number_last4 is not null then '••••'||pa.account_number_last4 else null end)), '') as description
    from provider_portal.payout_accounts pa where pa.service_provider_id=${input.providerId}::uuid
      and (${query}='' or pa.id::text ilike '%'||${query}||'%' or coalesce(pa.account_holder_name,'') ilike '%'||${query}||'%' or coalesce(pa.bank_name,'') ilike '%'||${query}||'%' or coalesce(pa.iban,'') ilike '%'||${query}||'%')
    order by case when pa.id::text=${selected} then 0 else 1 end,pa.is_default desc,pa.create_date desc limit ${limit}`;
}
export async function searchFinanceStaffOptions(input:{providerId:string;query?:string;selected?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select st.id::text as value, coalesce(st.name_translations->>'fa-IR',st.name_translations->>'fa',st.id::text) as label,
      nullif(trim(concat_ws(' · ',coalesce(st.title_translations->>'fa-IR',st.title_translations->>'fa'),st.specialty)),'') as description
    from category.provider_staffs ps join category.staff st on st.id=ps.staff_id and st.is_active=true
    where ps.service_provider_id=${input.providerId}::uuid and ps.is_active=true
      and (${query}='' or st.id::text ilike '%'||${query}||'%' or coalesce(st.specialty,'') ilike '%'||${query}||'%'
        or exists(select 1 from jsonb_each_text(coalesce(st.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when st.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}


export async function listProviderBookingEarnings(input:{providerId:string;staffId?:string;range?:DateRangeInput;limit?:number}):Promise<BookingEarningRow[]> {
  const {currencyCode,start,endExclusive}=rangeOrDefault(input.range); const staffId=input.staffId?.trim()??''; const limit=Math.min(500,Math.max(1,input.limit??250));
  return sql<BookingEarningRow[]>`
    with latest_assignment as (
      select distinct on (ba.booking_id) ba.booking_id,ba.staff_id
      from booking_management.booking_assignments ba
      where ba.service_provider_id=${input.providerId}::uuid and ba.assignment_status='assigned'
      order by ba.booking_id,ba.created_at desc
    ), charges as (
      select booking_id,coalesce(sum(settlement_gross_amount),0) gross,coalesce(sum(platform_fee_amount),0) fee,coalesce(sum(provider_payable_amount),0) payable
      from commercial.booking_charge_lines where provider_id=${input.providerId}::uuid and settlement_currency_code=${currencyCode} group by booking_id
    ), reversals as (
      select booking_id,coalesce(sum(amount) filter(where status in ('pending','applied')),0) reversal
      from commercial.provider_settlement_reversals where provider_id=${input.providerId}::uuid and currency_code=${currencyCode} group by booking_id
    ), ledgers as (
      select booking_id,coalesce(sum(amount) filter(where status='pending'),0) pending,coalesce(sum(amount) filter(where status='approved'),0) approved,coalesce(sum(abs(amount)) filter(where status='paid' or entry_type='payout'),0) paid
      from commercial.provider_ledgers where provider_id=${input.providerId}::uuid and currency_code=${currencyCode} group by booking_id
    ), settlement as (
      select distinct on (sbi.booking_id) sbi.booking_id,sb.settlement_number,sb.status
      from provider_portal.settlement_batch_items sbi join provider_portal.settlement_batches sb on sb.id=sbi.settlement_batch_id
      where sb.service_provider_id=${input.providerId}::uuid and sb.currency_code=${currencyCode}
      order by sbi.booking_id,sb.create_date desc
    )
    select b.id::text "bookingId",coalesce(b.selected_date::text,b.create_date::date::text) "bookingDate",coalesce(b.booking_status,'Unknown') "bookingStatus",b.payment_status "paymentStatus",
      la.staff_id::text "staffId",coalesce(common.get_translation_t(st.name_translations,'fa-IR','en-US'),st.id::text) "staffName",${currencyCode}::text "currencyCode",
      coalesce(ch.gross,0)::text "grossAmount",coalesce(ch.fee,0)::text "platformFeeAmount",coalesce(ch.payable,0)::text "providerPayableAmount",coalesce(rv.reversal,0)::text "refundReversalAmount",greatest(coalesce(ch.payable,0)-coalesce(rv.reversal,0),0)::text "netProviderPayableAmount",
      coalesce(lg.pending,0)::text "ledgerPendingAmount",coalesce(lg.approved,0)::text "ledgerApprovedAmount",coalesce(lg.paid,0)::text "ledgerPaidAmount",se.settlement_number "settlementNumber",se.status "settlementStatus",
      rule.id::text "compensationRuleId",rule.calculation_mode "compensationMode",coalesce(rule.percent_value,0)::text "compensationPercent",coalesce(rule.fixed_amount,0)::text "compensationFixedAmount",
      case when lower(coalesce(b.payment_status,'')) in ('paid','captured','succeeded','authorized') and lower(coalesce(b.booking_status,'')) not in ('cancelled','canceled','noshow','no_show') and la.staff_id is not null
        then round((case when rule.calculation_mode in ('percent','hybrid') then greatest(coalesce(ch.payable,0)-coalesce(rv.reversal,0),0)*coalesce(rule.percent_value,0)/100 else 0 end)+(case when rule.calculation_mode in ('fixed','hybrid') then coalesce(rule.fixed_amount,0) else 0 end),2) else 0 end::text "estimatedStaffCompensation",
      coalesce(pay.amount,0)::text "staffPaymentAmount",pay.status "staffPaymentStatus",pay.paid_at::text "staffPaidAt"
    from booking.bookings b
    left join latest_assignment la on la.booking_id=b.id left join category.staff st on st.id=la.staff_id
    left join charges ch on ch.booking_id=b.id left join reversals rv on rv.booking_id=b.id left join ledgers lg on lg.booking_id=b.id left join settlement se on se.booking_id=b.id
    left join lateral(select scr.* from provider_portal.staff_compensation_rules scr where scr.service_provider_id=${input.providerId}::uuid and scr.staff_id=la.staff_id and scr.currency_code=${currencyCode} and scr.is_active=true and scr.effective_from<=coalesce(b.selected_date,b.create_date::date) and (scr.effective_to is null or scr.effective_to>=coalesce(b.selected_date,b.create_date::date)) order by scr.effective_from desc,scr.create_date desc limit 1) rule on true
    left join provider_portal.staff_compensation_payments pay on pay.service_provider_id=${input.providerId}::uuid and pay.staff_id=la.staff_id and pay.booking_id=b.id and pay.currency_code=${currencyCode} and pay.status<>'cancelled'
    where b.provider_id=${input.providerId}::uuid and b.create_date>=${start}::timestamptz and b.create_date<${endExclusive}::timestamptz and (${staffId}='' or la.staff_id=nullif(${staffId},'')::uuid)
    order by b.create_date desc limit ${limit}`;
}

export async function getBookingEarningsSummary(input:{providerId:string;staffId?:string;range?:DateRangeInput}):Promise<BookingEarningsSummary>{
  const rows=await listProviderBookingEarnings({...input,limit:500});
  const sum=(key:keyof BookingEarningRow)=>rows.reduce((a,row)=>a+Number(row[key]||0),0).toFixed(2);
  const estimated=Number(sum('estimatedStaffCompensation')), paid=Number(sum('staffPaymentAmount'));
  return {bookingsCount:rows.length,grossAmount:sum('grossAmount'),platformFeeAmount:sum('platformFeeAmount'),providerPayableAmount:sum('providerPayableAmount'),refundReversalAmount:sum('refundReversalAmount'),netProviderPayableAmount:sum('netProviderPayableAmount'),staffCompensationEstimated:estimated.toFixed(2),staffCompensationPaid:paid.toFixed(2),staffCompensationOutstanding:Math.max(estimated-paid,0).toFixed(2)};
}
export async function listStaffCompensationRules(providerId:string):Promise<StaffCompensationRule[]>{ return sql<StaffCompensationRule[]>`select scr.id::text,scr.service_provider_id::text "providerId",scr.staff_id::text "staffId",coalesce(common.get_translation_t(st.name_translations,'fa-IR','en-US'),st.id::text) "staffName",scr.calculation_mode "calculationMode",scr.percent_value::text "percentValue",scr.fixed_amount::text "fixedAmount",scr.currency_code "currencyCode",scr.effective_from::text "effectiveFrom",scr.effective_to::text "effectiveTo",scr.is_active "isActive",scr.notes,scr.create_date::text "createdAt" from provider_portal.staff_compensation_rules scr join category.staff st on st.id=scr.staff_id where scr.service_provider_id=${providerId}::uuid order by scr.is_active desc,scr.effective_from desc`; }
export async function listStaffFinanceProfilesForUser(userId:string):Promise<StaffFinanceProfile[]>{ return sql<StaffFinanceProfile[]>`select distinct on(pc.target_id,pc.service_provider_id) pc.target_id::text "staffId",pc.service_provider_id::text "providerId",coalesce(common.get_translation_t(st.name_translations,'fa-IR','en-US'),st.id::text) "staffName",coalesce(common.get_translation_t(sp.name_translations,'fa-IR','en-US'),sp.email,sp.id::text) "providerName" from provider_portal_ext.profile_claims pc join category.staff st on st.id=pc.target_id and st.is_active=true join category.provider_staffs ps on ps.staff_id=st.id and ps.service_provider_id=pc.service_provider_id and ps.is_active=true join category.service_providers sp on sp.id=pc.service_provider_id and sp.is_active=true where pc.claimant_user_id=${userId}::uuid and pc.target_type='staff' and pc.service_provider_id is not null and pc.status='approved' and pc.clinic_review_status='approved' and pc.lsevin_review_status='approved' and pc.payment_status in ('not_required','paid','waived') order by pc.target_id,pc.service_provider_id,pc.updated_at desc`; }
export async function saveStaffCompensationRule(input:{providerId:string;staffId:string;calculationMode:'percent'|'fixed'|'hybrid';percentValue:number;fixedAmount:number;currencyCode:string;effectiveFrom:string;effectiveTo?:string;notes?:string;createdByUserId:string}){
  if(!['percent','fixed','hybrid'].includes(input.calculationMode)) throw new Error('Invalid staff compensation mode.'); if(input.percentValue<0||input.percentValue>100||input.fixedAmount<0) throw new Error('Invalid compensation value.');
  await sql.begin(async tx=>{ const staff=await tx<{ok:boolean}[]>`select true ok from category.provider_staffs ps join category.staff st on st.id=ps.staff_id where ps.service_provider_id=${input.providerId}::uuid and ps.staff_id=${input.staffId}::uuid and ps.is_active=true and st.is_active=true limit 1`; if(!staff[0]?.ok) throw new Error('Selected staff is not active in this provider workspace.'); await tx`update provider_portal.staff_compensation_rules set is_active=false,last_modified_date=now() where service_provider_id=${input.providerId}::uuid and staff_id=${input.staffId}::uuid and currency_code=${input.currencyCode.toUpperCase()} and is_active=true`; await tx`insert into provider_portal.staff_compensation_rules(service_provider_id,staff_id,calculation_mode,percent_value,fixed_amount,currency_code,effective_from,effective_to,is_active,notes,created_by_user_id) values(${input.providerId}::uuid,${input.staffId}::uuid,${input.calculationMode},${input.percentValue},${input.fixedAmount},${input.currencyCode.toUpperCase()},${input.effectiveFrom}::date,nullif(${input.effectiveTo??''},'')::date,true,nullif(${input.notes??''},''),${input.createdByUserId}::uuid)`; });
}
export async function disableStaffCompensationRule(input:{providerId:string;ruleId:string}){ await sql`update provider_portal.staff_compensation_rules set is_active=false,last_modified_date=now() where id=${input.ruleId}::uuid and service_provider_id=${input.providerId}::uuid`; }
export async function markStaffBookingCompensationPaid(input:{providerId:string;staffId:string;bookingId:string;currencyCode:string;paidByUserId:string;notes?:string}){
  const currencyCode=input.currencyCode.toUpperCase(); const rows=await listProviderBookingEarnings({providerId:input.providerId,staffId:input.staffId,range:{from:'2000-01-01',to:'2100-01-01',currencyCode},limit:500}); const row=rows.find(r=>r.bookingId===input.bookingId); if(!row) throw new Error('Eligible assigned booking was not found.'); const amount=Number(row.estimatedStaffCompensation); if(!(amount>0)) throw new Error('This booking has no payable staff compensation.');
  await sql`insert into provider_portal.staff_compensation_payments(service_provider_id,staff_id,booking_id,amount,currency_code,status,compensation_rule_id,notes,created_by_user_id,paid_by_user_id,paid_at) values(${input.providerId}::uuid,${input.staffId}::uuid,${input.bookingId}::uuid,${amount},${currencyCode},'paid',nullif(${row.compensationRuleId||''},'')::uuid,nullif(${input.notes||''},''),${input.paidByUserId}::uuid,${input.paidByUserId}::uuid,now()) on conflict(service_provider_id,staff_id,booking_id,currency_code) do update set amount=excluded.amount,status='paid',compensation_rule_id=excluded.compensation_rule_id,notes=excluded.notes,paid_by_user_id=excluded.paid_by_user_id,paid_at=now(),last_modified_date=now()`;
}
