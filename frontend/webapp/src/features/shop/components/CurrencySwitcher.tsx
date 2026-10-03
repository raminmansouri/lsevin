"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { currencyLabel } from "./money";
import { useShopCurrency } from "./ShopCurrencyProvider";

export function CurrencySwitcher({ className }: { className?: string }) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const { currency, options, pending, setCurrency } = useShopCurrency();
  if (!options.length) {
    return currency ? (
      <span className="text-xs text-white">
        {currencyLabel(currency, locale)}
      </span>
    ) : null;
  }

  return (
    <select
      aria-label={t("changeCurrency")}
      aria-busy={pending}
      disabled={pending}
      value={currency}
      onChange={(event) => void setCurrency(event.target.value)}
      className={cn(
        "max-w-32 rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60",
        className
      )}
    >
      {!options.some((option) => option.code === currency) && (
        <option value={currency}>{currencyLabel(currency, locale)}</option>
      )}
      {options.map((option) => (
        <option
          key={option.code}
          value={option.code}
          className="bg-white text-neutral-900"
        >
          {currencyLabel(option.code, locale)} ({option.code})
        </option>
      ))}
    </select>
  );
}
