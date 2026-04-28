import type { Currency, CurrencyCode, Money } from '../types';

const FALLBACK_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  TRY: '₺',
  IRR: 'ریال',
  IRT: 'تومان',
  OMR: 'OMR',
  IQD: 'IQD',
  KWD: 'KWD',
  QAR: 'QAR',
  SAR: 'SAR',
  RUB: '₽',
  CNY: '¥',
};

export function normalizeCurrencyCode(value: string | null | undefined): CurrencyCode {
  return (value || 'USD').trim().toUpperCase();
}

export function getCurrencySymbol(currencyCode: string, currencies?: Currency[]): string {
  const normalized = normalizeCurrencyCode(currencyCode);
  return currencies?.find((item) => item.code === normalized)?.symbol ?? FALLBACK_SYMBOLS[normalized] ?? normalized;
}

export function getCurrencyDecimalDigits(currencyCode: string, currencies?: Currency[]): number {
  const normalized = normalizeCurrencyCode(currencyCode);
  const fromList = currencies?.find((item) => item.code === normalized)?.decimalDigits;
  if (typeof fromList === 'number') return fromList;
  if (['IRR', 'IRT', 'IQD'].includes(normalized)) return 0;
  if (['KWD', 'OMR'].includes(normalized)) return 3;
  return 2;
}

export function roundMoney(amount: number, currencyCode: string, currencies?: Currency[]): number {
  const digits = getCurrencyDecimalDigits(currencyCode, currencies);
  const factor = Math.pow(10, digits);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function formatMoney(
  money: Money,
  options?: {
    locale?: string;
    currencies?: Currency[];
    showCode?: boolean;
    compact?: boolean;
  }
): string {
  const currencyCode = normalizeCurrencyCode(money.currencyCode);
  const digits = getCurrencyDecimalDigits(currencyCode, options?.currencies);
  const locale = options?.locale || 'en-US';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      notation: options?.compact ? 'compact' : 'standard',
    }).format(money.amount);

    const symbol = getCurrencySymbol(currencyCode, options?.currencies);
    const suffixCurrencies = new Set(['AED', 'OMR', 'IQD', 'KWD', 'QAR', 'SAR', 'IRR', 'IRT']);
    const text = suffixCurrencies.has(currencyCode) ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
    return options?.showCode ? `${text} ${currencyCode}` : text;
  } catch {
    return `${getCurrencySymbol(currencyCode, options?.currencies)} ${money.amount.toLocaleString()}${options?.showCode ? ` ${currencyCode}` : ''}`;
  }
}

export function calculateDiscountPercent(amount: number, originalAmount?: number | null): number | null {
  if (!originalAmount || originalAmount <= 0 || amount >= originalAmount) return null;
  return Math.round(((originalAmount - amount) / originalAmount) * 100);
}
