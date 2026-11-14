import 'server-only';

import sql from '@/config/database/db';
import { FALLBACK_DISPLAY_CURRENCY } from '@/lib/market/market';
import { getVisitorMarket, type VisitorMarket } from '@/lib/market/server';

import { normalizeCurrencyCode, roundMoney } from '../money';
import { convertMoney, resolveProviderMultiplier } from './currency-queries';

export type ViewerPriceRequest = {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
    /** No international multiplier (prices not set by a provider, e.g. LSevin's own packages). */
    skipMultiplier?: boolean;
};

export type ViewerPrice = {
    amount: number;
    currencyCode: string;
    /** True when the display currency had no exchange rate and USD (or the original) is shown instead. */
    fallback?: boolean;
};

/**
 * Prices a batch of items for the visitor making this request
 * (src/lib/market/market.ts):
 *
 *  - The currency follows the page language (Persian -> toman, Turkish -> TRY,
 *    Arabic -> the visitor's Arab-country currency ...), or a currency they
 *    picked in that language.
 *  - The amount follows the price tier, which does not depend on the currency:
 *    domestic = the provider's price (a provider's own toman price wins for a
 *    toman display); international = that price x the provider's international
 *    multiplier, in whatever currency is shown.
 *  - A currency with no exchange rate is never faked: USD is shown, flagged as a
 *    fallback, and if even that fails the provider's own currency.
 */
export async function priceItemsForViewer(
    items: ViewerPriceRequest[],
    options: { locale?: string | null; market?: VisitorMarket } = {},
): Promise<(ViewerPrice | null)[]> {
    const market = options.market ?? (await getVisitorMarket(options.locale ?? null));
    const target = normalizeCurrencyCode(market.displayCurrency);
    const international = market.tier === 'international';

    const providerIds = Array.from(new Set(items.map((item) => item.providerId).filter((id): id is string => Boolean(id))));
    const ownMultipliers = new Map<string, number | null>();
    if (international && providerIds.length) {
        const rows = await sql<{ id: string; multiplier: string | null }[]>`
      select id::text as id, international_price_multiplier as multiplier
      from category.service_providers
      where id = any(${providerIds}::uuid[])
    `;
        for (const row of rows) ownMultipliers.set(row.id, row.multiplier == null ? null : Number(row.multiplier));
    }
    const multiplierCache = new Map<string, Promise<number>>();
    const multiplierFor = (providerId?: string | null) => {
        if (!international) return Promise.resolve(1);
        const own = providerId ? (ownMultipliers.get(providerId) ?? null) : null;
        const key = String(own);
        if (!multiplierCache.has(key)) multiplierCache.set(key, resolveProviderMultiplier(own).catch(() => 1));
        return multiplierCache.get(key)!;
    };

    return Promise.all(
        items.map(async (item): Promise<ViewerPrice | null> => {
            if (!Number.isFinite(item.amount) || !item.sourceCurrencyCode) return null;
            const source = normalizeCurrencyCode(item.sourceCurrencyCode);
            const multiplier = item.skipMultiplier ? 1 : await multiplierFor(item.providerId);

            // The provider's own toman price is the domestic toman price.
            if (!international && target === 'IRT' && item.valueToman != null && Number.isFinite(item.valueToman) && item.valueToman > 0) {
                return { amount: item.valueToman, currencyCode: 'IRT' };
            }

            for (const [currency, fallback] of [[target, false], [FALLBACK_DISPLAY_CURRENCY, true]] as const) {
                try {
                    // The multiplier goes in before the conversion, so the database
                    // rounds once (1,400,000,000 IRR x 3 -> $2,000.00, not $2,000.01).
                    const converted = await convertMoney({ amount: item.amount * multiplier, sourceCurrencyCode: source, targetCurrencyCode: currency });
                    return {
                        amount: roundMoney(converted.targetAmount, converted.targetCurrencyCode),
                        currencyCode: converted.targetCurrencyCode,
                        ...(fallback && currency !== target ? { fallback: true } : {}),
                    };
                } catch {
                    if (currency === target) console.warn('[viewer-pricing] no rate', source, '->', target, '- trying', FALLBACK_DISPLAY_CURRENCY);
                }
            }
            console.error('[viewer-pricing] no rate', source, '->', target, 'or', FALLBACK_DISPLAY_CURRENCY);
            return { amount: roundMoney(item.amount * multiplier, source), currencyCode: source, fallback: true };
        }),
    );
}

export type ViewerPriceOption = { targetAmount: number; targetCurrencyCode: string; sourceAmount: number; sourceCurrencyCode: string };

/**
 * One price in several currencies for this visitor (the service page's currency
 * converter): the same tier and multiplier as {@link priceItemsForViewer}, the
 * visitor's display currency first, and only currencies that have a rate.
 */
export async function priceOptionsForViewer(input: {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
    currencies: string[];
    locale?: string | null;
}): Promise<{ displayCurrencyCode: string; options: ViewerPriceOption[] }> {
    const market = await getVisitorMarket(input.locale ?? null);
    const display = normalizeCurrencyCode(market.displayCurrency);
    const source = normalizeCurrencyCode(input.sourceCurrencyCode);
    const wanted = Array.from(new Set([display, ...input.currencies.map(normalizeCurrencyCode)]));
    const priced = await Promise.all(
        wanted.map(async (currency) => {
            const [price] = await priceItemsForViewer(
                [{ amount: input.amount, sourceCurrencyCode: source, providerId: input.providerId, valueToman: input.valueToman }],
                { market: { ...market, displayCurrency: currency } },
            );
            if (!price || price.fallback || price.currencyCode !== currency) return null;
            // "Converted from <provider price>" only makes sense for the domestic
            // price; an international price also carries the multiplier, so the
            // source is reported as the shown amount itself (no "converted from").
            return market.tier === 'domestic'
                ? { targetAmount: price.amount, targetCurrencyCode: currency, sourceAmount: input.amount, sourceCurrencyCode: source }
                : { targetAmount: price.amount, targetCurrencyCode: currency, sourceAmount: price.amount, sourceCurrencyCode: currency };
        }),
    );
    const options = priced.filter((option): option is ViewerPriceOption => option !== null);
    return { displayCurrencyCode: options.some((o) => o.targetCurrencyCode === display) ? display : (options[0]?.targetCurrencyCode ?? source), options };
}
