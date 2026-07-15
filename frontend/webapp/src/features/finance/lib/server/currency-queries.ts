import 'server-only';

import sql from '@/config/database/db';

import { normalizeCurrencyCode, roundMoney } from '../money';
import { getDefaultInternationalMultiplier } from '../../server/pricing-settings.repository';
import type { ConvertedMoney, Currency, FxQuote, PreferredCurrencyInput } from '../../types';

/** Iranian domestic currencies — international markup never applies to these. */
const DOMESTIC_CURRENCY_CODES = new Set(['IRR', 'IRT']);

/**
 * True when the target currency is an international (non-Iranian) display currency,
 * i.e. the per-provider international multiplier should be applied.
 */
export function isInternationalDisplayCurrency(currencyCode: string): boolean {
  return !DOMESTIC_CURRENCY_CODES.has(normalizeCurrencyCode(currencyCode));
}

/**
 * The multiplier to charge international patients: the provider's own coefficient
 * when set to a positive number, otherwise the admin-configurable global default
 * (finance.settings). Never hardcoded.
 */
export async function resolveProviderMultiplier(providerMultiplier?: number | null): Promise<number> {
  if (typeof providerMultiplier === 'number' && Number.isFinite(providerMultiplier) && providerMultiplier > 0) {
    return providerMultiplier;
  }
  return getDefaultInternationalMultiplier();
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function getActiveCurrencies(options?: {
  displayOnly?: boolean;
  paymentOnly?: boolean;
  settlementOnly?: boolean;
}): Promise<Currency[]> {
  const rows = await sql<{
    code: string;
    name: string;
    nativeName: string | null;
    symbol: string;
    decimalDigits: number;
    isIso: boolean;
    isActive: boolean;
    isDisplayEnabled: boolean;
    isPaymentEnabled: boolean;
    isSettlementEnabled: boolean;
    sortOrder: number;
  }[]>`
    select
      code,
      name,
      native_name as "nativeName",
      symbol,
      decimal_digits as "decimalDigits",
      is_iso as "isIso",
      is_active as "isActive",
      is_display_enabled as "isDisplayEnabled",
      is_payment_enabled as "isPaymentEnabled",
      is_settlement_enabled as "isSettlementEnabled",
      sort_order as "sortOrder"
    from finance.currencies
    where is_active = true
      and (${Boolean(options?.displayOnly)} = false or is_display_enabled = true)
      and (${Boolean(options?.paymentOnly)} = false or is_payment_enabled = true)
      and (${Boolean(options?.settlementOnly)} = false or is_settlement_enabled = true)
    order by sort_order asc, code asc
  `;

  return rows;
}

export async function getAllCurrencies(): Promise<Currency[]> {
  return sql<Currency[]>`
    select
      code,
      name,
      native_name as "nativeName",
      symbol,
      decimal_digits as "decimalDigits",
      is_iso as "isIso",
      is_active as "isActive",
      is_display_enabled as "isDisplayEnabled",
      is_payment_enabled as "isPaymentEnabled",
      is_settlement_enabled as "isSettlementEnabled",
      sort_order as "sortOrder"
    from finance.currencies
    order by sort_order asc, code asc
  `;
}

export async function getUserPreferredCurrencyCode(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;

  const rows = await sql<{ preferredCurrencyCode: string | null }[]>`
    select preferred_currency_code as "preferredCurrencyCode"
    from identity.user_preferences
    where user_id = ${userId}
    limit 1
  `;

  return rows[0]?.preferredCurrencyCode ? normalizeCurrencyCode(rows[0].preferredCurrencyCode) : null;
}

export async function getDefaultCurrencyForCountry(countryCode: string | null | undefined): Promise<string | null> {
  if (!countryCode) return null;

  const rows = await sql<{ currencyCode: string }[]>`
    select currency_code as "currencyCode"
    from finance.country_currency_defaults
    where country_code = ${countryCode.trim().toUpperCase()}
      and is_active = true
    limit 1
  `;

  return rows[0]?.currencyCode ? normalizeCurrencyCode(rows[0].currencyCode) : null;
}

export async function resolvePreferredCurrencyCode(input: PreferredCurrencyInput): Promise<string> {
  const fallback = normalizeCurrencyCode(input.fallbackCurrencyCode || 'USD');

  if (input.explicitCurrencyCode) return normalizeCurrencyCode(input.explicitCurrencyCode);

  const userCurrency = await getUserPreferredCurrencyCode(input.userId);
  if (userCurrency) return userCurrency;

  const selectedCountryCurrency = await getDefaultCurrencyForCountry(input.selectedCountryCode);
  if (selectedCountryCurrency) return selectedCountryCurrency;

  const browserCountryCurrency = await getDefaultCurrencyForCountry(input.browserCountryCode);
  if (browserCountryCurrency) return browserCountryCurrency;

  return fallback;
}

export async function convertMoney(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string;
}): Promise<ConvertedMoney> {
  const sourceCurrencyCode = normalizeCurrencyCode(input.sourceCurrencyCode);
  const targetCurrencyCode = normalizeCurrencyCode(input.targetCurrencyCode);

  if (sourceCurrencyCode === targetCurrencyCode) {
    return {
      sourceAmount: input.amount,
      sourceCurrencyCode,
      targetAmount: input.amount,
      targetCurrencyCode,
      baseRate: 1,
      appliedRate: 1,
      marginPercent: 0,
      exchangeRateIds: [],
      ratePath: [sourceCurrencyCode, targetCurrencyCode],
      asOf: new Date().toISOString(),
      expiresAt: null,
    };
  }

  const rows = await sql<{
    sourceAmount: string;
    sourceCurrencyCode: string;
    targetAmount: string;
    targetCurrencyCode: string;
    baseRate: string;
    appliedRate: string;
    marginPercent: string;
    exchangeRateIds: string[];
    ratePath: string[];
    asOf: string;
    expiresAt: string | null;
  }[]>`
    select
      source_amount::text as "sourceAmount",
      source_currency_code as "sourceCurrencyCode",
      target_amount::text as "targetAmount",
      target_currency_code as "targetCurrencyCode",
      base_rate::text as "baseRate",
      applied_rate::text as "appliedRate",
      margin_percent::text as "marginPercent",
      exchange_rate_ids as "exchangeRateIds",
      rate_path as "ratePath",
      as_of::text as "asOf",
      expires_at::text as "expiresAt"
    from finance.convert_money(
      ${input.amount},
      ${sourceCurrencyCode},
      ${targetCurrencyCode},
      ${input.marginProfile || 'standard'}
    )
    limit 1
  `;

  const row = rows[0];
  if (!row) {
    throw new Error(`No conversion result from ${sourceCurrencyCode} to ${targetCurrencyCode}.`);
  }

  return {
    sourceAmount: numberValue(row.sourceAmount),
    sourceCurrencyCode: row.sourceCurrencyCode,
    targetAmount: numberValue(row.targetAmount),
    targetCurrencyCode: row.targetCurrencyCode,
    baseRate: numberValue(row.baseRate),
    appliedRate: numberValue(row.appliedRate),
    marginPercent: numberValue(row.marginPercent),
    exchangeRateIds: stringArray(row.exchangeRateIds),
    ratePath: stringArray(row.ratePath),
    asOf: row.asOf,
    expiresAt: row.expiresAt,
  };
}

/**
 * The single source of truth for PROVIDER-facing prices. Converts the domestic
 * amount through finance.convert_money (the same daily-rate engine as convertMoney),
 * then, for international display currencies only, multiplies by the provider's
 * international coefficient:
 *
 *   international_price = convert_money(amount, source -> target) * provider_multiplier
 *
 * For domestic currencies (IRR/IRT) the multiplier is 1 (never marked up). Every
 * provider/service/package/reservation render path should route through here so the
 * markup is applied exactly once and consistently.
 */
export async function convertProviderPrice(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  providerMultiplier?: number | null;
  marginProfile?: string;
}): Promise<ConvertedMoney> {
  const converted = await convertMoney({
    amount: input.amount,
    sourceCurrencyCode: input.sourceCurrencyCode,
    targetCurrencyCode: input.targetCurrencyCode,
    marginProfile: input.marginProfile,
  });

  if (!isInternationalDisplayCurrency(converted.targetCurrencyCode)) {
    return converted;
  }

  const multiplier = await resolveProviderMultiplier(input.providerMultiplier);
  if (multiplier === 1) return converted;

  const markedUp = converted.targetAmount * multiplier;
  return {
    ...converted,
    targetAmount: roundMoney(markedUp, converted.targetCurrencyCode),
  };
}

/** Batch variant of {@link convertProviderPrice} for a set of target currencies. */
export async function getConvertedProviderPriceOptions(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCodes: string[];
  providerMultiplier?: number | null;
  marginProfile?: string;
}): Promise<ConvertedMoney[]> {
  const uniqueTargets = Array.from(new Set(input.targetCurrencyCodes.map(normalizeCurrencyCode)));
  return Promise.all(
    uniqueTargets.map((targetCurrencyCode) =>
      convertProviderPrice({
        amount: input.amount,
        sourceCurrencyCode: input.sourceCurrencyCode,
        targetCurrencyCode,
        providerMultiplier: input.providerMultiplier,
        marginProfile: input.marginProfile,
      })
    )
  );
}

export async function createFxQuote(input: {
  userId?: string | null;
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string;
  metadata?: Record<string, unknown>;
  expiresInMinutes?: number;
}): Promise<FxQuote> {
  const converted = await convertMoney({
    amount: input.amount,
    sourceCurrencyCode: input.sourceCurrencyCode,
    targetCurrencyCode: input.targetCurrencyCode,
    marginProfile: input.marginProfile,
  });

  const expiresInMinutes = input.expiresInMinutes ?? 15;

  const rows = await sql<{
    id: string;
    userId: string | null;
    status: 'active' | 'used' | 'expired' | 'cancelled';
    quoteExpiresAt: string;
  }[]>`
    insert into finance.fx_quotes (
      user_id,
      source_amount,
      source_currency_code,
      target_currency_code,
      converted_amount,
      base_rate,
      applied_rate,
      margin_percent,
      rate_path,
      exchange_rate_ids,
      expires_at,
      metadata
    )
    values (
      ${input.userId || null},
      ${converted.sourceAmount},
      ${converted.sourceCurrencyCode},
      ${converted.targetCurrencyCode},
      ${converted.targetAmount},
      ${converted.baseRate},
      ${converted.appliedRate},
      ${converted.marginPercent},
      ${converted.ratePath},
      ${converted.exchangeRateIds},
      now() + (${expiresInMinutes} || ' minutes')::interval,
      ${input.metadata || {}}
    )
    returning
      id,
      user_id as "userId",
      status,
      expires_at::text as "quoteExpiresAt"
  `;

  const quote = rows[0];
  if (!quote) throw new Error('Failed to create FX quote.');

  return {
    ...converted,
    id: quote.id,
    userId: quote.userId,
    status: quote.status,
    quoteExpiresAt: quote.quoteExpiresAt,
  };
}

export async function getCurrencyOptionsForPicker(): Promise<{ label: string; value: string; symbol: string }[]> {
  const currencies = await getActiveCurrencies({ displayOnly: true });
  return currencies.map((currency) => ({
    label: `${currency.code} — ${currency.name}`,
    value: currency.code,
    symbol: currency.symbol,
  }));
}

export async function getConvertedPriceOptions(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCodes: string[];
  marginProfile?: string;
}): Promise<ConvertedMoney[]> {
  const uniqueTargets = Array.from(new Set(input.targetCurrencyCodes.map(normalizeCurrencyCode)));
  return Promise.all(
    uniqueTargets.map((targetCurrencyCode) =>
      convertMoney({
        amount: input.amount,
        sourceCurrencyCode: input.sourceCurrencyCode,
        targetCurrencyCode,
        marginProfile: input.marginProfile,
      })
    )
  );
}

export async function convertOriginalAndDiscounted(input: {
  amount: number;
  originalAmount?: number | null;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string;
}): Promise<{
  price: ConvertedMoney;
  originalPrice: ConvertedMoney | null;
}> {
  const price = await convertMoney({
    amount: input.amount,
    sourceCurrencyCode: input.sourceCurrencyCode,
    targetCurrencyCode: input.targetCurrencyCode,
    marginProfile: input.marginProfile,
  });

  const originalPrice = input.originalAmount
    ? await convertMoney({
        amount: input.originalAmount,
        sourceCurrencyCode: input.sourceCurrencyCode,
        targetCurrencyCode: input.targetCurrencyCode,
        marginProfile: input.marginProfile,
      })
    : null;

  return {
    price: {
      ...price,
      targetAmount: roundMoney(price.targetAmount, price.targetCurrencyCode),
    },
    originalPrice: originalPrice
      ? {
          ...originalPrice,
          targetAmount: roundMoney(originalPrice.targetAmount, originalPrice.targetCurrencyCode),
        }
      : null,
  };
}
