import { cn } from '@/lib/utils';

import { formatMoney } from '../lib/money';
import { convertMoney, resolvePreferredCurrencyCode } from '../lib/server/currency-queries';

export async function PriceText({
  amount,
  sourceCurrencyCode,
  targetCurrencyCode,
  userId,
  selectedCountryCode,
  browserCountryCode,
  locale,
  className,
  showSourceWhenConverted = false,
  showCode = false,
  compact = false,
  marginProfile = 'standard',
}: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode?: string | null;
  userId?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  locale?: string;
  className?: string;
  showSourceWhenConverted?: boolean;
  showCode?: boolean;
  compact?: boolean;
  marginProfile?: string;
}) {
  const resolvedTarget = await resolvePreferredCurrencyCode({
    userId,
    explicitCurrencyCode: targetCurrencyCode,
    selectedCountryCode,
    browserCountryCode,
    fallbackCurrencyCode: sourceCurrencyCode,
  });

  const converted = await convertMoney({
    amount,
    sourceCurrencyCode,
    targetCurrencyCode: resolvedTarget,
    marginProfile,
  });

  const targetText = formatMoney(
    { amount: converted.targetAmount, currencyCode: converted.targetCurrencyCode },
    { locale, showCode, compact }
  );

  const sourceText = formatMoney(
    { amount: converted.sourceAmount, currencyCode: converted.sourceCurrencyCode },
    { locale, showCode: true, compact }
  );

  return (
    <span className={cn('font-semibold tabular-nums', className)} title={showSourceWhenConverted ? sourceText : undefined}>
      {targetText}
      {showSourceWhenConverted && converted.sourceCurrencyCode !== converted.targetCurrencyCode ? (
        <span className="ml-1 text-xs font-normal text-muted-foreground">≈ {sourceText}</span>
      ) : null}
    </span>
  );
}
