import 'server-only';

import sql from '@/config/database/db';
import { getSession } from '@/lib/auth/session';

import { roundMoney } from '../money';
import { convertMoney, convertProviderPrice, resolvePreferredCurrencyCode } from './currency-queries';
import { resolveIsIranianVisitor } from './iranian-visitor';

export type ViewerPriceRequest = {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
};

export type ViewerPrice = { amount: number; currencyCode: string };

/**
 * Prices a batch of items for the visitor making this request.
 *
 *  - Iranian visitor (phone +98, or IP/locale for guests): Rial, no multiplier.
 *    A provider's own Toman price still wins if one is set (existing behaviour).
 *  - Anyone else: the currency of their phone number's country (USD for guests),
 *    multiplied by the provider's international multiplier.
 *
 * The visitor is resolved once per batch, not once per price.
 */
export async function priceItemsForViewer(items: ViewerPriceRequest[]): Promise<(ViewerPrice | null)[]> {
    const session = await getSession().catch(() => null);
    const userId = session?.user?.id ?? null;
    const isIranian = await resolveIsIranianVisitor().catch(() => false);

    const targetCurrencyCode = isIranian
        ? 'IRR'
        : await resolvePreferredCurrencyCode({ userId, fallbackCurrencyCode: 'USD' }).catch(() => 'USD');

    const providerIds = Array.from(new Set(items.map((item) => item.providerId).filter((id): id is string => Boolean(id))));
    const multipliers = new Map<string, number | null>();
    if (!isIranian && providerIds.length) {
        const rows = await sql<{ id: string; multiplier: string | null }[]>`
      select id::text as id, international_price_multiplier as multiplier
      from category.service_providers
      where id = any(${providerIds})
    `;
        for (const row of rows) multipliers.set(row.id, row.multiplier == null ? null : Number(row.multiplier));
    }

    return Promise.all(
        items.map(async (item): Promise<ViewerPrice | null> => {
            if (!Number.isFinite(item.amount) || !item.sourceCurrencyCode) return null;

            try {
                if (isIranian) {
                    if (item.valueToman != null && Number.isFinite(item.valueToman)) {
                        return { amount: item.valueToman, currencyCode: 'IRT' };
                    }
                    const converted = await convertMoney({
                        amount: item.amount,
                        sourceCurrencyCode: item.sourceCurrencyCode,
                        targetCurrencyCode: targetCurrencyCode,
                    });
                    return {
                        amount: roundMoney(converted.targetAmount, converted.targetCurrencyCode),
                        currencyCode: converted.targetCurrencyCode,
                    };
                }

                const converted = await convertProviderPrice({
                    amount: item.amount,
                    sourceCurrencyCode: item.sourceCurrencyCode,
                    targetCurrencyCode,
                    providerMultiplier: item.providerId ? (multipliers.get(item.providerId) ?? null) : null,
                });
                return {
                    amount: roundMoney(converted.targetAmount, converted.targetCurrencyCode),
                    currencyCode: converted.targetCurrencyCode,
                };
            } catch {
                return null;
            }
        }),
    );
}