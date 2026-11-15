import { ViewerPrice } from '@/features/finance/components/viewer-price';

/**
 * A price on a cached, shared page (home rails, packages). Priced in the browser
 * for each visitor (src/lib/market/market.ts): the page language's currency,
 * domestic or international. With `providerId` the provider's international
 * multiplier applies to international visitors; without it (LSevin's own
 * packages) it never does, as before.
 *
 * The country/user/target props are accepted for compatibility and ignored: the
 * visitor's market is resolved once, on the server, per request.
 */
export function SafePriceText({
  amount,
  sourceCurrencyCode,
  providerId,
  valueToman,
  locale,
  className,
  showCode = false,
  compact = false,
}: {
  amount: number;
  sourceCurrencyCode: string;
  providerId?: string | null;
  valueToman?: number | null;
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
  return (
    <ViewerPrice
      amount={amount}
      sourceCurrencyCode={sourceCurrencyCode}
      providerId={providerId}
      valueToman={valueToman}
      skipMultiplier={!providerId}
      locale={locale}
      className={className}
      showCode={showCode}
      compact={compact}
    />
  );
}
