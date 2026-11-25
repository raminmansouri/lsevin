"use client";

import { useMemo } from "react";
import { DollarSign } from "lucide-react";

/** A currency the slider can show: its real cheapest / dearest service price (0 when none). */
export type PriceCurrencyOption = {
  code: string;
  label: string;
  symbol: string;
  minPrice: number;
  maxPrice: number;
};

export type PriceRangeValue = {
  currencyCode: string | null;
  /** 0 means no lower limit. */
  minPrice: number;
  /** 0 means no upper limit. */
  maxPrice: number;
};

/** Rounds to two significant digits (1,234,567 -> 1,200,000), so slider values read cleanly. */
function roundPrice(value: number): number {
  if (!(value > 0)) return 0;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

// The slider moves in positions 0..STEPS and maps them to prices on a cubic
// curve: a few very expensive services would otherwise squeeze every ordinary
// price into the first sliver of a linear slider.
const STEPS = 1000;
function positionToPrice(position: number, hi: number) {
  if (position <= 0) return 0;
  if (position >= STEPS) return hi;
  return roundPrice(hi * (position / STEPS) ** 3);
}
function priceToPosition(price: number, hi: number) {
  return Math.round(Math.cbrt(Math.min(Math.max(price / hi, 0), 1)) * STEPS);
}

// Two range inputs share one track; only their thumbs take the pointer.
const THUMB_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#083f30] [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#083f30]";

/**
 * Currency dropdown + two-handle price slider, shared by the explore and the
 * map / list filter panels. Toman and dollar prices are thousands of times
 * apart, so the slider's range comes from the chosen currency's real prices.
 * It follows the page direction: in Persian the cheap end is on the right.
 */
export default function PriceRangeFilter({
  currencies,
  value,
  onChange,
  locale,
  labels,
}: {
  currencies: PriceCurrencyOption[];
  value: PriceRangeValue;
  onChange: (next: PriceRangeValue) => void;
  locale: string;
  labels: { title: string; currency: string; min: string; max: string };
}) {
  const priced = useMemo(() => currencies.filter((currency) => currency.maxPrice > 0), [currencies]);
  // No currency chosen yet: show the one most services use.
  const currency = priced.find((item) => item.code === value.currencyCode) ?? priced[0];
  if (!currency) return null;

  const hi = Math.max(roundPrice(currency.maxPrice * 1.05), currency.maxPrice);
  const low = Math.min(Math.max(value.minPrice, 0), hi);
  const high = Math.max(Math.min(value.maxPrice || hi, hi), low);
  const lowPosition = priceToPosition(low, hi);
  const highPosition = priceToPosition(high, hi);
  const money = (amount: number) =>
    `${amount.toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency.symbol}`.trim();

  // The slider's ends mean "no limit" and are stored as 0. Moving the slider
  // pins the currency it is measured in.
  const setRange = (nextLow: number, nextHigh: number) =>
    onChange({ currencyCode: currency.code, minPrice: nextLow <= 0 ? 0 : nextLow, maxPrice: nextHigh >= hi ? 0 : nextHigh });

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <DollarSign size={20} className="text-[#083f30]" />
        <h3 className="font-sans font-bold text-gray-900">{labels.title}</h3>
      </div>

      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{labels.currency}</label>
      <select
        value={currency.code}
        // A new currency has a different scale: start from its full range.
        onChange={(event) => onChange({ currencyCode: event.target.value, minPrice: 0, maxPrice: 0 })}
        className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10"
      >
        {priced.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label} ({item.symbol})
          </option>
        ))}
      </select>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-50 px-4 py-2.5">
          <p className="text-xs text-gray-500">{labels.min}</p>
          <p className="text-sm font-bold text-[#083f30]">{money(low)}</p>
        </div>
        <div className="rounded-2xl bg-gray-50 px-4 py-2.5">
          <p className="text-xs text-gray-500">{labels.max}</p>
          <p className="text-sm font-bold text-[#083f30]">{money(high)}</p>
        </div>
      </div>

      <div className="relative mt-4 h-6">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#083f30]"
          style={{
            insetInlineStart: `${(lowPosition / STEPS) * 100}%`,
            insetInlineEnd: `${100 - (highPosition / STEPS) * 100}%`,
          }}
        />
        <input
          type="range"
          aria-label={labels.min}
          min={0}
          max={STEPS}
          value={lowPosition}
          onChange={(event) => setRange(Math.min(positionToPrice(Number(event.target.value), hi), high), high)}
          className={THUMB_CLASS}
        />
        <input
          type="range"
          aria-label={labels.max}
          min={0}
          max={STEPS}
          value={highPosition}
          onChange={(event) => setRange(low, Math.max(positionToPrice(Number(event.target.value), hi), low))}
          className={THUMB_CLASS}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{money(0)}</span>
        <span>{money(hi)}</span>
      </div>
    </section>
  );
}
