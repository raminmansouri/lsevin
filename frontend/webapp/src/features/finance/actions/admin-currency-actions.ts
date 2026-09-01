'use server';

import { revalidatePath } from 'next/cache';
import sql from '@/config/database/db';
import { assertAdmin } from '@/lib/auth/admin-guard';

import { normalizeCurrencyCode } from '../lib/money';
import {
  CurrencyDeleteSchema,
  CurrencyFormSchema,
  ExchangeRateFormSchema,
  type CurrencyDeleteInput,
  type CurrencyFormInput,
  type ExchangeRateFormInput,
} from '../schemas/admin-currency-schemas';

export async function upsertCurrencyAction(input: CurrencyFormInput) {
  await assertAdmin();
  const data = CurrencyFormSchema.parse(input);

  await sql`
    insert into finance.currencies (
      code,
      name,
      native_name,
      symbol,
      decimal_digits,
      is_iso,
      is_active,
      is_display_enabled,
      is_payment_enabled,
      is_settlement_enabled,
      sort_order
    )
    values (
      ${data.code},
      ${data.name},
      ${data.nativeName || null},
      ${data.symbol},
      ${data.decimalDigits},
      ${data.isIso},
      ${data.isActive},
      ${data.isDisplayEnabled},
      ${data.isPaymentEnabled},
      ${data.isSettlementEnabled},
      ${data.sortOrder}
    )
    on conflict (code) do update set
      name = excluded.name,
      native_name = excluded.native_name,
      symbol = excluded.symbol,
      decimal_digits = excluded.decimal_digits,
      is_iso = excluded.is_iso,
      is_active = excluded.is_active,
      is_display_enabled = excluded.is_display_enabled,
      is_payment_enabled = excluded.is_payment_enabled,
      is_settlement_enabled = excluded.is_settlement_enabled,
      sort_order = excluded.sort_order,
      deleted_at = null,
      updated_at = now()
  `;

  revalidatePath('/admin/finance/currencies');
  return { ok: true, code: data.code };
}

export async function createExchangeRateAction(input: ExchangeRateFormInput) {
  await assertAdmin();
  const data = ExchangeRateFormSchema.parse(input);

  if (data.baseCurrencyCode === data.quoteCurrencyCode) {
    throw new Error('Base and quote currencies cannot be the same.');
  }

  const baseCurrencyCode = normalizeCurrencyCode(data.baseCurrencyCode);
  const quoteCurrencyCode = normalizeCurrencyCode(data.quoteCurrencyCode);

  // Demoting the previous rate for this pair is the database's job — the
  // trg_finance_exchange_rates_before_write trigger unsets is_latest on the incumbent
  // row. What the trigger cannot do is serialise two concurrent inserts: at READ
  // COMMITTED, the second transaction's trigger cannot see the first's uncommitted row,
  // so neither demotes the other and the pair ends up with two rows claiming is_latest.
  // Readers take `limit 1` with no `order by`, so the same cart can then be priced from
  // a different rate on each render. The advisory lock closes that window, per directed
  // pair rather than per table, so unrelated pairs never wait on each other.
  await sql.begin(async (tx) => {
    await tx`
      select pg_advisory_xact_lock(hashtext(${`fx:${baseCurrencyCode}:${quoteCurrencyCode}`}))
    `;

    await tx`
      insert into finance.exchange_rates (
        base_currency_code,
        quote_currency_code,
        rate,
        source,
        expires_at,
        is_latest
      )
      values (
        ${baseCurrencyCode},
        ${quoteCurrencyCode},
        ${data.rate},
        ${data.source || 'manual_admin'},
        ${data.expiresAt || null},
        true
      )
    `;
  });

  revalidatePath('/admin/finance/exchange-rates');
  return { ok: true };
}

export async function toggleCurrencyActiveAction(code: string, isActive: boolean) {
  await assertAdmin();

  await sql`
    update finance.currencies
       set is_active = ${isActive}, updated_at = now()
     where code = ${normalizeCurrencyCode(code)}
  `;

  revalidatePath('/admin/finance/currencies');
  return { ok: true };
}

/**
 * The tables that carry a foreign key to finance.currencies. Because the delete is
 * soft, those constraints never fire, so the same set has to be checked here instead.
 * Keys match the AdminTable message namespace so the client can name them in Persian.
 */
export type CurrencyDeleteResult = { ok: boolean; usedIn?: string[] };

export async function deleteCurrencyAction(input: CurrencyDeleteInput): Promise<CurrencyDeleteResult> {
  await assertAdmin();
  const { code } = CurrencyDeleteSchema.parse(input);

  const rows = await sql<{ tableKey: string }[]>`
    select t.table_key as "tableKey"
    from (
      select 'addons' as table_key,
             exists (select 1 from category.addons where currency_code = ${code}) as used
      union all
      select 'provider_services',
             exists (select 1 from category.provider_services where currency = ${code})
      union all
      select 'service_definitions',
             exists (select 1 from category.service_definitions where currency = ${code})
      union all
      select 'country_currency_defaults',
             exists (select 1 from finance.country_currency_defaults where currency_code = ${code})
      union all
      select 'exchange_rates',
             exists (select 1 from finance.exchange_rates where base_currency_code = ${code} or quote_currency_code = ${code})
      union all
      select 'fx_pair_margins',
             exists (select 1 from finance.fx_pair_margins where base_currency_code = ${code} or quote_currency_code = ${code})
      union all
      select 'fx_quotes',
             exists (select 1 from finance.fx_quotes where source_currency_code = ${code} or target_currency_code = ${code})
    ) t
    where t.used
  `;

  if (rows.length) {
    return { ok: false, usedIn: rows.map((row) => row.tableKey) };
  }

  await sql`
    update finance.currencies
       set deleted_at = now(), updated_at = now()
     where code = ${code}
       and deleted_at is null
  `;

  revalidatePath('/admin/finance/currencies');
  return { ok: true };
}
