import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getShopHome, type ShopHome } from "./home.repository";

/**
 * Cached, cookie-free Shop landing composition (sections + product rails).
 * Keyed on (locale, currency) — the page resolves the visitor's display
 * currency once and passes it in, so a currency switch is still honoured while
 * the heavy composition work is shared across everyone on that currency. The
 * per-visitor bits (cart badge, recently viewed) are client islands.
 *
 * Tag: `shop-home` — revalidate from the home-section / catalogue admin
 * mutations.
 */
export async function getShopHomeCached(locale: string, displayCurrency: string): Promise<ShopHome> {
  "use cache";
  cacheTag("shop-home");
  cacheLife("default");

  return getShopHome({ locale, displayCurrency, cookieFree: true });
}
