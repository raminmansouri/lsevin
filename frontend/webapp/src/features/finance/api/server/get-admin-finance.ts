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

// Powers the edit page: the list route only ever fetches the latest 300 rows,
// so a rate that has since been demoted (is_latest = false) or that simply
// isn't in that page can still be opened directly by id.
export async function getAdminExchangeRateById(id: string): Promise<AdminExchangeRate | null> {
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
    where id = ${id}
    limit 1
  `;

    const row = rows[0];
    if (!row) return null;

    return { ...row, rate: Number(row.rate) };
}

export type RateHealth = {
    code: string;
    /** Units of the currency per 1 USD (migration 0105), null when it has none. */
    unitsPerUsd: number | null;
    asOf: string | null;
    status: 'ok' | 'stale' | 'missing';
};

/** A rate older than this is shown as stale: prices in that currency may be off. */
export const RATE_STALE_DAYS = 30;

/**
 * Every display currency's single USD rate (finance.units_per_usd), so admins see
 * which currencies visitors cannot be shown (they get USD instead) and which
 * rates are old.
 */
export async function getRateHealth(): Promise<RateHealth[]> {
    const rows = await sql<{ code: string; units: string | null; asOf: string | null }[]>`
      select c.code, u.units::text as units, u.as_of::text as "asOf"
        from finance.currencies c
        left join lateral finance.units_per_usd(c.code) u on true
       where c.deleted_at is null and c.is_active and c.is_display_enabled and c.code <> 'USD'
       order by c.sort_order, c.code
    `;
    const staleBefore = Date.now() - RATE_STALE_DAYS * 24 * 60 * 60 * 1000;
    return rows.map((row) => ({
        code: row.code,
        unitsPerUsd: row.units == null ? null : Number(row.units),
        asOf: row.asOf,
        status: row.units == null ? 'missing' : row.asOf && new Date(row.asOf).getTime() < staleBefore ? 'stale' : 'ok',
    }));
}
