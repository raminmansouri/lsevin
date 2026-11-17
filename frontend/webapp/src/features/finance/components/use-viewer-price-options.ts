"use client";

import { useEffect, useState } from "react";

import { getViewerPriceOptionsAction } from "../actions/viewer-currency.actions";
import type { ConvertedMoney } from "../types";

type Input = {
  amount: number;
  originalAmount?: number | null;
  sourceCurrencyCode: string;
  providerId?: string | null;
  valueToman?: number | null;
  currencies: string[];
  locale: string;
};

export type ViewerPriceOptions = {
  displayCurrencyCode: string;
  options: ConvertedMoney[];
  originalOptions: ConvertedMoney[];
};

/**
 * A page price in the converter's currencies, priced for this visitor on the
 * server (language currency first; domestic or international price). Null while
 * loading: the cached page can't know the visitor, so it shows no number rather
 * than a wrong one.
 */
export function useViewerPriceOptions(input: Input): ViewerPriceOptions | null {
  const [result, setResult] = useState<ViewerPriceOptions | null>(null);
  const key = JSON.stringify(input);
  useEffect(() => {
    // Keyed by the serialized input, so a new object with the same values is not a new request.
    const request = JSON.parse(key) as Input;
    let alive = true;
    setResult(null);
    getViewerPriceOptionsAction(request)
      .then((value) => {
        if (alive) setResult(value as unknown as ViewerPriceOptions);
      })
      .catch(() => {
        if (alive) setResult({ displayCurrencyCode: request.sourceCurrencyCode, options: [], originalOptions: [] });
      });
    return () => {
      alive = false;
    };
  }, [key]);
  return result;
}
