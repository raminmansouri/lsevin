import { PriceText } from '@/features/finance/components/price-text';
import { formatMoney } from '@/features/finance/lib/money';

export async function SafePriceText({
  amount,
  sourceCurrencyCode,
  targetCurrencyCode,
  selectedCountryCode,
  browserCountryCode,
  userId,
  locale,
  className,
  showSourceWhenConverted = false,
  showCode = false,
  compact = false,
}: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  userId?: string | null;
  locale?: string;
  className?: string;
  showSourceWhenConverted?: boolean;
  showCode?: boolean;
  compact?: boolean;
}) {
  try {
    return await PriceText({
      amount,
      sourceCurrencyCode,
      targetCurrencyCode,
      selectedCountryCode,
      browserCountryCode,
      userId,
      locale,
      className,
      showSourceWhenConverted,
      showCode,
      compact,
    });
  } catch {
    return (
      <span className={className}>
        {formatMoney({ amount, currencyCode: sourceCurrencyCode }, { locale, showCode, compact })}
      </span>
    );
  }
}
