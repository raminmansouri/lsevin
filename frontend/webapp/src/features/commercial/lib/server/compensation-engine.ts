import 'server-only';

import sql from '@/config/database/db';
import type { CompensationPolicy } from '../../types';

export type BookingChargeLine = {
  id: string;
  bookingId: string;
  bookingChildId?: string | null;
  bookingAddonId?: string | null;
  providerId?: string | null;
  providerTypeId?: string | null;
  providerServiceId?: string | null;
  serviceDefinitionId?: string | null;
  addonId?: string | null;
  policyId?: string | null;
  lineType: 'main_service' | 'child_booking' | 'addon';
  sourceType?: string | null;
  description: string;
  quantity: number;
  sourceCurrencyCode: string;
  displayCurrencyCode?: string | null;
  paymentCurrencyCode: string;
  settlementCurrencyCode: string;
  sourceGrossAmount: number;
  paymentGrossAmount: number;
  settlementGrossAmount: number;
  discountAmount: number;
  netAmount: number;
  platformFeeAmount: number;
  providerPayableAmount: number;
  gatewayFeeAmount: number;
  exchangeRate?: number | null;
  exchangeRateIds: string[];
  fxQuoteId?: string | null;
  snapshotJson: Record<string, unknown>;
};

function clampMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function loadBookingContext(bookingId: string) {
  const [booking] = await sql<any[]>`
    select
      b.id,
      b.provider_id as "providerId",
      b.service_id as "providerServiceId",
      b.user_id as "userId",
      coalesce(b.source_currency_code, ps.currency, b.currency_code, 'USD') as "sourceCurrencyCode",
      coalesce(b.display_currency_code, b.currency_code, ps.currency, 'USD') as "displayCurrencyCode",
      coalesce(b.payment_currency_code, b.currency_code, ps.currency, 'USD') as "paymentCurrencyCode",
      coalesce(b.settlement_currency_code, b.source_currency_code, ps.currency, b.currency_code, 'USD') as "settlementCurrencyCode",
      coalesce(b.source_subtotal_amount, ps.value, 0)::float8 as "sourceSubtotalAmount",
      coalesce(b.source_addons_amount, 0)::float8 as "sourceAddonsAmount",
      coalesce(b.display_addons_amount, b.addons_amount, 0)::float8 as "displayAddonsAmount",
      coalesce(b.total_amount, 0)::float8 as "paymentTotalAmount",
      b.exchange_rate::float8 as "exchangeRate",
      coalesce(b.exchange_rate_ids, array[]::uuid[]) as "exchangeRateIds",
      b.fx_quote_id as "fxQuoteId",
      coalesce(b.pricing_snapshot, '{}'::jsonb) as "pricingSnapshot",
      ps.service_definition_id as "serviceDefinitionId",
      sp.provider_type_id as "providerTypeId",
      common.get_translation_t(ps.display_name_translations, 'en-US', 'en') as "providerServiceName"
    from booking.bookings b
    left join category.provider_services ps on ps.id = b.service_id
    left join category.service_providers sp on sp.id = b.provider_id
    where b.id = ${bookingId}
    limit 1
  `;

  if (!booking) throw new Error('Booking not found for commercial processing.');

  const children = await sql<any[]>`
    select cb.*, ps.service_definition_id as "serviceDefinitionId",
           common.get_translation_t(ps.display_name_translations, 'en-US', 'en') as "providerServiceName"
    from booking.booking_child_bookings cb
    left join category.provider_services ps on ps.id = cb.service_id
    where cb.parent_booking_id = ${bookingId}
    order by cb.create_date asc
  `;

  const addons = await sql<any[]>`
    select ba.*, a.name as "addonName"
    from booking.booking_addons ba
    left join category.addons a on a.id = ba.addon_id
    where ba.booking_id = ${bookingId}
    order by ba.created_at asc
  `;

  return { booking, children, addons };
}

export async function resolveCompensationPolicy(input: {
  appliesTo: 'main_booking' | 'child_booking' | 'addon';
  providerTypeId?: string | null;
  providerId?: string | null;
  serviceDefinitionId?: string | null;
  providerServiceId?: string | null;
  addonId?: string | null;
}) {
  const rows = await sql<CompensationPolicy[]>`
    select id, name, description,
      scope_type as "scopeType", scope_id as "scopeId", applies_to as "appliesTo",
      fee_mode as "feeMode", platform_percent::float8 as "platformPercent",
      platform_fixed_amount::float8 as "platformFixedAmount",
      minimum_platform_amount::float8 as "minimumPlatformAmount",
      provider_percent_override::float8 as "providerPercentOverride",
      gateway_fee_mode as "gatewayFeeMode", currency_code as "currencyCode",
      priority, is_active as "isActive",
      effective_from::text as "effectiveFrom", effective_to::text as "effectiveTo", metadata
    from commercial.compensation_policies
    where is_active = true
      and applies_to = ${input.appliesTo}
      and (effective_from is null or effective_from <= now())
      and (effective_to is null or effective_to >= now())
      and (
        (scope_type = 'provider_service' and scope_id = ${input.providerServiceId ?? null})
        or (scope_type = 'service_definition' and scope_id = ${input.serviceDefinitionId ?? null})
        or (scope_type = 'provider' and scope_id = ${input.providerId ?? null})
        or (scope_type = 'provider_type' and scope_id = ${input.providerTypeId ?? null})
        or (scope_type = 'addon' and scope_id = ${input.addonId ?? null})
        or (scope_type = 'global')
      )
    order by case scope_type
      when 'provider_service' then 1
      when 'service_definition' then 2
      when 'provider' then 3
      when 'provider_type' then 4
      when 'addon' then 5
      when 'global' then 6
      else 99 end asc,
      priority asc,
      created_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export function computeChargeAmounts(input: { grossAmount: number; discountAmount?: number; policy: CompensationPolicy | null }) {
  const grossAmount = clampMoney(input.grossAmount);
  const discountAmount = clampMoney(input.discountAmount ?? 0);
  const netAmount = clampMoney(Math.max(grossAmount - discountAmount, 0));

  if (!input.policy) {
    return { grossAmount, discountAmount, netAmount, platformFeeAmount: 0, providerPayableAmount: netAmount, gatewayFeeAmount: 0 };
  }

  let platformFeeAmount = 0;
  if (input.policy.feeMode === 'percent') platformFeeAmount = clampMoney(netAmount * (input.policy.platformPercent / 100));
  else if (input.policy.feeMode === 'fixed') platformFeeAmount = clampMoney(input.policy.platformFixedAmount);
  else platformFeeAmount = clampMoney((netAmount * (input.policy.platformPercent / 100)) + input.policy.platformFixedAmount);

  platformFeeAmount = clampMoney(Math.max(platformFeeAmount, input.policy.minimumPlatformAmount));
  platformFeeAmount = clampMoney(Math.min(platformFeeAmount, netAmount));

  return {
    grossAmount,
    discountAmount,
    netAmount,
    platformFeeAmount,
    providerPayableAmount: clampMoney(Math.max(netAmount - platformFeeAmount, 0)),
    gatewayFeeAmount: 0,
  };
}

export async function buildBookingChargeLinesForBooking(bookingId: string): Promise<BookingChargeLine[]> {
  const { booking, children, addons } = await loadBookingContext(bookingId);
  const lines: BookingChargeLine[] = [];

  const mainPolicy = await resolveCompensationPolicy({
    appliesTo: 'main_booking',
    providerTypeId: booking.providerTypeId,
    providerId: booking.providerId,
    serviceDefinitionId: booking.serviceDefinitionId,
    providerServiceId: booking.providerServiceId,
  });

  const mainGross = Math.max(Number(booking.paymentTotalAmount ?? 0) - Number(booking.displayAddonsAmount ?? 0), 0);
  const mainComputed = computeChargeAmounts({ grossAmount: mainGross, policy: mainPolicy });

  lines.push({
    id: crypto.randomUUID(),
    bookingId,
    providerId: booking.providerId,
    providerTypeId: booking.providerTypeId,
    providerServiceId: booking.providerServiceId,
    serviceDefinitionId: booking.serviceDefinitionId,
    policyId: mainPolicy?.id ?? null,
    lineType: 'main_service',
    sourceType: 'provider',
    description: booking.providerServiceName ?? 'Main booking service',
    quantity: 1,
    sourceCurrencyCode: booking.sourceCurrencyCode ?? booking.paymentCurrencyCode ?? 'USD',
    displayCurrencyCode: booking.displayCurrencyCode,
    paymentCurrencyCode: booking.paymentCurrencyCode ?? 'USD',
    settlementCurrencyCode: booking.settlementCurrencyCode ?? booking.sourceCurrencyCode ?? booking.paymentCurrencyCode ?? 'USD',
    sourceGrossAmount: Number(booking.sourceSubtotalAmount ?? mainComputed.grossAmount),
    paymentGrossAmount: mainComputed.grossAmount,
    settlementGrossAmount: Number(booking.sourceSubtotalAmount ?? mainComputed.grossAmount),
    discountAmount: mainComputed.discountAmount,
    netAmount: mainComputed.netAmount,
    platformFeeAmount: mainComputed.platformFeeAmount,
    providerPayableAmount: mainComputed.providerPayableAmount,
    gatewayFeeAmount: 0,
    exchangeRate: booking.exchangeRate,
    exchangeRateIds: (booking.exchangeRateIds ?? []).map(String),
    fxQuoteId: booking.fxQuoteId,
    snapshotJson: { pricingSnapshot: booking.pricingSnapshot ?? {}, policy: mainPolicy },
  });

  for (const child of children) {
    const childPolicy = await resolveCompensationPolicy({
      appliesTo: 'child_booking',
      providerId: child.provider_id,
      providerServiceId: child.service_id,
      serviceDefinitionId: child.serviceDefinitionId,
      providerTypeId: child.provider_type_id,
    });
    const computed = computeChargeAmounts({ grossAmount: Number(child.subtotal_amount ?? 0), policy: childPolicy });
    lines.push({
      id: crypto.randomUUID(), bookingId, bookingChildId: child.id,
      providerId: child.provider_id, providerTypeId: child.provider_type_id, providerServiceId: child.service_id, serviceDefinitionId: child.serviceDefinitionId,
      policyId: childPolicy?.id ?? null, lineType: 'child_booking', sourceType: 'provider', description: child.providerServiceName ?? 'Child booking',
      quantity: 1, sourceCurrencyCode: child.currency ?? booking.sourceCurrencyCode ?? 'USD', displayCurrencyCode: child.currency ?? booking.displayCurrencyCode,
      paymentCurrencyCode: booking.paymentCurrencyCode ?? child.currency ?? 'USD', settlementCurrencyCode: child.currency ?? booking.sourceCurrencyCode ?? 'USD',
      sourceGrossAmount: Number(child.subtotal_amount ?? 0), paymentGrossAmount: Number(child.subtotal_amount ?? 0), settlementGrossAmount: Number(child.subtotal_amount ?? 0),
      discountAmount: 0, netAmount: computed.netAmount, platformFeeAmount: computed.platformFeeAmount, providerPayableAmount: computed.providerPayableAmount, gatewayFeeAmount: 0,
      exchangeRateIds: [], snapshotJson: { childBooking: child, policy: childPolicy },
    });
  }

  for (const addon of addons) {
    const addonPolicy = await resolveCompensationPolicy({ appliesTo: 'addon', addonId: addon.addon_id, providerId: booking.providerId, providerTypeId: booking.providerTypeId });
    const gross = Number(addon.display_unit_price ?? addon.unit_price ?? 0) * Number(addon.quantity ?? 1);
    const computed = computeChargeAmounts({ grossAmount: gross, policy: addonPolicy });
    const sourceGross = Number(addon.source_unit_price ?? addon.unit_price ?? 0) * Number(addon.quantity ?? 1);
    lines.push({
      id: crypto.randomUUID(), bookingId, bookingAddonId: addon.id,
      providerId: addon.source_type === 'provider' ? booking.providerId : null,
      providerTypeId: addon.source_type === 'provider' ? booking.providerTypeId : null,
      addonId: addon.addon_id, policyId: addonPolicy?.id ?? null, lineType: 'addon', sourceType: addon.source_type, description: addon.addonName ?? 'Addon', quantity: Number(addon.quantity ?? 1),
      sourceCurrencyCode: addon.currency_code ?? booking.sourceCurrencyCode ?? 'USD', displayCurrencyCode: booking.displayCurrencyCode, paymentCurrencyCode: booking.paymentCurrencyCode ?? 'USD',
      settlementCurrencyCode: addon.source_type === 'provider' ? (addon.currency_code ?? booking.sourceCurrencyCode ?? 'USD') : (booking.paymentCurrencyCode ?? 'USD'),
      sourceGrossAmount: sourceGross, paymentGrossAmount: gross,
      settlementGrossAmount: addon.source_type === 'provider' ? sourceGross : gross,
      discountAmount: 0, netAmount: computed.netAmount, platformFeeAmount: computed.platformFeeAmount,
      providerPayableAmount: addon.source_type === 'provider' ? computed.providerPayableAmount : 0, gatewayFeeAmount: 0,
      exchangeRate: addon.exchange_rate, exchangeRateIds: (addon.exchange_rate_ids ?? []).map(String), fxQuoteId: addon.fx_quote_id,
      snapshotJson: { addon, policy: addonPolicy },
    });
  }

  return lines;
}

export async function persistChargeLinesAndLedgers(bookingId: string, chargeLines: BookingChargeLine[]) {
  return sql.begin(async (tx) => {
    await tx`delete from commercial.provider_ledgers where booking_id = ${bookingId} and entry_type = 'earning'`;
    await tx`delete from commercial.booking_charge_lines where booking_id = ${bookingId}`;

    for (const line of chargeLines) {
      await tx`
        insert into commercial.booking_charge_lines (
          id, booking_id, booking_child_id, booking_addon_id,
          provider_id, provider_type_id, provider_service_id, service_definition_id,
          addon_id, policy_id, line_type, source_type, description, quantity,
          source_currency_code, display_currency_code, payment_currency_code, settlement_currency_code,
          source_gross_amount, payment_gross_amount, settlement_gross_amount,
          discount_amount, net_amount, platform_fee_amount, provider_payable_amount, gateway_fee_amount,
          exchange_rate, exchange_rate_ids, fx_quote_id, snapshot_json
        ) values (
          ${line.id}, ${line.bookingId}, ${line.bookingChildId ?? null}, ${line.bookingAddonId ?? null},
          ${line.providerId ?? null}, ${line.providerTypeId ?? null}, ${line.providerServiceId ?? null}, ${line.serviceDefinitionId ?? null},
          ${line.addonId ?? null}, ${line.policyId ?? null}, ${line.lineType}, ${line.sourceType ?? null}, ${line.description}, ${line.quantity},
          ${line.sourceCurrencyCode}, ${line.displayCurrencyCode ?? null}, ${line.paymentCurrencyCode}, ${line.settlementCurrencyCode},
          ${line.sourceGrossAmount}, ${line.paymentGrossAmount}, ${line.settlementGrossAmount},
          ${line.discountAmount}, ${line.netAmount}, ${line.platformFeeAmount}, ${line.providerPayableAmount}, ${line.gatewayFeeAmount},
          ${line.exchangeRate ?? null}, ${line.exchangeRateIds as any}, ${line.fxQuoteId ?? null}, ${line.snapshotJson as any}
        )
      `;

      if (line.providerId && line.providerPayableAmount > 0) {
        await tx`
          insert into commercial.provider_ledgers (
            provider_id, booking_id, booking_child_id, charge_line_id,
            entry_type, amount, currency_code, status, reference_type, reference_id, metadata
          ) values (
            ${line.providerId}, ${bookingId}, ${line.bookingChildId ?? null}, ${line.id},
            'earning', ${line.providerPayableAmount}, ${line.settlementCurrencyCode}, 'pending',
            'booking_charge_line', ${line.id}, ${line.snapshotJson as any}
          )
        `;
      }
    }

    return { bookingId, chargeLineCount: chargeLines.length };
  });
}
