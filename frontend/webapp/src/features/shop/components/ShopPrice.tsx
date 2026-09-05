"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { formatShopMoney } from "./money";
import { useShopCurrency } from "./ShopCurrencyProvider";

// One in-memory rate table per (from → to), shared by every <ShopPrice> on the
// page, plus in-flight de-duplication so a grid of 40 cards makes one request.
const rateCache = new Map<string, number>();
const inflight = new Map<string, Promise<number | null>>();

async function getRate(from: string, to: string): Promise<number | null> {
  const key = `${from}>${to}`;
  if (rateCache.has(key)) return rateCache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = fetch(`/api/finance/convert?amount=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: { accept: "application/json" },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => {
      const rate = Number(body?.data?.appliedRate ?? body?.data?.targetAmount);
      if (Number.isFinite(rate) && rate > 0) {
        rateCache.set(key, rate);
        return rate;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/**
 * Renders a stored price, converted to the visitor's display currency on the
 * client. `amount` / `currency` are the values as stored (the server sends them
 * untouched on statically-rendered pages). Falls back to the stored currency
 * while the rate loads or if Finance has no rate.
 */
export function ShopPrice({
  amount,
  currency,
  locale = "en",
  className,
  unavailable,
  unavailableLabel,
}: {
  amount: number;
  currency: string;
  locale?: string;
  className?: string;
  unavailable?: boolean;
  unavailableLabel?: string;
}) {
  const { currency: target } = useShopCurrency();
  const [display, setDisplay] = useState<{ amount: number; currency: string }>({ amount, currency });

  useEffect(() => {
    let alive = true;
    const from = (currency || "").toUpperCase();
    const to = (target || "").toUpperCase();
    if (!from || !to || from === to) {
      setDisplay({ amount, currency: from || currency });
      return;
    }
    getRate(from, to).then((rate) => {
      if (!alive) return;
      setDisplay(rate ? { amount: amount * rate, currency: to } : { amount, currency: from });
    });
    return () => {
      alive = false;
    };
  }, [amount, currency, target]);

  if (unavailable) {
    return <span className={cn("font-semibold text-muted-foreground", className)}>{unavailableLabel ?? "—"}</span>;
  }

  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {formatShopMoney(display.amount, display.currency, locale)}
    </span>
  );
}
