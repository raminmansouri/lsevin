"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useShopCurrency } from "./ShopCurrencyProvider";

export function CurrencySwitcher({
  current,
  options,
  className,
}: {
  current: string;
  options: Array<{ code: string; symbol: string; name: string }>;
  className?: string;
}) {
  const t = useTranslations("Shop");
  const [open, setOpen] = useState(false);
  const { currency: activeCurrency, setCurrency } = useShopCurrency();

  if (!options.length) return null;

  // `current` is the server-rendered default; the live choice comes from context.
  const shown = activeCurrency || current;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("changeCurrency")}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
      >
        {shown}
        <span className="text-[9px] opacity-80">▼</span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-1 max-h-72 w-52 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/10">
            {options.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  setCurrency(o.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-50",
                  o.code === shown && "font-bold text-[#083f30]"
                )}
              >
                <span>
                  {o.code} <span className="text-neutral-400">· {o.name}</span>
                </span>
                <span className="text-neutral-400">{o.symbol}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
