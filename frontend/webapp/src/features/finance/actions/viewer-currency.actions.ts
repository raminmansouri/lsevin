"use server";

import { getSession } from "@/lib/auth/session";
import {
  getDefaultCurrencyForCountry,
  getUserPhoneCountryCode,
} from "@/features/finance/lib/server/currency-queries";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";

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