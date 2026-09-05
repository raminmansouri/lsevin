import { getCurrencyDecimalDigits, getCurrencySymbol, normalizeCurrencyCode } from "@/features/finance/lib/money";
import { cn } from "@/lib/utils";

import type { MoneyView } from "../types/domain";

const RTL_LOCALES = new Set(["fa", "ar", "ku", "he", "ur"]);

function bcp47(locale: string): string {
  return locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : locale === "tr" ? "tr-TR" : locale === "ru" ? "ru-RU" : "en-US";
}

/**
 * Localized short currency names. The customer sees "۸٫۱۲ دلار", not "$8.12"
 * (SHP-I18N-012). Finance owns the amount + decimal rules; this owns the label.
 */
const CURRENCY_NAMES: Record<string, Record<string, string>> = {
  fa: { USD: "دلار", EUR: "یورو", TRY: "لیر", GBP: "پوند", AED: "درهم", IRR: "ریال", IRT: "تومان", RUB: "روبل", CNY: "یوان" },
  ar: { USD: "دولار", EUR: "يورو", TRY: "ليرة", GBP: "جنيه", AED: "درهم", IRR: "ريال", IRT: "تومان", RUB: "روبل", CNY: "يوان" },
  ku: { USD: "دۆلار", EUR: "یۆرۆ", TRY: "لیرە", IRR: "ریال", IRT: "تمەن" },
};

export function currencyLabel(currency: string, locale = "en"): string {
  const code = normalizeCurrencyCode(currency);
  const mapped = CURRENCY_NAMES[locale]?.[code];
  if (mapped) return mapped;
  if (locale !== "en") {
    try {
      const dn = new Intl.DisplayNames([bcp47(locale)], { type: "currency" }).of(code);
      if (dn && dn !== code) return dn;
    } catch {
      /* Intl.DisplayNames currency not supported in this runtime */
    }
  }
  return getCurrencySymbol(code);
}

/** Just the number, formatted for the locale + the currency's decimal rules. */
export function formatAmount(amount: number, currency: string, locale = "en"): string {
  const digits = getCurrencyDecimalDigits(currency);
  try {
    return new Intl.NumberFormat(bcp47(locale), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return amount.toFixed(digits);
  }
}

/**
 * Full money string with a localized currency label. RTL locales read
 * "amount label" ("۸٫۱۲ دلار"); LTR reads "symbol amount" ("$ 8.12") — collapsed
 * to "$8.12" when the label is a one/two-char symbol.
 */
export function formatShopMoney(amount: number, currency: string, locale = "en"): string {
  const num = formatAmount(amount, currency, locale);
  const label = currencyLabel(currency, locale);
  if (RTL_LOCALES.has(locale)) return `${num} ${label}`;
  return label.length <= 2 ? `${label}${num}` : `${label} ${num}`;
}

export function MoneyAmount({
  value,
  locale = "en",
  className,
  size = "md",
  showApprox = false,
  unavailableLabel = "—",
}: {
  value: Pick<MoneyView, "amount" | "currency" | "sourceAmount" | "sourceCurrency" | "converted" | "unavailable">;
  locale?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showApprox?: boolean;
  unavailableLabel?: string;
}) {
  if (value.unavailable) {
    return <span className={cn("font-medium text-muted-foreground", className)}>{unavailableLabel}</span>;
  }
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg font-bold",
    xl: "text-2xl font-extrabold",
  } as const;
  return (
    <span className={cn("tabular-nums", sizes[size], className)}>
      {formatShopMoney(value.amount, value.currency, locale)}
      {showApprox && value.converted && value.sourceCurrency !== value.currency ? (
        <span className="ms-1 text-[0.7em] font-normal text-muted-foreground">
          ≈ {formatShopMoney(value.sourceAmount, value.sourceCurrency, locale)}
        </span>
      ) : null}
    </span>
  );
}

export function PlainMoney({
  amount,
  currency,
  locale = "en",
  className,
  size = "md",
}: {
  amount: number;
  currency: string;
  locale?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <MoneyAmount
      value={{ amount, currency, sourceAmount: amount, sourceCurrency: currency, converted: false, unavailable: false }}
      locale={locale}
      className={className}
      size={size}
    />
  );
}
