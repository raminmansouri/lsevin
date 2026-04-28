'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import sql from '@/config/database/db';

import { normalizeCurrencyCode } from '../lib/money';

export const CurrencyFormSchema = z.object({
  code: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  nativeName: z.string().trim().max(120).optional().nullable(),
  symbol: z.string().trim().min(1).max(20),
  decimalDigits: z.coerce.number().int().min(0).max(6),
  isIso: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
  isDisplayEnabled: z.coerce.boolean().default(true),
  isPaymentEnabled: z.coerce.boolean().default(false),
  isSettlementEnabled: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const ExchangeRateFormSchema = z.object({
  baseCurrencyCode: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  quoteCurrencyCode: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  rate: z.coerce.number().positive(),
  source: z.string().trim().min(2).max(80).default('manual_admin'),
  expiresAt: z.string().optional().nullable(),
});

export async function upsertCurrencyAction(input: z.infer<typeof CurrencyFormSchema>) {
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

export async function createExchangeRateAction(input: z.infer<typeof ExchangeRateFormSchema>) {
  const data = ExchangeRateFormSchema.parse(input);

  if (data.baseCurrencyCode === data.quoteCurrencyCode) {
    throw new Error('Base and quote currencies cannot be the same.');
  }

  await sql`
    insert into finance.exchange_rates (
      base_currency_code,
      quote_currency_code,
      rate,
      source,
      expires_at,
      is_latest
    )
    values (
      ${normalizeCurrencyCode(data.baseCurrencyCode)},
      ${normalizeCurrencyCode(data.quoteCurrencyCode)},
      ${data.rate},
      ${data.source || 'manual_admin'},
      ${data.expiresAt || null},
      true
    )
  `;

  revalidatePath('/admin/finance/exchange-rates');
  return { ok: true };
}

export async function toggleCurrencyActiveAction(code: string, isActive: boolean) {
  await sql`
    update finance.currencies
       set is_active = ${isActive}, updated_at = now()
     where code = ${normalizeCurrencyCode(code)}
  `;

  revalidatePath('/admin/finance/currencies');
  return { ok: true };
}
