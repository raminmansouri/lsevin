"use server";

import { getCartView } from "../api/cart.repository";
import { getCompareState } from "../api/compare.repository";
import { getRecentlyViewed, recordRecentlyViewed } from "../api/recently-viewed.repository";
import { getReviewEligibility } from "../api/review.repository";
import { getWishlistProductIds } from "../api/wishlist.repository";
import { emitCommerceEvent } from "../lib/analytics";
import type { ProductCard } from "../types/domain";

export type ProductPersonalState = {
  wishlistActive: boolean;
  compare: { inList: boolean; count: number };
  eligibility: { canReview: boolean; canAsk: boolean; alreadyReviewed: boolean; orderItemId: string | null };
  recentlyViewed: ProductCard[];
  cartCount: number;
};

/**
 * Everything on the product page that depends on the visitor (cart, wishlist,
 * compare list, review eligibility, recently-viewed). Pulled once by the client
 * so the page shell itself stays cookie-free and statically renderable.
 */
export async function getProductPersonalStateAction(input: {
  productId: string;
  slug: string;
}): Promise<ProductPersonalState> {
  const [wishlistIds, compare, eligibility, recentlyViewed, cart] = await Promise.all([
    getWishlistProductIds().catch(() => new Set<string>()),
    getCompareState(input.productId).catch(() => ({ inList: false, count: 0 })),
    getReviewEligibility(input.productId).catch(() => ({
      canReview: false,
      canAsk: false,
      alreadyReviewed: false,
      orderItemId: null,
    })),
    getRecentlyViewed(input.slug, 10).catch(() => []),
    getCartView().catch(() => ({ itemCount: 0 }) as Awaited<ReturnType<typeof getCartView>>),
  ]);

  return {
    wishlistActive: wishlistIds.has(input.productId),
    compare,
    eligibility,
    recentlyViewed,
    cartCount: cart.itemCount,
  };
}

/** Recently-viewed rail for a statically-rendered surface (shop home). */
export async function getRecentlyViewedAction(input?: {
  excludeSlug?: string;
  limit?: number;
}): Promise<ProductCard[]> {
  return getRecentlyViewed(input?.excludeSlug, input?.limit ?? 10).catch(() => []);
}

/** Fire-and-forget view side effects, moved off the render path. */
export async function trackProductViewAction(input: {
  productId: string;
  currency: string;
  relatedServiceKey?: string | null;
  relatedServiceCount?: number;
}): Promise<void> {
  await recordRecentlyViewed(input.productId).catch(() => {});
  await emitCommerceEvent("shop_product_view", {
    productId: input.productId,
    currency: input.currency,
    surface: "product_detail",
  }).catch(() => {});
  if (input.relatedServiceKey && input.relatedServiceCount) {
    await emitCommerceEvent("shop_related_service_product_impression", {
      productId: input.productId,
      campaignKey: input.relatedServiceKey,
      quantity: input.relatedServiceCount,
      surface: "product_detail",
    }).catch(() => {});
  }
}
