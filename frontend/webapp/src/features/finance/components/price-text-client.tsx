'use client';

import { cn } from '@/lib/utils';

import { formatMoney } from '../lib/money';
import type { Currency } from '../types';

export function PriceTextClient({
  amount,
  currencyCode,
  locale,
  currencies,
  className,
  showCode,
  compact,
}: {
  amount: number;
  currencyCode: string;
  locale?: string;
  currencies?: Currency[];
  className?: string;
  showCode?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={cn('font-semibold tabular-nums', className)}>
      {formatMoney({ amount, currencyCode }, { locale, currencies, showCode, compact })}
    </span>
  );
}
