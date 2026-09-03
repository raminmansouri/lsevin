import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { ProductDetail, ShopCategory } from "../types/domain";
import { getProductBySlug, getShopCategories } from "./catalog.repository";
import { getShopDefaultCurrency } from "../lib/pricing";

/**
 * Cached view of {@link getShopCategories}. The category tree (with its
 * per-category active-product counts) is the same for every visitor of a
 * locale and changes only when an admin edits the catalogue, but it was being
 * recomputed — a grouped aggregate over `shop.product_categories` /
 * `shop.products` — on every shop-home and every category-page render.
 *
 * `locale` must be passed explicitly (never omitted) so this stays a pure
 * function of its argument and never reaches for request state.
 *
 * Tag: `shop-categories` — call `revalidateTag("shop-categories")` from the
 * category / product admin mutations.
 */
export async function getShopCategoriesCached(locale: string): Promise<ShopCategory[]> {
  "use cache";
  cacheTag("shop-categories");
  cacheLife("default");

  return getShopCategories(locale);
}

/**
 * Shop default display currency (a `finance.settings` row). Cheap, but it is on
 * the critical path of every cookie-free storefront render, so cache it.
 * Tag: `shop-settings`.
 */
export async function getShopDefaultCurrencyCached(): Promise<string> {
  "use cache";
  cacheTag("shop-settings");
  cacheLife("default");

  return getShopDefaultCurrency();
}

/**
 * Cached, cookie-free product detail for the storefront PDP. Rendered in the
 * shop default currency and with no wishlist state, so the page can be statically
 * generated / ISR'd; the per-visitor bits (wishlist heart, cart badge, recently
 * viewed, review eligibility) hydrate as client islands.
 *
 * Tags: `shop-product` (all) + `shop-product:<slug>` — revalidate from the
 * product admin mutations.
 */
export async function getProductBySlugCached(
  slug: string,
  locale: string,
  displayCurrency: string,
): Promise<ProductDetail | null> {
  "use cache";
  cacheTag("shop-product");
  cacheTag(`shop-product:${slug}`);
  cacheLife("default");

  return getProductBySlug(slug, locale, { displayCurrency, skipWishlist: true });
}
