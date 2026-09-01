import 'server-only';

import sql from '@/config/database/db';

import type { Currency } from '../../types';

export type AdminExchangeRate = {
  id: string;
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  source: string;
  asOf: string;
  expiresAt: string | null;
  isLatest: boolean;
};

export async function getAdminCurrencies(): Promise<Currency[]> {
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
    where deleted_at is null
    order by sort_order asc, code asc
  `;
}

export async function getAdminExchangeRates(): Promise<AdminExchangeRate[]> {
  const rows = await sql<{
    id: string;
    baseCurrencyCode: string;
    quoteCurrencyCode: string;
    rate: string;
    source: string;
    asOf: string;
    expiresAt: string | null;
    isLatest: boolean;
  }[]>`
    select
      id,
      base_currency_code as "baseCurrencyCode",
      quote_currency_code as "quoteCurrencyCode",
      rate::text,
      source,
      as_of::text as "asOf",
      expires_at::text as "expiresAt",
      is_latest as "isLatest"
    from finance.exchange_rates
    order by is_latest desc, base_currency_code asc, quote_currency_code asc, as_of desc
    limit 300
  `;

  return rows.map((row) => ({ ...row, rate: Number(row.rate) }));
}
