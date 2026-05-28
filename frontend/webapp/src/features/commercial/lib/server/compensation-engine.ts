import 'server-only';

import sql from '@/config/database/db';

type AppliesTo = 'main_booking' | 'child_booking' | 'addon';
type LineType = 'main_service' | 'child_booking' | 'addon';

type CompensationPolicy = {
  id: string | null;
  applies_to: AppliesTo;
  fee_mode: 'percent' | 'fixed' | 'hybrid';
  platform_percent: number;
  platform_fixed_amount: number;
  minimum_platform_amount: number;
  provider_percent_override: number | null;
  gateway_fee_mode: string;
  currency_code: string | null;
};

type ChargeLineDraft = {
  bookingId: string;
  bookingChildId: string | null;
  bookingAddonId: string | null;
  providerId: string | null;
  providerTypeId: string | null;
  providerServiceId: string | null;
  serviceDefinitionId: string | null;
  addonId: string | null;
  policyId: string | null;
  lineType: LineType;
  sourceType: string | null;
  description: string;
  quantity: number;
  sourceCurrencyCode: string;
  displayCurrencyCode: string | null;
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
  exchangeRate: number | null;
  fxQuoteId: string | null;
  snapshotJson: Record<string, unknown>;
};

function asNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function money(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function clampMoney(value: number): number {
  return money(Math.max(0, value));
}

async function resolveCompensationPolicy(input: {
  appliesTo: AppliesTo;
  providerTypeId?: string | null;
  providerId?: string | null;
  serviceDefinitionId?: string | null;
  providerServiceId?: string | null;
  addonId?: string | null;
}): Promise<CompensationPolicy> {
  const candidates: Array<[string, string | null]> = [];

  if (input.appliesTo === 'addon') {
    candidates.push(['addon', input.addonId ?? null]);
    candidates.push(['provider', input.providerId ?? null]);
    candidates.push(['provider_type', input.providerTypeId ?? null]);
  } else {
    candidates.push(['provider_service', input.providerServiceId ?? null]);
    candidates.push(['service_definition', input.serviceDefinitionId ?? null]);
    candidates.push(['provider', input.providerId ?? null]);
    candidates.push(['provider_type', input.providerTypeId ?? null]);
  }

  candidates.push(['global', null]);

  for (const [scopeType, rawScopeId] of candidates) {
    const scopeId = rawScopeId && String(rawScopeId).trim().length ? String(rawScopeId).trim() : null;

    const [policy] = await sql<any[]>`
      select
        id::text,
        applies_to,
        fee_mode,
        platform_percent::float8,
        platform_fixed_amount::float8,
        minimum_platform_amount::float8,
        provider_percent_override::float8,
        gateway_fee_mode,
        currency_code
      from commercial.compensation_policies
      where is_active = true
        and applies_to = ${input.appliesTo}::text
        and scope_type = ${scopeType}::text
        and (
          (${scopeId}::text is null and (scope_id is null or btrim(scope_id) = ''))
          or scope_id::text = ${scopeId}::text
        )
        and (effective_from is null or effective_from <= now())
        and (effective_to is null or effective_to >= now())
      order by priority asc, created_at desc
      limit 1
    `;

    if (policy) {
      return {
        id: policy.id ?? null,
        applies_to: policy.applies_to,
        fee_mode: policy.fee_mode,
        platform_percent: asNumber(policy.platform_percent),
        platform_fixed_amount: asNumber(policy.platform_fixed_amount),
        minimum_platform_amount: asNumber(policy.minimum_platform_amount),
        provider_percent_override: policy.provider_percent_override === null ? null : asNumber(policy.provider_percent_override),
        gateway_fee_mode: asText(policy.gateway_fee_mode, 'platform_pays'),
        currency_code: policy.currency_code ?? null,
      };
    }
  }

  return {
    id: null,
    applies_to: input.appliesTo,
    fee_mode: 'percent',
    platform_percent: 0,
    platform_fixed_amount: 0,
    minimum_platform_amount: 0,
    provider_percent_override: null,
    gateway_fee_mode: 'platform_pays',
    currency_code: null,
  };
}

function applyPolicy(base: {
  grossAmount: number;
  discountAmount?: number;
  policy: CompensationPolicy;
}) {
  const gross = clampMoney(base.grossAmount);
  const discount = clampMoney(base.discountAmount ?? 0);
  const net = clampMoney(gross - discount);

  let platformFee = 0;
  if (base.policy.fee_mode === 'percent' || base.policy.fee_mode === 'hybrid') {
    platformFee += net * (base.policy.platform_percent / 100);
  }
  if (base.policy.fee_mode === 'fixed' || base.policy.fee_mode === 'hybrid') {
    platformFee += base.policy.platform_fixed_amount;
  }
  platformFee = clampMoney(Math.max(platformFee, base.policy.minimum_platform_amount));
  platformFee = Math.min(platformFee, net);

  const providerPayable = base.policy.provider_percent_override !== null
    ? clampMoney(net * (base.policy.provider_percent_override / 100))
    : clampMoney(net - platformFee);

  return {
    gross,
    discount,
    net,
    platformFee: money(platformFee),
    providerPayable: Math.min(providerPayable, net),
    gatewayFee: 0,
  };
}

async function loadBookingContext(bookingId: string) {
  const [booking] = await sql<any[]>`
    select
      b.id::text,
      b.user_id::text,
      b.provider_id::text,
      b.service_id::text as provider_service_id,
      b.specialist_id::text,
      b.booking_ui_mode,
      b.currency_code,
      b.source_currency_code,
      b.display_currency_code,
      b.payment_currency_code,
      b.settlement_currency_code,
      b.total_amount::float8,
      b.source_subtotal_amount::float8,
      b.source_total_amount::float8,
      b.display_subtotal_amount::float8,
      b.display_total_amount::float8,
      b.applied_discount_amount::float8,
      b.exchange_rate::float8,
      b.fx_quote_id::text,
      b.pricing_snapshot,
      sp.provider_type_id::text,
      ps.service_definition_id::text,
      ps.value::float8 as provider_service_value,
      ps.currency as provider_service_currency,
      sd.value::float8 as service_definition_value,
      sd.currency as service_definition_currency,
      coalesce(
        nullif(common.get_translation(ps.display_name_translations, 'en', 'en'), ''),
        nullif(common.get_translation(sd.name_translations, 'en', 'en'), ''),
        'Main service'
      ) as service_name
    from booking.bookings b
    join category.service_providers sp on sp.id = b.provider_id
    join category.provider_services ps on ps.id = b.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where b.id = ${bookingId}::uuid
    limit 1
  `;

  if (!booking) {
    throw new Error('Booking not found for commercial snapshot.');
  }

  const addons = await sql<any[]>`
    select
      ba.id::text,
      ba.booking_id::text,
      ba.addon_id,
      ba.source_type,
      ba.addon_kind,
      ba.quantity,
      ba.unit_price::float8,
      ba.currency_code,
      ba.source_unit_price::float8,
      ba.display_unit_price::float8,
      ba.exchange_rate::float8,
      ba.fx_quote_id::text,
      coalesce(nullif(a.name, ''), ba.addon_id) as addon_name
    from booking.booking_addons ba
    left join category.addons a on a.id = ba.addon_id
    where ba.booking_id = ${bookingId}::uuid
    order by ba.created_at asc, ba.id asc
  `;

  const children = await sql<any[]>`
    select
      cb.id::text,
      cb.provider_id::text,
      cb.provider_type_id::text,
      cb.service_id::text as provider_service_id,
      cb.specialist_id::text,
      cb.subtotal_amount::float8,
      cb.currency,
      cb.booking_ui_mode,
      ps.service_definition_id::text,
      coalesce(
        nullif(common.get_translation(ps.display_name_translations, 'en', 'en'), ''),
        nullif(common.get_translation(sd.name_translations, 'en', 'en'), ''),
        'Related booking'
      ) as service_name
    from booking.booking_child_bookings cb
    left join category.provider_services ps on ps.id = cb.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where cb.parent_booking_id = ${bookingId}::uuid
    order by cb.create_date asc, cb.id asc
  `;

  return { booking, addons, children };
}

function getCurrencies(booking: any, fallback?: string | null) {
  const source = asText(booking.source_currency_code || fallback || booking.currency_code || booking.provider_service_currency || booking.service_definition_currency, 'USD');
  const payment = asText(booking.payment_currency_code || booking.currency_code || source, source);
  const settlement = asText(booking.settlement_currency_code || payment || source, payment || source);
  const display = booking.display_currency_code || booking.currency_code || source || null;
  return { source, payment, settlement, display };
}

export async function buildBookingChargeLinesForBooking(bookingId: string): Promise<ChargeLineDraft[]> {
  const { booking, addons, children } = await loadBookingContext(bookingId);

  const addonGross = addons.reduce((sum, addon) => sum + (asNumber(addon.quantity, 1) * asNumber(addon.unit_price)), 0);
  const childGross = children.reduce((sum, child) => sum + asNumber(child.subtotal_amount), 0);

  const subtotalFromSnapshot = asNumber(booking.source_subtotal_amount, NaN);
  const total = asNumber(booking.source_total_amount, asNumber(booking.total_amount, asNumber(booking.display_total_amount, 0)));
  const providerServiceValue = asNumber(booking.provider_service_value, asNumber(booking.service_definition_value, 0));
  const mainGross = Number.isFinite(subtotalFromSnapshot)
    ? subtotalFromSnapshot
    : Math.max(0, total - addonGross - childGross) || providerServiceValue || total;

  const currencies = getCurrencies(booking);
  const lines: ChargeLineDraft[] = [];

  const mainPolicy = await resolveCompensationPolicy({
    appliesTo: 'main_booking',
    providerTypeId: booking.provider_type_id,
    providerId: booking.provider_id,
    serviceDefinitionId: booking.service_definition_id,
    providerServiceId: booking.provider_service_id,
  });
  const mainAmounts = applyPolicy({
    grossAmount: mainGross,
    discountAmount: asNumber(booking.applied_discount_amount),
    policy: mainPolicy,
  });

  lines.push({
    bookingId,
    bookingChildId: null,
    bookingAddonId: null,
    providerId: booking.provider_id,
    providerTypeId: booking.provider_type_id,
    providerServiceId: booking.provider_service_id,
    serviceDefinitionId: booking.service_definition_id,
    addonId: null,
    policyId: mainPolicy.id,
    lineType: 'main_service',
    sourceType: 'booking',
    description: asText(booking.service_name, 'Main service'),
    quantity: 1,
    sourceCurrencyCode: currencies.source,
    displayCurrencyCode: currencies.display,
    paymentCurrencyCode: currencies.payment,
    settlementCurrencyCode: currencies.settlement,
    sourceGrossAmount: mainAmounts.gross,
    paymentGrossAmount: mainAmounts.gross,
    settlementGrossAmount: mainAmounts.gross,
    discountAmount: mainAmounts.discount,
    netAmount: mainAmounts.net,
    platformFeeAmount: mainAmounts.platformFee,
    providerPayableAmount: mainAmounts.providerPayable,
    gatewayFeeAmount: mainAmounts.gatewayFee,
    exchangeRate: booking.exchange_rate === null ? null : asNumber(booking.exchange_rate),
    fxQuoteId: booking.fx_quote_id ?? null,
    snapshotJson: { booking, policy: mainPolicy, source: 'main_booking' },
  });

  for (const addon of addons) {
    const addonCurrency = asText(addon.currency_code || currencies.source, currencies.source);
    const addonPolicy = await resolveCompensationPolicy({
      appliesTo: 'addon',
      providerTypeId: booking.provider_type_id,
      providerId: booking.provider_id,
      serviceDefinitionId: booking.service_definition_id,
      providerServiceId: booking.provider_service_id,
      addonId: addon.addon_id,
    });
    const quantity = Math.max(1, Math.trunc(asNumber(addon.quantity, 1)));
    const gross = quantity * asNumber(addon.unit_price);
    const amounts = applyPolicy({ grossAmount: gross, policy: addonPolicy });

    lines.push({
      bookingId,
      bookingChildId: null,
      bookingAddonId: addon.id,
      providerId: booking.provider_id,
      providerTypeId: booking.provider_type_id,
      providerServiceId: booking.provider_service_id,
      serviceDefinitionId: booking.service_definition_id,
      addonId: addon.addon_id,
      policyId: addonPolicy.id,
      lineType: 'addon',
      sourceType: addon.source_type ?? addon.addon_kind ?? 'addon',
      description: asText(addon.addon_name, 'Add-on'),
      quantity,
      sourceCurrencyCode: addonCurrency,
      displayCurrencyCode: currencies.display,
      paymentCurrencyCode: currencies.payment,
      settlementCurrencyCode: currencies.settlement,
      sourceGrossAmount: amounts.gross,
      paymentGrossAmount: amounts.gross,
      settlementGrossAmount: amounts.gross,
      discountAmount: 0,
      netAmount: amounts.net,
      platformFeeAmount: amounts.platformFee,
      providerPayableAmount: amounts.providerPayable,
      gatewayFeeAmount: amounts.gatewayFee,
      exchangeRate: addon.exchange_rate === null ? null : asNumber(addon.exchange_rate),
      fxQuoteId: addon.fx_quote_id ?? booking.fx_quote_id ?? null,
      snapshotJson: { addon, policy: addonPolicy, source: 'addon' },
    });
  }

  for (const child of children) {
    const childCurrencies = getCurrencies(booking, child.currency);
    const childPolicy = await resolveCompensationPolicy({
      appliesTo: 'child_booking',
      providerTypeId: child.provider_type_id ?? booking.provider_type_id,
      providerId: child.provider_id ?? booking.provider_id,
      serviceDefinitionId: child.service_definition_id,
      providerServiceId: child.provider_service_id,
    });
    const amounts = applyPolicy({ grossAmount: asNumber(child.subtotal_amount), policy: childPolicy });

    lines.push({
      bookingId,
      bookingChildId: child.id,
      bookingAddonId: null,
      providerId: child.provider_id ?? booking.provider_id,
      providerTypeId: child.provider_type_id ?? booking.provider_type_id,
      providerServiceId: child.provider_service_id,
      serviceDefinitionId: child.service_definition_id,
      addonId: null,
      policyId: childPolicy.id,
      lineType: 'child_booking',
      sourceType: child.booking_ui_mode ?? 'child_booking',
      description: asText(child.service_name, 'Related booking'),
      quantity: 1,
      sourceCurrencyCode: childCurrencies.source,
      displayCurrencyCode: childCurrencies.display,
      paymentCurrencyCode: childCurrencies.payment,
      settlementCurrencyCode: childCurrencies.settlement,
      sourceGrossAmount: amounts.gross,
      paymentGrossAmount: amounts.gross,
      settlementGrossAmount: amounts.gross,
      discountAmount: 0,
      netAmount: amounts.net,
      platformFeeAmount: amounts.platformFee,
      providerPayableAmount: amounts.providerPayable,
      gatewayFeeAmount: amounts.gatewayFee,
      exchangeRate: booking.exchange_rate === null ? null : asNumber(booking.exchange_rate),
      fxQuoteId: booking.fx_quote_id ?? null,
      snapshotJson: { child, policy: childPolicy, source: 'child_booking' },
    });
  }

  return lines;
}

export async function persistChargeLinesAndLedgers(bookingId: string, chargeLines: ChargeLineDraft[]) {
  return await sql.begin(async (tx) => {
    await tx`
      delete from commercial.provider_ledgers
      where booking_id = ${bookingId}::uuid
    `;

    await tx`
      delete from commercial.booking_charge_lines
      where booking_id = ${bookingId}::uuid
    `;

    let chargeLineCount = 0;
    let ledgerCount = 0;

    for (const line of chargeLines) {
      const [inserted] = await tx<any[]>`
        insert into commercial.booking_charge_lines (
          booking_id,
          booking_child_id,
          booking_addon_id,
          provider_id,
          provider_type_id,
          provider_service_id,
          service_definition_id,
          addon_id,
          policy_id,
          line_type,
          source_type,
          description,
          quantity,
          source_currency_code,
          display_currency_code,
          payment_currency_code,
          settlement_currency_code,
          source_gross_amount,
          payment_gross_amount,
          settlement_gross_amount,
          discount_amount,
          net_amount,
          platform_fee_amount,
          provider_payable_amount,
          gateway_fee_amount,
          exchange_rate,
          fx_quote_id,
          snapshot_json
        ) values (
          ${line.bookingId}::uuid,
          ${line.bookingChildId}::uuid,
          ${line.bookingAddonId}::uuid,
          ${line.providerId}::uuid,
          ${line.providerTypeId}::uuid,
          ${line.providerServiceId}::uuid,
          ${line.serviceDefinitionId}::uuid,
          ${line.addonId}::text,
          ${line.policyId}::uuid,
          ${line.lineType}::text,
          ${line.sourceType}::text,
          ${line.description}::text,
          ${line.quantity}::int,
          ${line.sourceCurrencyCode}::varchar,
          ${line.displayCurrencyCode}::varchar,
          ${line.paymentCurrencyCode}::varchar,
          ${line.settlementCurrencyCode}::varchar,
          ${line.sourceGrossAmount}::numeric,
          ${line.paymentGrossAmount}::numeric,
          ${line.settlementGrossAmount}::numeric,
          ${line.discountAmount}::numeric,
          ${line.netAmount}::numeric,
          ${line.platformFeeAmount}::numeric,
          ${line.providerPayableAmount}::numeric,
          ${line.gatewayFeeAmount}::numeric,
          ${line.exchangeRate}::numeric,
          ${line.fxQuoteId}::uuid,
          ${line.snapshotJson as any}::jsonb
        )
        returning id::text
      `;

      chargeLineCount += 1;

      if (line.providerId && line.providerPayableAmount > 0) {
        await tx`
          insert into commercial.provider_ledgers (
            provider_id,
            booking_id,
            booking_child_id,
            charge_line_id,
            entry_type,
            amount,
            currency_code,
            status,
            reference_type,
            reference_id,
            notes,
            metadata
          ) values (
            ${line.providerId}::uuid,
            ${line.bookingId}::uuid,
            ${line.bookingChildId}::uuid,
            ${inserted.id}::uuid,
            'earning',
            ${line.providerPayableAmount}::numeric,
            ${line.settlementCurrencyCode}::varchar,
            'pending',
            ${line.lineType}::text,
            ${line.bookingChildId ?? line.bookingAddonId ?? line.bookingId}::uuid,
            ${`Payable for ${line.description}`}::text,
            ${{ chargeLineId: inserted.id, lineType: line.lineType } as any}::jsonb
          )
        `;
        ledgerCount += 1;
      }
    }

    return { bookingId, chargeLineCount, ledgerCount };
  });
}
