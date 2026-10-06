"use server";

import { getSession } from "@/lib/auth/session";
import {
  getDefaultCurrencyForCountry,
  getUserPhoneCountryCode,
} from "@/features/finance/lib/server/currency-queries";

/** The logged-in viewer's main currency, from the country of their login phone number. */
export async function getViewerMainCurrencyAction(): Promise<string | null> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return null;
    const country = await getUserPhoneCountryCode(userId);
    return await getDefaultCurrencyForCountry(country);
  } catch {
    return null;
  }
}
