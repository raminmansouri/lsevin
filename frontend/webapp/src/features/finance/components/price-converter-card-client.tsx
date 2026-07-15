'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { calculateDiscountPercent, formatMoney } from '../lib/money';
import type { ConvertedMoney } from '../types';

export function PriceConverterCardClient({
  label = 'Package Price',
  convertedPrices,
  convertedOriginalPrices = [],
  initialCurrencyCode,
  selectedCurrencyCode,
  onCurrencyChange,
  locale,
  saveLabel,
  convertedFromLabel,
  badgeText = 'All-inclusive package',
  className,
}: {
  label?: string;
  convertedPrices: ConvertedMoney[];
  convertedOriginalPrices?: ConvertedMoney[];
  initialCurrencyCode?: string;
  /** When provided, the card is controlled by the parent (keeps it in sync with the reservation bar). */
  selectedCurrencyCode?: string;
  onCurrencyChange?: (currencyCode: string) => void;
  /** Active locale for number/currency formatting (defaults to fa-IR inside formatMoney). */
  locale?: string;
  /** Translated "Save {percent}%" template ({percent} placeholder). Falls back to English. */
  saveLabel?: (percent: number) => string;
  /** Translated "Converted from {value}" template ({value} placeholder). Falls back to English. */
  convertedFromLabel?: (value: string) => string;
  badgeText?: string;
  className?: string;
}) {
  const currencyCodes = useMemo(
    () => convertedPrices.map((price) => price.targetCurrencyCode),
    [convertedPrices]
  );
  const [internalCurrency, setInternalCurrency] = useState(initialCurrencyCode || currencyCodes[0] || 'USD');
  // Controlled when the parent passes selectedCurrencyCode; otherwise uses local state.
  const selectedCurrency = selectedCurrencyCode ?? internalCurrency;

  const selectCurrency = (currencyCode: string) => {
    setInternalCurrency(currencyCode);
    onCurrencyChange?.(currencyCode);
  };

  const price = convertedPrices.find((item) => item.targetCurrencyCode === selectedCurrency) || convertedPrices[0];
  const originalPrice = convertedOriginalPrices.find((item) => item.targetCurrencyCode === selectedCurrency) || null;

  if (!price) return null;

  const discountPercent = calculateDiscountPercent(price.targetAmount, originalPrice?.targetAmount);

  return (
    <div className={cn('mb-6 rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-4', className)}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-white/80">{label}</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="text-3xl font-bold text-white">
              {formatMoney({ amount: price.targetAmount, currencyCode: price.targetCurrencyCode }, { locale })}
            </div>
            {originalPrice && originalPrice.targetAmount > price.targetAmount ? (
              <div className="text-lg text-white/60 line-through">
                {formatMoney({ amount: originalPrice.targetAmount, currencyCode: originalPrice.targetCurrencyCode }, { locale })}
              </div>
            ) : null}
          </div>
          {discountPercent ? (
            <p className="mt-1 text-sm font-semibold text-[#eacb7f]">
              {saveLabel ? saveLabel(discountPercent) : `Save ${discountPercent}%`} • {badgeText}
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[#eacb7f]">{badgeText}</p>
          )}
          {price.sourceCurrencyCode !== price.targetCurrencyCode ? (
            <p className="mt-1 text-xs text-white/55">
              {(() => {
                const value = formatMoney(
                  { amount: price.sourceAmount, currencyCode: price.sourceCurrencyCode },
                  { showCode: true, locale }
                );
                return convertedFromLabel ? convertedFromLabel(value) : `Converted from ${value}`;
              })()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {currencyCodes.map((currency) => (
          <button
            key={currency}
            type="button"
            onClick={() => selectCurrency(currency)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              selectedCurrency === currency
                ? 'bg-[#eacb7f] text-[#083f30]'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
          >
            {currency}
          </button>
        ))}
      </div>
    </div>
  );
}
