'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

import { cn } from '@/lib/utils';

import { formatMoney } from '../lib/money';

type PriceRequest = {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
    skipMultiplier?: boolean;
};
type PriceResult = { amount: number; currencyCode: string; fallback?: boolean } | null;

const CACHE_MS = 30_000;
const FLUSH_DELAY_MS = 15;
const CHUNK_SIZE = 100;

const cache = new Map<string, { at: number; promise: Promise<PriceResult> }>();
let queue: { request: PriceRequest; locale: string; resolve: (result: PriceResult) => void }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
    const batch = queue;
    queue = [];
    flushTimer = null;

    // One request per page language (the language decides the display currency).
    const byLocale = new Map<string, typeof batch>();
    for (const entry of batch) byLocale.set(entry.locale, [...(byLocale.get(entry.locale) ?? []), entry]);
    for (const [locale, entries] of byLocale) await flushLocale(locale, entries);
}

async function flushLocale(locale: string, batch: typeof queue) {
    for (let start = 0; start < batch.length; start += CHUNK_SIZE) {
        const chunk = batch.slice(start, start + CHUNK_SIZE);
        try {
            const response = await fetch('/api/finance/price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale, items: chunk.map((entry) => entry.request) }),
            });
            const data = response.ok ? await response.json() : null;
            chunk.forEach((entry, index) => entry.resolve(data?.items?.[index] ?? null));
        } catch {
            chunk.forEach((entry) => entry.resolve(null));
        }
    }
}

export function requestPrice(request: PriceRequest, locale: string): Promise<PriceResult> {
    const key = JSON.stringify([locale, request.amount, request.sourceCurrencyCode, request.providerId ?? null, request.valueToman ?? null, Boolean(request.skipMultiplier)]);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;

    const promise = new Promise<PriceResult>((resolve) => {
        queue.push({ request, locale, resolve });
        if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    });
    cache.set(key, { at: Date.now(), promise });
    // Never remember a failure.
    promise.then((result) => {
        if (!result) cache.delete(key);
    });
    return promise;
}

export function ViewerPrice({
                                amount,
                                sourceCurrencyCode,
                                providerId,
                                valueToman,
                                skipMultiplier,
                                locale,
                                className,
                                showCode,
                                compact,
                            }: {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
    skipMultiplier?: boolean;
    locale?: string;
    className?: string;
    showCode?: boolean;
    compact?: boolean;
}) {
    const pageLocale = useLocale();
    const language = (locale || pageLocale || 'fa').split('-')[0];
    // undefined = still asking, null = the request failed.
    const [price, setPrice] = useState<PriceResult | undefined>(undefined);

    useEffect(() => {
        let alive = true;
        setPrice(undefined);
        requestPrice({ amount, sourceCurrencyCode, providerId, valueToman, skipMultiplier }, language).then((result) => {
            if (!result) console.warn('[ViewerPrice] no price returned, showing the original', { amount, sourceCurrencyCode, providerId });
            if (alive) setPrice(result);
        });
        return () => {
            alive = false;
        };
    }, [amount, sourceCurrencyCode, providerId, valueToman, skipMultiplier, language]);

    // No number while waiting: the cached page only knows the base price, and
    // flashing that at an international visitor would show them the unmarked price.
    if (price === undefined) {
        return <span aria-hidden className={cn('inline-block h-[1em] w-16 animate-pulse rounded bg-gray-200 align-middle', className)} />;
    }

    // A failed request shows the provider's own price with its currency code, so
    // it can never be mistaken for the visitor's currency.
    const shown = price ?? { amount, currencyCode: sourceCurrencyCode, fallback: true };
    return (
        <span className={cn('font-semibold tabular-nums', className)} data-testid="price-amount" data-currency={shown.currencyCode}>
      {formatMoney({ amount: shown.amount, currencyCode: shown.currencyCode }, { locale: language, showCode: showCode || shown.fallback, compact })}
    </span>
    );
}