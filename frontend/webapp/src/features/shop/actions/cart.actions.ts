"use server";

import { revalidatePath } from "next/cache";

import { addToCartSchema } from "../schemas/catalog";
import { cartLineQuantitySchema } from "../schemas/checkout";
import { ensureGuestToken } from "../lib/context";
import { emitCommerceEvent } from "../lib/analytics";
import {
  addCartItem,
  clearCoupon as clearCouponRepo,
  applyCoupon as applyCouponRepo,
  getCartView,
  removeCartItem,
  toggleSavedForLater,
  updateCartItemQuantity,
} from "../api/cart.repository";

const SHOP_PATHS = [
  "/n/app/mobile/shop",
  "/n/app/mobile/shop/cart",
  "/n/app/mobile/shop/checkout",
];
function revalidateShop() {
  for (const p of SHOP_PATHS) revalidatePath(p);
}

export async function addToCartAction(input: unknown) {
  const parsed = addToCartSchema.parse(input);
  const guestToken = await ensureGuestToken();
  const cart = await addCartItem({ ...parsed, guestToken });
  await emitCommerceEvent("shop_add_to_cart", {
    productId: parsed.productId,
    cartId: cart.id,
    quantity: parsed.quantity,
    currency: cart.currency,
    surface: "product_detail",
  });
  revalidateShop();
  return { ok: true as const, cart };
}

export async function getCartAction() {
  const guestToken = await ensureGuestToken();
  return getCartView({ guestToken });
}

export async function updateCartLineQuantityAction(input: unknown) {
  const parsed = cartLineQuantitySchema.parse(input);
  const cart = await updateCartItemQuantity(parsed.cartItemId, parsed.quantity);
  revalidateShop();
  return { ok: true as const, cart };
}

export async function removeCartLineAction(cartItemId: string) {
  const cart = await removeCartItem(String(cartItemId));
  revalidateShop();
  return { ok: true as const, cart };
}

export async function toggleSavedForLaterAction(cartItemId: string) {
  const cart = await toggleSavedForLater(String(cartItemId));
  revalidateShop();
  return { ok: true as const, cart };
}

export async function applyCouponAction(input: unknown) {
  const { cartId, code } = input as { cartId: string; code: string };
  const cart = await applyCouponRepo(cartId, code);
  revalidateShop();
  return { ok: true as const, cart };
}

export async function clearCouponAction(cartId: string) {
  const cart = await clearCouponRepo(String(cartId));
  revalidateShop();
  return { ok: true as const, cart };
}
