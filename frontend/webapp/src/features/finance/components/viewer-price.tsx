'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { formatMoney } from '../lib/money';

type PriceRequest = {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
};
type PriceResult = { amount: number; currencyCode: string } | null;

const CACHE_MS = 30_000;
const FLUSH_DELAY_MS = 15;
const CHUNK_SIZE = 100;

const cache = new Map<string, { at: number; promise: Promise<PriceResult> }>();
let queue: { request: PriceRequest; resolve: (result: PriceResult) => void }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
    const batch = queue;
    queue = [];
    flushTimer = null;

    for (let start = 0; start < batch.length; start += CHUNK_SIZE) {
        const chunk = batch.slice(start, start + CHUNK_SIZE);
        try {
            const response = await fetch('/api/finance/price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: chunk.map((entry) => entry.request) }),
            });
            const data = response.ok ? await response.json() : null;
            chunk.forEach((entry, index) => entry.resolve(data?.items?.[index] ?? null));
        } catch {
            chunk.forEach((entry) => entry.resolve(null));
        }
    }
}

function requestPrice(request: PriceRequest): Promise<PriceResult> {
    const key = JSON.stringify([request.amount, request.sourceCurrencyCode, request.providerId ?? null, request.valueToman ?? null]);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;

    const promise = new Promise<PriceResult>((resolve) => {
        queue.push({ request, resolve });
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
                                locale,
                                className,
                                showCode,
                                compact,
                            }: {
    amount: number;
    sourceCurrencyCode: string;
    providerId?: string | null;
    valueToman?: number | null;
    locale?: string;
    className?: string;
    showCode?: boolean;
    compact?: boolean;
}) {
    // undefined = still asking, null = the request failed.
    const [price, setPrice] = useState<PriceResult | undefined>(undefined);

    useEffect(() => {
        let alive = true;
        setPrice(undefined);
        requestPrice({ amount, sourceCurrencyCode, providerId, valueToman }).then((result) => {
            if (alive) setPrice(result);
        });
        return () => {
            alive = false;
        };
    }, [amount, sourceCurrencyCode, providerId, valueToman]);

    // No number while waiting: the cached page only knows the base price, and
    // flashing that at an international visitor would show them the unmarked price.
    if (price === undefined) {
        return <span aria-hidden className={cn('inline-block h-[1em] w-16 animate-pulse rounded bg-gray-200 align-middle', className)} />;
    }

    const shown = price ?? { amount, currencyCode: sourceCurrencyCode };
    return (
        <span className={cn('font-semibold tabular-nums', className)}>
      {formatMoney({ amount: shown.amount, currencyCode: shown.currencyCode }, { locale, showCode, compact })}
    </span>
    );
}