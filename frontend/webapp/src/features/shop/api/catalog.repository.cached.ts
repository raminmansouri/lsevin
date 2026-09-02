import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { ShopCategory } from "../types/domain";
import { getShopCategories } from "./catalog.repository";

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
