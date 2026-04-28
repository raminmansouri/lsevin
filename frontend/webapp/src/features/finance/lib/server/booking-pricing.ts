import 'server-only';

import sql from '@/config/database/db';

import { createFxQuote, convertMoney } from './currency-queries';

export type BookingPriceSnapshotInput = {
  userId?: string | null;
  providerServiceId: string;
  targetCurrencyCode: string;
  marginProfile?: string;
  addonIds?: string[];
};

export type BookingPriceSnapshot = {
  providerServiceId: string;
  sourceCurrencyCode: string;
  displayCurrencyCode: string;
  serviceSourceAmount: number;
  serviceDisplayAmount: number;
  addonsSourceAmount: number;
  addonsDisplayAmount: number;
  sourceTotalAmount: number;
  displayTotalAmount: number;
  exchangeRate: number;
  exchangeRateIds: string[];
  fxQuoteId: string;
  pricingSnapshot: Record<string, unknown>;
};

export async function buildBookingPriceSnapshot(input: BookingPriceSnapshotInput): Promise<BookingPriceSnapshot> {
  const serviceRows = await sql<{
    id: string;
    currency: string;
    value: string;
  }[]>`
    select id, currency, value::text
    from category.provider_services
    where id = ${input.providerServiceId}
      and is_active = true
    limit 1
  `;

  const service = serviceRows[0];
  if (!service) throw new Error('Provider service was not found or is inactive.');

  const addonRows = input.addonIds?.length
    ? await sql<{ id: string; currencyCode: string; price: string }[]>`
        select id, currency_code as "currencyCode", price::text
        from category.addons
        where id = any(${input.addonIds})
          and is_active = true
      `
    : [];

  const sourceCurrencyCode = service.currency;
  const serviceSourceAmount = Number(service.value || 0);
  const serviceConverted = await convertMoney({
    amount: serviceSourceAmount,
    sourceCurrencyCode,
    targetCurrencyCode: input.targetCurrencyCode,
    marginProfile: input.marginProfile || 'standard',
  });

  let addonsSourceAmount = 0;
  let addonsDisplayAmount = 0;
  const addonSnapshots = [];

  for (const addon of addonRows) {
    const addonAmount = Number(addon.price || 0);
    const converted = await convertMoney({
      amount: addonAmount,
      sourceCurrencyCode: addon.currencyCode,
      targetCurrencyCode: input.targetCurrencyCode,
      marginProfile: input.marginProfile || 'standard',
    });

    // Source total is normalized into provider service currency for consistent provider-facing totals.
    const addonInServiceCurrency = await convertMoney({
      amount: addonAmount,
      sourceCurrencyCode: addon.currencyCode,
      targetCurrencyCode: sourceCurrencyCode,
      marginProfile: 'pure',
    });

    addonsSourceAmount += addonInServiceCurrency.targetAmount;
    addonsDisplayAmount += converted.targetAmount;

    addonSnapshots.push({
      addonId: addon.id,
      sourceCurrencyCode: addon.currencyCode,
      sourceUnitPrice: addonAmount,
      displayCurrencyCode: converted.targetCurrencyCode,
      displayUnitPrice: converted.targetAmount,
      exchangeRate: converted.appliedRate,
      exchangeRateIds: converted.exchangeRateIds,
    });
  }

  const sourceTotalAmount = serviceSourceAmount + addonsSourceAmount;
  const displayTotalAmount = serviceConverted.targetAmount + addonsDisplayAmount;

  const fxQuote = await createFxQuote({
    userId: input.userId,
    amount: sourceTotalAmount,
    sourceCurrencyCode,
    targetCurrencyCode: input.targetCurrencyCode,
    marginProfile: input.marginProfile || 'standard',
    metadata: {
      entityType: 'booking_price_snapshot',
      providerServiceId: input.providerServiceId,
      addonIds: input.addonIds || [],
    },
  });

  return {
    providerServiceId: input.providerServiceId,
    sourceCurrencyCode,
    displayCurrencyCode: input.targetCurrencyCode,
    serviceSourceAmount,
    serviceDisplayAmount: serviceConverted.targetAmount,
    addonsSourceAmount,
    addonsDisplayAmount,
    sourceTotalAmount,
    displayTotalAmount,
    exchangeRate: fxQuote.appliedRate,
    exchangeRateIds: fxQuote.exchangeRateIds,
    fxQuoteId: fxQuote.id,
    pricingSnapshot: {
      sourceCurrencyCode,
      displayCurrencyCode: input.targetCurrencyCode,
      service: {
        providerServiceId: input.providerServiceId,
        sourceAmount: serviceSourceAmount,
        displayAmount: serviceConverted.targetAmount,
      },
      addons: addonSnapshots,
      totals: {
        sourceAddonsAmount: addonsSourceAmount,
        displayAddonsAmount: addonsDisplayAmount,
        sourceTotalAmount,
        displayTotalAmount,
      },
      fx: {
        quoteId: fxQuote.id,
        baseRate: fxQuote.baseRate,
        appliedRate: fxQuote.appliedRate,
        marginPercent: fxQuote.marginPercent,
        ratePath: fxQuote.ratePath,
        exchangeRateIds: fxQuote.exchangeRateIds,
        expiresAt: fxQuote.quoteExpiresAt,
      },
    },
  };
}

export async function applyPricingSnapshotToDraft(input: {
  draftId: string;
  snapshot: BookingPriceSnapshot;
}) {
  await sql`
    update booking.booking_drafts
       set source_currency_code = ${input.snapshot.sourceCurrencyCode},
           display_currency_code = ${input.snapshot.displayCurrencyCode},
           payment_currency_code = ${input.snapshot.displayCurrencyCode},
           settlement_currency_code = ${input.snapshot.sourceCurrencyCode},
           source_subtotal_amount = ${input.snapshot.serviceSourceAmount},
           source_addons_amount = ${input.snapshot.addonsSourceAmount},
           source_total_amount = ${input.snapshot.sourceTotalAmount},
           display_subtotal_amount = ${input.snapshot.serviceDisplayAmount},
           display_addons_amount = ${input.snapshot.addonsDisplayAmount},
           display_total_amount = ${input.snapshot.displayTotalAmount},
           subtotal_amount = ${input.snapshot.serviceDisplayAmount},
           addons_amount = ${input.snapshot.addonsDisplayAmount},
           total_amount = ${input.snapshot.displayTotalAmount},
           currency = ${input.snapshot.displayCurrencyCode},
           exchange_rate = ${input.snapshot.exchangeRate},
           exchange_rate_ids = ${input.snapshot.exchangeRateIds},
           fx_quote_id = ${input.snapshot.fxQuoteId},
           pricing_snapshot = ${input.snapshot.pricingSnapshot},
           updated_at = now()
     where id = ${input.draftId}
  `;
}
