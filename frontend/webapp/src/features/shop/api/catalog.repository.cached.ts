import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { ProductDetail, ShopCategory } from "../types/domain";
import { getProductBySlug, getShopBrands, getShopCategories } from "./catalog.repository";
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
 * Brand facet for a category / search filter bar. Cookie-free (pass `locale`);
 * changes only with the catalogue. Tag: `shop-categories` (brands move with
 * the same admin edits).
 */
export async function getShopBrandsCached(
  locale: string,
  categorySlug?: string,
): Promise<Array<{ slug: string; name: string; productCount: number }>> {
  "use cache";
  cacheTag("shop-categories");
  cacheLife("default");

  return getShopBrands(locale, categorySlug);
}

/**
 * Cached, currency-agnostic product detail for the storefront PDP. Prices come
 * back in each item's own stored currency (`noFx`), so the page is genuinely
 * static / prerenderable per (slug, locale); the visitor's display currency is
 * applied on the client by `<ShopPrice>`. Wishlist / cart / compare / review
 * eligibility hydrate as client islands.
 *
 * Tags: `shop-product` (all) + `shop-product:<slug>` — revalidate from the
 * product admin mutations.
 */
export async function getProductBySlugCached(
  slug: string,
  locale: string,
): Promise<ProductDetail | null> {
  "use cache";
  cacheTag("shop-product");
  cacheTag(`shop-product:${slug}`);
  cacheLife("default");

  return getProductBySlug(slug, locale, { noFx: true, skipWishlist: true });
}
