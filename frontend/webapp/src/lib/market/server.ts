import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { getUserPhoneCountryCode } from "@/features/finance/lib/server/currency-queries";
import { getSession } from "@/lib/auth/session";

import {
  countryFromHeaders,
  displayCurrencyFor,
  resolvePriceTier,
  type PriceTier,
  type TierSource,
} from "./market";

/** The shop's currency selector cookies (src/features/shop/lib/context.ts). */
const PICKED_CURRENCY_COOKIE = "lsevin_shop_ccy";
const PICKED_CURRENCY_LANGUAGE_COOKIE = "lsevin_shop_ccy_lang";

export { countryFromHeaders };

export type VisitorMarket = {
  language: string;
  /** IP country, or null when unknown. */
  country: string | null;
  /** Country of the signed-in user's phone number, or null. */
  phoneCountry: string | null;
  displayCurrency: string;
  tier: PriceTier;
  tierSource: TierSource;
};

async function signedInPhoneCountry(): Promise<string | null> {
  const session = await getSession({ redirectToLogin: false }).catch(() => null);
  const userId = session?.user?.id;
  if (!userId) return null;
  const raw = (session.user as { phoneNumberCountryCode?: string | null }).phoneNumberCountryCode?.trim();
  if (raw && /^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  if (raw && raw.replace(/\D/g, "") === "98") return "IR";
  return getUserPhoneCountryCode(userId).catch(() => null);
}

/** The market of the visitor making this request. Cached per request. */
export const getVisitorMarket = cache(async (localeOverride?: string | null): Promise<VisitorMarket> => {
  const [h, jar, locale, phoneCountry] = await Promise.all([
    headers(),
    cookies(),
    localeOverride ? Promise.resolve(localeOverride) : getLocale().catch(() => "fa"),
    signedInPhoneCountry(),
  ]);
  const language = (locale || "fa").split("-")[0].toLowerCase();
  const country = countryFromHeaders(h);
  const picked = {
    currency: jar.get(PICKED_CURRENCY_COOKIE)?.value?.trim() || null,
    language: jar.get(PICKED_CURRENCY_LANGUAGE_COOKIE)?.value?.trim().split("-")[0].toLowerCase() || null,
  };
  const { tier, source } = resolvePriceTier({ phoneCountry, ipCountry: country, language });
  return {
    language,
    country,
    phoneCountry,
    displayCurrency: displayCurrencyFor({ language, country, picked }),
    tier,
    tierSource: source,
  };
});
