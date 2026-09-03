import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getShopHome, type ShopHome } from "./home.repository";

/**
 * Cached, cookie-free Shop landing composition (sections + product rails),
 * rendered in the market-default currency. The per-visitor bits (cart badge,
 * recently viewed) are client islands on the page, so the shell can be ISR'd.
 *
 * Tag: `shop-home` — revalidate from the home-section / catalogue admin
 * mutations.
 */
export async function getShopHomeCached(locale: string): Promise<ShopHome> {
  "use cache";
  cacheTag("shop-home");
  cacheLife("default");

  return getShopHome({ locale, cookieFree: true });
}
