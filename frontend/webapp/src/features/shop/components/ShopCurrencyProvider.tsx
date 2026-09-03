"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setDisplayCurrencyAction } from "../actions/currency.actions";

const COOKIE = "lsevin_shop_ccy";

function readCookieCurrency(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)lsevin_shop_ccy=([^;]+)/);
  const v = m?.[1] ? decodeURIComponent(m[1]).trim().toUpperCase() : "";
  return v || null;
}

type Ctx = {
  /** The currency prices should be displayed in for this visitor. */
  currency: string;
  /** Persisted default (from settings) — used before the visitor picks one. */
  defaultCurrency: string;
  setCurrency: (code: string) => void;
};

const ShopCurrencyContext = createContext<Ctx | null>(null);

/**
 * Holds the visitor's chosen display currency for statically-rendered shop
 * pages. Storefront prices come off the server in their own stored currency
 * (`noFx`); `<ShopPrice>` converts to `currency` on the client, and the
 * `CurrencySwitcher` updates it here (+ persists the cookie) with no reload.
 */
export function ShopCurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: string;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState(defaultCurrency);

  useEffect(() => {
    const fromCookie = readCookieCurrency();
    if (fromCookie && fromCookie !== currency) setCurrencyState(fromCookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = code.trim().toUpperCase();
    if (!next) return;
    setCurrencyState(next);
    try {
      document.cookie = `${COOKIE}=${encodeURIComponent(next)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {
      /* private mode — the action below still persists it server-side */
    }
    void setDisplayCurrencyAction({ currency: next }).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(
    () => ({ currency, defaultCurrency, setCurrency }),
    [currency, defaultCurrency, setCurrency],
  );

  return <ShopCurrencyContext.Provider value={value}>{children}</ShopCurrencyContext.Provider>;
}

export function useShopCurrency(): Ctx {
  return (
    useContext(ShopCurrencyContext) ?? {
      currency: "USD",
      defaultCurrency: "USD",
      setCurrency: () => {},
    }
  );
}
