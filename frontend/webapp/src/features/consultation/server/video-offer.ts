"use server";

import { getLocale } from "next-intl/server";

import { formatMoney } from "@/features/finance/lib/money";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";
import { resolveDisplayPrice } from "@/features/finance/lib/server/toman-price";

import type { VideoConsultationOffer } from "../types";
import { consultationSchemaExists, getVideoConsultationSettings } from "./repository";

const HIDDEN: VideoConsultationOffer = { enabled: false, durationMinutes: 0, priceLabel: "" };

/**
 * The home card's length and price, resolved for this visitor. Read on the client
 * after load because the home page is static: resolving the visitor here (phone,
 * IP, locale) would make the whole page dynamic.
 */
export async function getVideoConsultationOfferAction(): Promise<VideoConsultationOffer> {
  try {
    if (!(await consultationSchemaExists())) return HIDDEN;
    const settings = await getVideoConsultationSettings();
    if (!settings.enabled) return HIDDEN;

    const [locale, isIranian] = await Promise.all([getLocale(), resolveIsIranianVisitor()]);
    const price = resolveDisplayPrice(
      { value: settings.priceAmount, currency: settings.priceCurrency },
      settings.priceToman,
      isIranian
    );

    return {
      enabled: true,
      durationMinutes: settings.durationMinutes,
      priceLabel: formatMoney(
        { amount: price.value, currencyCode: price.currency },
        { locale }
      ),
    };
  } catch (error) {
    console.error("[consultation] video offer failed", error);
    return HIDDEN;
  }
}
