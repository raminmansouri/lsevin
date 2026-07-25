'use server';

import { revalidatePath } from 'next/cache';
import sql from '@/config/database/db';
import { assertAdmin } from '@/lib/auth/admin-guard';

import { normalizeCurrencyCode } from '../lib/money';
import {
  CurrencyFormSchema,
  ExchangeRateFormSchema,
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
