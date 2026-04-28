export type CurrencyCode = string;

export type Currency = {
  code: CurrencyCode;
  name: string;
  nativeName: string | null;
  symbol: string;
  decimalDigits: number;
  isIso: boolean;
  isActive: boolean;
  isDisplayEnabled: boolean;
  isPaymentEnabled: boolean;
  isSettlementEnabled: boolean;
  sortOrder: number;
};

export type Money = {
  amount: number;
  currencyCode: CurrencyCode;
};

export type ConvertedMoney = {
  sourceAmount: number;
  sourceCurrencyCode: CurrencyCode;
  targetAmount: number;
  targetCurrencyCode: CurrencyCode;
  baseRate: number;
  appliedRate: number;
  marginPercent: number;
  exchangeRateIds: string[];
  ratePath: string[];
  asOf: string;
  expiresAt: string | null;
};

export type FxQuote = ConvertedMoney & {
  id: string;
  userId: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  quoteExpiresAt: string;
};

export type PreferredCurrencyInput = {
  userId?: string | null;
  explicitCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  fallbackCurrencyCode?: string;
};
