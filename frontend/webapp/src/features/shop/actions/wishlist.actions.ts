"use server";

import { revalidatePath } from "next/cache";

import { wishlistToggleSchema } from "../schemas/catalog";
import { toggleWishlist } from "../api/wishlist.repository";

export async function toggleWishlistAction(input: unknown) {
  const parsed = wishlistToggleSchema.parse(input);
  const res = await toggleWishlist(parsed);
  revalidatePath("/n/app/mobile/shop/wishlist");
  return { ok: true as const, active: res.active };
}
