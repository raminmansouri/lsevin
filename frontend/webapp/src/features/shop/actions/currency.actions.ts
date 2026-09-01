"use server";

import { revalidatePath } from "next/cache";

import { setSelectedCurrencyCookie } from "../lib/context";
import { getDisplayCurrencyOptions, getShopPricingMode } from "../lib/pricing";
import { currencySelectSchema } from "../schemas/checkout";
import { emitCommerceEvent } from "../lib/analytics";

/**
 * Customer display-currency switch (SHP-V01-027, SHP-API-018). Only valid in
 * `market_default_with_selector` mode and only for a Finance display-enabled
 * currency; the selection is persisted via cookie and every Shop surface
 * re-prices server-side on the next render (SHP-CHK-012/015).
 */
export async function setDisplayCurrencyAction(input: unknown) {
  const { currency } = currencySelectSchema.parse(input);
  const code = currency.trim().toUpperCase();

  const mode = await getShopPricingMode();
  if (mode !== "market_default_with_selector") {
    return { ok: false as const, error: "Currency selection is disabled by the platform pricing mode." };
  }
  const allowed = new Set((await getDisplayCurrencyOptions()).map((o) => o.code));
  if (!allowed.has(code)) {
    return { ok: false as const, error: "That currency is not enabled for display." };
  }

  await setSelectedCurrencyCookie(code);
  await emitCommerceEvent("shop_currency_changed", { currency: code, surface: "currency_switcher" });

  for (const p of [
    "/n/app/mobile/shop",
    "/n/app/mobile/shop/cart",
    "/n/app/mobile/shop/checkout",
    "/n/app/mobile/shop/search",
  ]) {
    revalidatePath(p);
  }
  return { ok: true as const, currency: code };
}
