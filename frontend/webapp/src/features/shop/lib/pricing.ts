import "server-only";

import sql from "@/config/database/db";
import {
  convertMoney,
  createFxQuote,
  getActiveCurrencies,
  getDefaultCurrencyForCountry,
} from "@/features/finance/lib/server/currency-queries";
import { getCurrencyDecimalDigits, normalizeCurrencyCode, roundMoney } from "@/features/finance/lib/money";
import type { Currency } from "@/features/finance/types";

import type { ShopContext } from "./context";

/**
 * Shop pricing is the platform pricing policy (§4.4), not a Shop-owned engine.
 *
 * A product row carries a *source* amount + source currency (any Finance
 * currency). Every customer-facing number is resolved server-side through
 * finance.convert_money via `@/features/finance` — this module only decides the
 * display currency for the request and shapes the result. It maintains no
 * exchange-rate table, currency list, country map, margin profile or rounding
 * rule of its own (SHP-CHK-008, SHP-NFR-016).
 */

export type ShopPricingMode = "market_default" | "market_default_with_selector";

export type MoneyView = {
  /** server-resolved amount the customer sees / pays in `currency` */
  amount: number;
  currency: string;
  /** exact stored commercial value */
  sourceAmount: number;
  sourceCurrency: string;
  appliedRate: number;
  converted: boolean;
  /** true when Finance could not produce a rate — never render a bare number then (SHP-NFR-020) */
  unavailable: boolean;
  /** true when no rate existed and we showed the source currency instead of the display one */
  fellBackToSource?: boolean;
};

export type PriceResolution = {
  price: MoneyView;
  compareAtPrice: MoneyView | null;
};

const PRICING_MODE_KEY = "shop_pricing_mode";
const DEFAULT_CURRENCY_KEY = "shop_default_currency";
const HARD_FALLBACK_CURRENCY = "USD";

async function readSetting(key: string): Promise<string | null> {
  const rows = await sql<{ value: string | null }[]>`
    select value ->> 'value' as value from finance.settings where key = ${key} limit 1
  `;
  return rows[0]?.value?.trim() || null;
}

export async function getShopPricingMode(): Promise<ShopPricingMode> {
  const raw = (await readSetting(PRICING_MODE_KEY))?.toLowerCase();
  return raw === "market_default" ? "market_default" : "market_default_with_selector";
}

export async function getShopDefaultCurrency(): Promise<string> {
  return normalizeCurrencyCode((await readSetting(DEFAULT_CURRENCY_KEY)) || HARD_FALLBACK_CURRENCY);
}

export async function setShopPricingMode(mode: ShopPricingMode): Promise<void> {
  await sql`
    insert into finance.settings (key, value)
    values (${PRICING_MODE_KEY}, ${sql.json({ value: mode })})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

let currencyCache: { at: number; rows: Currency[] } | null = null;
async function displayCurrencies(): Promise<Currency[]> {
  if (currencyCache && Date.now() - currencyCache.at < 60_000) return currencyCache.rows;
  const rows = await getActiveCurrencies({ displayOnly: true });
  currencyCache = { at: Date.now(), rows };
  return rows;
}

export type DisplayCurrencyOption = { code: string; symbol: string; name: string; decimalDigits: number };

export async function getDisplayCurrencyOptions(): Promise<DisplayCurrencyOption[]> {
  return (await displayCurrencies()).map((c) => ({
    code: c.code,
    symbol: c.symbol,
    name: c.name,
    decimalDigits: c.decimalDigits,
  }));
}

/**
 * The effective display currency for this request.
 *
 *  - `market_default`               : market/customer country default, NO customer override.
 *  - `market_default_with_selector` : same default, but an explicitly selected
 *                                     Finance display-enabled currency wins and
 *                                     is persisted via the session/cookie.
 */
export async function resolveDisplayCurrency(ctx: Pick<ShopContext, "countryCode" | "selectedCurrencyCode">): Promise<{
  currency: string;
  mode: ShopPricingMode;
  selectable: DisplayCurrencyOption[];
}> {
  const [mode, options, fallback] = await Promise.all([
    getShopPricingMode(),
    getDisplayCurrencyOptions(),
    getShopDefaultCurrency(),
  ]);

  const enabled = new Set(options.map((o) => o.code));

  const marketDefault =
    (ctx.countryCode ? await getDefaultCurrencyForCountry(ctx.countryCode) : null) || fallback;

  let currency = enabled.has(marketDefault) ? marketDefault : (enabled.has(fallback) ? fallback : HARD_FALLBACK_CURRENCY);

  if (mode === "market_default_with_selector" && ctx.selectedCurrencyCode && enabled.has(ctx.selectedCurrencyCode)) {
    currency = ctx.selectedCurrencyCode;
  }

  return { currency, mode, selectable: mode === "market_default_with_selector" ? options : [] };
}

function sameCurrency(a: string, b: string) {
  return normalizeCurrencyCode(a) === normalizeCurrencyCode(b);
}

async function convertOne(amount: number, source: string, target: string): Promise<MoneyView> {
  const src = normalizeCurrencyCode(source);
  const tgt = normalizeCurrencyCode(target);
  if (amount == null || Number.isNaN(amount)) {
    return { amount: 0, currency: tgt, sourceAmount: 0, sourceCurrency: src, appliedRate: 1, converted: false, unavailable: false };
  }
  if (sameCurrency(src, tgt)) {
    return { amount: roundMoney(amount, tgt), currency: tgt, sourceAmount: amount, sourceCurrency: src, appliedRate: 1, converted: false, unavailable: false };
  }
  try {
    const r = await convertMoney({ amount, sourceCurrencyCode: src, targetCurrencyCode: tgt });
    return {
      amount: roundMoney(r.targetAmount, tgt),
      currency: tgt,
      sourceAmount: amount,
      sourceCurrency: src,
      appliedRate: r.appliedRate,
      converted: true,
      unavailable: false,
    };
  } catch {
    // Finance has no usable rate for src -> tgt. Rather than hard-blocking the
    // cart/checkout, fall back to the product's own source currency: the amount
    // stays exact and is shown under the *source* symbol (never a wrong amount
    // under `tgt`). `unavailable` stays false so the flow is not blocked.
    return {
      amount: roundMoney(amount, src),
      currency: src,
      sourceAmount: amount,
      sourceCurrency: src,
      appliedRate: 1,
      converted: false,
      unavailable: false,
      fellBackToSource: true,
    };
  }
}

export async function resolvePrice(input: {
  amount: number;
  sourceCurrency: string;
  compareAtAmount?: number | null;
  displayCurrency: string;
}): Promise<PriceResolution> {
  const price = await convertOne(input.amount, input.sourceCurrency, input.displayCurrency);
  const compareAtPrice =
    input.compareAtAmount && input.compareAtAmount > 0
      ? await convertOne(input.compareAtAmount, input.sourceCurrency, input.displayCurrency)
      : null;
  return { price, compareAtPrice };
}

/**
 * Batch resolver. Products often share a source currency, so conversions are
 * de-duplicated to one `convert_money` call per (sourceCurrency -> displayCurrency)
 * pair and a linear scale afterwards — the rate is fixed for the request
 * (SHP-CHK-018, SHP-NFR-017).
 */
export async function resolvePrices<T extends { amount: number; sourceCurrency: string; compareAtAmount?: number | null }>(
  rows: T[],
  displayCurrency: string
): Promise<(T & PriceResolution)[]> {
  const tgt = normalizeCurrencyCode(displayCurrency);
  const rateBySource = new Map<string, { rate: number; unavailable: boolean }>();

  for (const src of new Set(rows.map((r) => normalizeCurrencyCode(r.sourceCurrency)))) {
    if (sameCurrency(src, tgt)) {
      rateBySource.set(src, { rate: 1, unavailable: false });
      continue;
    }
    try {
      const r = await convertMoney({ amount: 1, sourceCurrencyCode: src, targetCurrencyCode: tgt });
      rateBySource.set(src, { rate: r.appliedRate, unavailable: false });
    } catch {
      rateBySource.set(src, { rate: 0, unavailable: true });
    }
  }

  const digits = getCurrencyDecimalDigits(tgt);
  const factor = Math.pow(10, digits);
  const scale = (v: number) => Math.round((v + Number.EPSILON) * factor) / factor;

  const view = (amount: number, src: string): MoneyView => {
    const norm = normalizeCurrencyCode(src);
    const info = rateBySource.get(norm) ?? { rate: 0, unavailable: true };
    if (info.unavailable) {
      // No rate norm -> tgt: show the exact amount in its own source currency
      // rather than blocking the cart/checkout (see convertOne).
      return {
        amount: roundMoney(amount, norm),
        currency: norm,
        sourceAmount: amount,
        sourceCurrency: norm,
        appliedRate: 1,
        converted: false,
        unavailable: false,
        fellBackToSource: true,
      };
    }
    const converted = !sameCurrency(norm, tgt);
    return {
      amount: scale(amount * info.rate),
      currency: tgt,
      sourceAmount: amount,
      sourceCurrency: norm,
      appliedRate: info.rate,
      converted,
      unavailable: false,
    };
  };

  return rows.map((r) => ({
    ...r,
    price: view(r.amount, r.sourceCurrency),
    compareAtPrice: r.compareAtAmount && r.compareAtAmount > 0 ? view(r.compareAtAmount, r.sourceCurrency) : null,
  }));
}

/**
 * Locks the payable total for checkout: persists a finance.fx_quote when the
 * payment currency differs from the source, so a later rate/config change can
 * never rewrite this order (SHP-CHK-015/016/019, SHP-NFR-019).
 */
export async function lockPayableQuote(input: {
  userId: string | null;
  amount: number;
  sourceCurrency: string;
  paymentCurrency: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  quoteId: string | null;
  paymentAmount: number;
  paymentCurrency: string;
  appliedRate: number;
  expiresAt: string | null;
}> {
  const src = normalizeCurrencyCode(input.sourceCurrency);
  const pay = normalizeCurrencyCode(input.paymentCurrency);
  if (sameCurrency(src, pay)) {
    return { quoteId: null, paymentAmount: roundMoney(input.amount, pay), paymentCurrency: pay, appliedRate: 1, expiresAt: null };
  }
  const quote = await createFxQuote({
    userId: input.userId,
    amount: input.amount,
    sourceCurrencyCode: src,
    targetCurrencyCode: pay,
    metadata: { source: "shop_checkout", ...(input.metadata ?? {}) },
    expiresInMinutes: 20,
  });
  return {
    quoteId: quote.id,
    paymentAmount: roundMoney(quote.targetAmount, pay),
    paymentCurrency: pay,
    appliedRate: quote.appliedRate,
    expiresAt: quote.quoteExpiresAt,
  };
}
