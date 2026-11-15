"use server";

import { getSession } from "@/lib/auth/session";
import {
  getDefaultCurrencyForCountry,
  getUserPhoneCountryCode,
} from "@/features/finance/lib/server/currency-queries";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";
import { priceOptionsForViewer } from "@/features/finance/lib/server/viewer-pricing";
import { isLocale } from "@/lib/market/market";

export type ViewerPricing = { currencyCode: string | null; isIranian: boolean };

/**
 * The viewer's main currency (from their login phone's country) and whether they
 * are Iranian (same rule as the booking flow: phone, then IP, then locale).
 */
export async function getViewerPricingAction(): Promise<ViewerPricing> {
  // On failure assume Iranian, so prices are never wrongly inflated.
  const isIranian = await resolveIsIranianVisitor().catch(() => true);
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { currencyCode: null, isIranian };
    const country = await getUserPhoneCountryCode(userId);
    return { currencyCode: await getDefaultCurrencyForCountry(country), isIranian };
  } catch {
    return { currencyCode: null, isIranian };
  }
}
/**
 * The service page's price in each currency of its converter, for this visitor
 * (src/features/finance/lib/server/viewer-pricing.ts). Returns the price and the
 * original (pre-discount) price.
 */
export async function getViewerPriceOptionsAction(input: {
  amount: number;
  originalAmount?: number | null;
  sourceCurrencyCode: string;
  providerId?: string | null;
  valueToman?: number | null;
  currencies: string[];
  locale?: string | null;
}) {
  const currencies = (input.currencies || []).filter((code) => /^[A-Z]{3,4}$/.test(String(code))).slice(0, 12);
  const locale = input.locale && isLocale(input.locale) ? input.locale : null;
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || !/^[A-Z]{3,4}$/.test(input.sourceCurrencyCode)) {
    return { displayCurrencyCode: input.sourceCurrencyCode, options: [], originalOptions: [] };
  }
  const providerId = input.providerId && /^[0-9a-f-]{36}$/i.test(input.providerId) ? input.providerId : null;
  const base = { sourceCurrencyCode: input.sourceCurrencyCode, providerId, currencies, locale };
  const [price, original] = await Promise.all([
    priceOptionsForViewer({ ...base, amount, valueToman: input.valueToman ?? null }),
    input.originalAmount && Number(input.originalAmount) > amount
      ? priceOptionsForViewer({ ...base, amount: Number(input.originalAmount) })
      : Promise.resolve(null),
  ]);
  return { displayCurrencyCode: price.displayCurrencyCode, options: price.options, originalOptions: original?.options ?? price.options };
}
