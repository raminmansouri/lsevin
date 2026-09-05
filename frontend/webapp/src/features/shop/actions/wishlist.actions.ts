"use server";

import { revalidatePath } from "next/cache";

import { wishlistToggleSchema } from "../schemas/catalog";
import { toggleWishlist, getWishlistProductIds } from "../api/wishlist.repository";

export async function toggleWishlistAction(input: unknown) {
  const parsed = wishlistToggleSchema.parse(input);
  const res = await toggleWishlist(parsed);
  revalidatePath("/n/app/mobile/shop/wishlist");
  return { ok: true as const, active: res.active };
}

/** Read-only: is this product in the current visitor's wishlist? Used by a
 *  statically-rendered PDP to resolve the heart state client-side. */
export async function getWishlistStateAction(input: { productId: string }) {
  try {
    const ids = await getWishlistProductIds();
    return { active: ids.has(input.productId) };
  } catch {
    return { active: false };
  }
}
