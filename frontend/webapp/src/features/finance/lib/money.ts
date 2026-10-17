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
  const locale = options?.locale || 'fa-IR';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      notation: options?.compact ? 'compact' : 'standard',
    }).format(money.amount);

    // The rial/toman label already names the currency; appending "IRR" after it is noise.
    const rialTomanLabel = getRialTomanLabel(currencyCode, locale);
    const symbol = rialTomanLabel ?? getCurrencySymbol(currencyCode, options?.currencies);
    const suffixCurrencies = new Set(['AED', 'OMR', 'IQD', 'KWD', 'QAR', 'SAR', 'IRR', 'IRT']);
    const symbolIsCode = symbol === currencyCode;
    const text = suffixCurrencies.has(currencyCode) || symbolIsCode
      ? `${formatted} ${symbol}`
      : `${symbol}${formatted}`;
    return options?.showCode && !rialTomanLabel && !symbolIsCode ? `${text} ${currencyCode}` : text;
  } catch {
    const label = getRialTomanLabel(currencyCode, locale);
    return `${label ?? getCurrencySymbol(currencyCode, options?.currencies)} ${money.amount.toLocaleString()}${options?.showCode && !label ? ` ${currencyCode}` : ''}`;
  }
}

export function calculateDiscountPercent(amount: number, originalAmount?: number | null): number | null {
  if (!originalAmount || originalAmount <= 0 || amount >= originalAmount) return null;
  return Math.round(((originalAmount - amount) / originalAmount) * 100);
}

const RIAL_TOMAN_LABELS: Record<string, { IRR: string; IRT: string }> = {
  fa: { IRR: 'ریال', IRT: 'تومان' },
  ar: { IRR: 'ريال', IRT: 'تومان' },
  ku: { IRR: 'ریال', IRT: 'تمەن' },
};

/**
 * Human-readable name for IRR/IRT in the viewer's language ("ریال"/"تومان" in
 * fa, "Rial"/"Toman" elsewhere). Returns null for every other currency.
 *
 * Intl's currency style cannot do this: IRR has no reliable localized symbol
 * across ICU builds (it prints the raw ISO code "IRR"), and IRT is not an ISO
 * code at all (it throws), so Iranian amounts must never go through it.
 */
export function getRialTomanLabel(currencyCode: string | null | undefined, locale?: string | null): string | null {
  const code = normalizeCurrencyCode(currencyCode);
  if (code !== 'IRR' && code !== 'IRT') return null;
  const lang = String(locale || 'fa').replace('_', '-').split('-')[0].toLowerCase();
  return RIAL_TOMAN_LABELS[lang]?.[code] ?? (code === 'IRR' ? 'Rial' : 'Toman');
}

/**
 * Display helper for UI strings that only have a plain amount + ISO code.
 * IRR/IRT render as "1,100,000,000 ریال"/"... تومان" (never the raw code);
 * everything else uses Intl's currency style and falls back to "CODE amount"
 * for codes Intl rejects.
 */
export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  currencyCode: string | null | undefined,
  locale?: string | null,
  options?: { maximumFractionDigits?: number }
): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const code = normalizeCurrencyCode(currencyCode);
  const intlLocale = String(locale || 'fa-IR').replace('_', '-');
  const label = getRialTomanLabel(code, intlLocale);

  try {
    if (label) {
      return `${new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(safe)} ${label}`;
    }
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: options?.maximumFractionDigits ?? (safe % 1 === 0 ? 0 : 2),
    }).format(safe);
  } catch {
    return `${safe.toLocaleString()} ${label ?? code}`;
  }
}
