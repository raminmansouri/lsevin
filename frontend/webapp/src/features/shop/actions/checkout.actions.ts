"use server";

import { revalidatePath } from "next/cache";

import { getShopContext } from "../lib/context";
import {
  checkoutQuoteSchema,
  placeOrderSchema,
  saveAddressSchema,
} from "../schemas/checkout";
import { quoteCheckout, placeOrder } from "../api/checkout.repository";
import {
  deleteCustomerAddress,
  listCustomerAddresses,
  saveCustomerAddress,
} from "../api/address.repository";
import { startOrderPayment } from "../server/shop-payment.service";
import { startPaymentSchema } from "../schemas/checkout";
import { emitCommerceEvent } from "../lib/analytics";

export async function quoteCheckoutAction(input: unknown) {
  const parsed = checkoutQuoteSchema.parse(input);
  const quote = await quoteCheckout(parsed);
  return { ok: true as const, quote };
}

export async function listAddressesAction() {
  return listCustomerAddresses();
}

export async function saveAddressAction(input: unknown) {
  const parsed = saveAddressSchema.parse(input);
  const id = await saveCustomerAddress(parsed);
  revalidatePath("/n/app/mobile/shop/checkout");
  return { ok: true as const, id, addresses: await listCustomerAddresses() };
}

export async function deleteAddressAction(id: string) {
  await deleteCustomerAddress(String(id));
  revalidatePath("/n/app/mobile/shop/checkout");
  return { ok: true as const, addresses: await listCustomerAddresses() };
}

/**
 * Places the order then immediately begins payment. Returns either a redirect
 * URL (online gateway) or manual bank-transfer instructions. Idempotent: a retry
 * with the same idempotencyKey returns the same order (SHP-V01-017).
 */
export async function placeOrderAction(input: unknown) {
  const parsed = placeOrderSchema.parse(input);
  const ctx = await getShopContext();

  const order = await placeOrder({
    cartId: parsed.cartId,
    idempotencyKey: parsed.idempotencyKey,
    email: parsed.email,
    shippingAddress: parsed.shippingAddress,
    billingAddress: parsed.sameBilling || !parsed.billingAddress ? parsed.shippingAddress : parsed.billingAddress,
    deliveryMethodId: parsed.deliveryMethodId,
    paymentMethodId: parsed.paymentMethodId ?? "",
    paymentCurrency: parsed.paymentCurrency,
    note: parsed.note,
    sourceSurface: parsed.sourceSurface ?? "shop_checkout",
  });

  await emitCommerceEvent("shop_checkout_started", {
    orderId: order.orderId,
    value: order.grandTotal,
    currency: order.currency,
    idempotencyKey: parsed.idempotencyKey,
  });

  let payment: Awaited<ReturnType<typeof startOrderPayment>> | { mode: "error"; message: string };
  try {
    payment = await startOrderPayment({
      orderId: order.orderId,
      methodCode: parsed.paymentMethodCode,
      locale: ctx.locale,
    });
  } catch (e) {
    payment = { mode: "error", message: e instanceof Error ? e.message : "Payment could not be started." };
  }

  revalidatePath("/n/app/mobile/shop/orders");
  return { ok: true as const, order, payment };
}

export async function startPaymentAction(input: unknown) {
  const parsed = startPaymentSchema.parse(input);
  const ctx = await getShopContext();
  const payment = await startOrderPayment({ orderId: parsed.orderId, methodCode: parsed.methodCode, locale: ctx.locale });
  return { ok: true as const, payment };
}
