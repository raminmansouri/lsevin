import "server-only";
import { sql } from "@core/db/client";
import type { DateRangeInput } from "./types";
import {
  ECONOMICS_CONCENTRATION_PERCENT,
  ECONOMICS_QUEUE_LIMIT,
  ECONOMICS_REFUND_DRAG_PERCENT,
  type ProviderEconomicsPulse,
  type ProviderEconomicsSignal,
  type ProviderServiceEconomicsRow,
} from "./marketTypes";

type RawRow = Omit<ProviderServiceEconomicsRow, "providerSharePercent" | "refundDragPercent" | "retainedRevenueSharePercent" | "signals">;

function normalizedRange(range?: DateRangeInput) {
  const now = new Date();
  const to = range?.to || now.toISOString().slice(0, 10);
  const from = range?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const currencyCode = String(range?.currencyCode || "USD").trim().toUpperCase();
  return { from, to, currencyCode };
}

function n(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(numerator: number, denominator: number) {
  if (!(denominator > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

export async function getProviderEconomicsPulse(providerId: string, range?: DateRangeInput): Promise<ProviderEconomicsPulse> {
  const normalized = normalizedRange(range);
  const { from, to, currencyCode } = normalized;

  const rows = await sql<RawRow[]>`
    with completed_charges as (
      select
        cl.id,
        cl.booking_id,
        coalesce(cl.provider_service_id, b.service_id) as provider_service_id,
        cl.settlement_gross_amount,
        cl.platform_fee_amount,
        cl.provider_payable_amount
      from commercial.booking_charge_lines cl
      join booking.bookings b on b.id = cl.booking_id
      where cl.provider_id = ${providerId}::uuid
        and b.provider_id = ${providerId}::uuid
        and lower(coalesce(b.booking_status, '')) = 'completed'
        and cl.settlement_currency_code = ${currencyCode}
        and coalesce(b.selected_date, b.create_date::date) between ${from}::date and ${to}::date
        and coalesce(cl.provider_service_id, b.service_id) is not null
    ),
    reversals_by_charge as (
      select
        rl.charge_line_id,
        coalesce(sum(abs(psr.amount)) filter (where psr.status = 'applied'), 0) as applied_reversal_amount,
        coalesce(sum(abs(psr.amount)) filter (where psr.status = 'pending'), 0) as pending_reversal_amount
      from commercial.provider_settlement_reversals psr
      join commercial.refund_lines rl on rl.id = psr.refund_line_id
      join completed_charges cc on cc.id = rl.charge_line_id
      where psr.provider_id = ${providerId}::uuid
        and psr.currency_code = ${currencyCode}
      group by rl.charge_line_id
    ),
    ledger_by_charge as (
      select
        pl.charge_line_id,
        coalesce(sum(abs(pl.amount)) filter (where pl.status = 'pending' and pl.entry_type in ('earning','adjustment')), 0) as pending_ledger_amount,
        coalesce(sum(abs(pl.amount)) filter (where pl.status = 'approved' and pl.entry_type in ('earning','adjustment')), 0) as approved_ledger_amount,
        coalesce(sum(abs(pl.amount)) filter (where pl.status = 'paid' and pl.entry_type in ('earning','adjustment','payout')), 0) as paid_ledger_amount
      from commercial.provider_ledgers pl
      join completed_charges cc on cc.id = pl.charge_line_id
      where pl.provider_id = ${providerId}::uuid
        and pl.currency_code = ${currencyCode}
      group by pl.charge_line_id
    )
    select
      ps.id::text as "providerServiceId",
      ps.display_name_translations as "nameTranslations",
      count(distinct cc.booking_id)::int as "completedBookings",
      coalesce(sum(cc.settlement_gross_amount), 0)::text as "settlementGrossAmount",
      coalesce(sum(cc.platform_fee_amount), 0)::text as "platformFeeAmount",
      coalesce(sum(cc.provider_payable_amount), 0)::text as "providerPayableAmount",
      coalesce(sum(rb.applied_reversal_amount), 0)::text as "appliedReversalAmount",
      coalesce(sum(rb.pending_reversal_amount), 0)::text as "pendingReversalAmount",
      greatest(coalesce(sum(cc.provider_payable_amount), 0) - coalesce(sum(rb.applied_reversal_amount), 0), 0)::text as "retainedProviderPayableAmount",
      coalesce(sum(lb.pending_ledger_amount), 0)::text as "pendingLedgerAmount",
      coalesce(sum(lb.approved_ledger_amount), 0)::text as "approvedLedgerAmount",
      coalesce(sum(lb.paid_ledger_amount), 0)::text as "paidLedgerAmount"
    from completed_charges cc
    join category.provider_services ps on ps.id = cc.provider_service_id and ps.service_provider_id = ${providerId}::uuid
    left join reversals_by_charge rb on rb.charge_line_id = cc.id
    left join ledger_by_charge lb on lb.charge_line_id = cc.id
    group by ps.id, ps.display_name_translations
    order by greatest(coalesce(sum(cc.provider_payable_amount), 0) - coalesce(sum(rb.applied_reversal_amount), 0), 0) desc, count(distinct cc.booking_id) desc
  `;

  const retainedTotal = rows.reduce((sum, row) => sum + n(row.retainedProviderPayableAmount), 0);
  const enriched = rows.map<ProviderServiceEconomicsRow>((row) => {
    const gross = n(row.settlementGrossAmount);
    const payable = n(row.providerPayableAmount);
    const applied = n(row.appliedReversalAmount);
    const retained = n(row.retainedProviderPayableAmount);
    const share = pct(retained, retainedTotal);
    const signals: ProviderEconomicsSignal[] = [];
    if (payable > 0 && pct(applied, payable) >= ECONOMICS_REFUND_DRAG_PERCENT) signals.push("refund_drag");
    if (rows.length > 1 && retained > 0 && share >= ECONOMICS_CONCENTRATION_PERCENT) signals.push("revenue_concentration");
    if (n(row.pendingLedgerAmount) > 0 || n(row.approvedLedgerAmount) > 0 || n(row.pendingReversalAmount) > 0) signals.push("settlement_in_progress");
    return {
      ...row,
      providerSharePercent: pct(retained, gross),
      refundDragPercent: pct(applied, payable),
      retainedRevenueSharePercent: share,
      signals,
    };
  });

  const attentionQueue = enriched
    .filter((row) => row.signals.length > 0)
    .sort((a, b) => {
      const refundPriority = Number(b.signals.includes("refund_drag")) - Number(a.signals.includes("refund_drag"));
      if (refundPriority) return refundPriority;
      const settlementPriority = Number(b.signals.includes("settlement_in_progress")) - Number(a.signals.includes("settlement_in_progress"));
      if (settlementPriority) return settlementPriority;
      return n(b.retainedProviderPayableAmount) - n(a.retainedProviderPayableAmount);
    })
    .slice(0, ECONOMICS_QUEUE_LIMIT);

  return {
    range: normalized,
    completedBookings: enriched.reduce((sum, row) => sum + row.completedBookings, 0),
    settlementGrossAmount: String(enriched.reduce((sum, row) => sum + n(row.settlementGrossAmount), 0)),
    platformFeeAmount: String(enriched.reduce((sum, row) => sum + n(row.platformFeeAmount), 0)),
    providerPayableAmount: String(enriched.reduce((sum, row) => sum + n(row.providerPayableAmount), 0)),
    appliedReversalAmount: String(enriched.reduce((sum, row) => sum + n(row.appliedReversalAmount), 0)),
    pendingReversalAmount: String(enriched.reduce((sum, row) => sum + n(row.pendingReversalAmount), 0)),
    retainedProviderPayableAmount: String(retainedTotal),
    pendingLedgerAmount: String(enriched.reduce((sum, row) => sum + n(row.pendingLedgerAmount), 0)),
    approvedLedgerAmount: String(enriched.reduce((sum, row) => sum + n(row.approvedLedgerAmount), 0)),
    paidLedgerAmount: String(enriched.reduce((sum, row) => sum + n(row.paidLedgerAmount), 0)),
    topServiceRevenueSharePercent: enriched[0]?.retainedRevenueSharePercent || 0,
    servicesWithRefundDrag: enriched.filter((row) => row.signals.includes("refund_drag")).length,
    servicesWithSettlementInProgress: enriched.filter((row) => row.signals.includes("settlement_in_progress")).length,
    rows: enriched,
    attentionQueue,
  };
}
