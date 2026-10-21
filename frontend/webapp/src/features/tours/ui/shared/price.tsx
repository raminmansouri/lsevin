"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";

import { Bdi } from "./bidi";
import { formatMoney } from "./format";

const RATE_BASE = 1_000_000_000_000;
const rateCache = new Map<string, Promise<number | null>>();

/**
 * Approximate display-currency rate from the platform's own conversion API
 * (/api/finance/convert). Null when unavailable — the UI then shows only the
 * currency that is charged (S-053: explicit fallback, never a guessed rate).
 */
function loadRate(from: string, to: string): Promise<number | null> {
  const key = `${from}>${to}`;
  let hit = rateCache.get(key);
  if (!hit) {
    hit = fetch(`/api/finance/convert?amount=${RATE_BASE}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { data?: { targetAmount?: number | string } };
        const target = Number(json?.data?.targetAmount);
        return Number.isFinite(target) && target > 0 ? target / RATE_BASE : null;
      })
      .catch(() => null);
    rateCache.set(key, hit);
    // A failed lookup may be retried on the next mount rather than cached forever.
    void hit.then((r) => { if (r == null) rateCache.delete(key); });
  }
  return hit;
}

export function useApproxRate(from: string, to: string | null | undefined): number | null {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    if (!to || to === from) {
      setRate(null);
      return;
    }
    void loadRate(from, to).then((r) => { if (alive) setRate(r); });
    return () => { alive = false; };
  }, [from, to]);
  return rate;
}

/**
 * A price in the currency that is charged, bidi-isolated. With `displayCurrency`
 * set (and different) an approximate conversion is shown next to it, clearly
 * labelled — the charge currency stays explicit (C-018, S-032).
 */
export function Price({
  amount,
  currency,
  decimals,
  displayCurrency,
  className,
  approxClassName,
  testId,
  formatApprox,
}: {
  formatApprox?: (formatted: string) => string;
  amount: number | null | undefined;
  currency: string;
  decimals?: number;
  displayCurrency?: string | null;
  className?: string;
  approxClassName?: string;
  testId?: string;
}) {
  const locale = useLocale();
  const rate = useApproxRate(currency, displayCurrency);
  const text = formatMoney(amount, currency, locale, decimals);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <Bdi dir="auto" className={className} testId={testId}>
        {text}
      </Bdi>
      {rate != null && amount != null && displayCurrency ? (
        <span className={cn("text-muted-foreground text-xs", approxClassName)} data-testid="price-approx">
          {formatApprox
            ? formatApprox(formatMoney(amount * rate, displayCurrency, locale))
            : `≈ ${formatMoney(amount * rate, displayCurrency, locale)}`}
        </span>
      ) : null}
    </span>
  );
}
