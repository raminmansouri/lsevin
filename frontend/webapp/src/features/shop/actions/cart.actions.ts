"use server";
import { revalidatePath } from "next/cache";
import { addToCartSchema, wishlistToggleSchema } from "../schemas/catalog";
import { applyCoupon as applyCouponRepo, clearCoupon as clearCouponRepo, addCartItem, getCartView, removeCartItem, toggleSavedForLater, updateCartItemQuantity } from "../api/cart.repository";
import { cartLineQuantitySchema, couponCodeSchema } from "../schemas/checkout";

export async function addToCartAction(input: unknown) {
  const parsed = addToCartSchema.parse(input);
  const cart = await addCartItem(parsed);
  revalidatePath("/n/app/mobile/shop");
  revalidatePath("/n/app/mobile/shop/cart");
  return cart;
}
export async function updateCartLineQuantityAction(input: unknown) {
  const parsed = cartLineQuantitySchema.parse(input);
  const cart = await updateCartItemQuantity(parsed.cartItemId, parsed.quantity);
  revalidatePath("/n/app/mobile/shop/cart");
  return cart;
}
export async function removeCartLineAction(cartItemId: string) { const cart = await removeCartItem(cartItemId); revalidatePath("/n/app/mobile/shop/cart"); return cart; }
export async function toggleSavedForLaterAction(cartItemId: string) { const cart = await toggleSavedForLater(cartItemId); revalidatePath("/n/app/mobile/shop/cart"); return cart; }
export async function applyCouponAction(input: unknown) { const parsed = couponCodeSchema.parse(input); const cart = await applyCouponRepo(parsed.cartId, parsed.code); revalidatePath("/n/app/mobile/shop/cart"); revalidatePath("/n/app/mobile/shop/checkout"); return cart; }
export async function clearCouponAction(cartId: string) { const cart = await clearCouponRepo(cartId); revalidatePath("/n/app/mobile/shop/cart"); revalidatePath("/n/app/mobile/shop/checkout"); return cart; }
export async function getCartAction() { return getCartView(); }
export async function toggleWishlistAction(input: unknown) { wishlistToggleSchema.parse(input); revalidatePath("/n/app/mobile/shop"); return { ok: true }; }
