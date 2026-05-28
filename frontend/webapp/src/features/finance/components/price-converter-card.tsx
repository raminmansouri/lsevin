import { getConvertedPriceOptions } from '../lib/server/currency-queries';
import { PriceConverterCardClient } from './price-converter-card-client';

export async function PriceConverterCard({
  label,
  amount,
  originalAmount,
  sourceCurrencyCode,
  allowedCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'TRY', 'IRT'],
  initialCurrencyCode,
  badgeText,
  marginProfile = 'standard',
  className,
}: {
  label?: string;
  amount: number;
  originalAmount?: number | null;
  sourceCurrencyCode: string;
  allowedCurrencies?: string[];
  initialCurrencyCode?: string;
  badgeText?: string;
  marginProfile?: string;
  className?: string;
}) {
  const currencies = Array.from(new Set([sourceCurrencyCode, ...allowedCurrencies]));
  const convertedPrices = await getConvertedPriceOptions({
    amount,
    sourceCurrencyCode,
    targetCurrencyCodes: currencies,
    marginProfile,
  });

  const convertedOriginalPrices = originalAmount
    ? await getConvertedPriceOptions({
        amount: originalAmount,
        sourceCurrencyCode,
        targetCurrencyCodes: currencies,
        marginProfile,
      })
    : [];

  return (
    <PriceConverterCardClient
      label={label}
      convertedPrices={convertedPrices}
      convertedOriginalPrices={convertedOriginalPrices}
      initialCurrencyCode={initialCurrencyCode}
      badgeText={badgeText}
      className={className}
    />
  );
}
