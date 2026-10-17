"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import {
  deleteCustomerAddress,
  listCustomerAddresses,
  saveCustomerAddress,
} from "../api/address.repository";
import { getCartView } from "../api/cart.repository";
import {
  getPaymentMethods,
  placeOrder,
  quoteCheckout,
} from "../api/checkout.repository";
import { emitCommerceEvent } from "../lib/analytics";
import { getShopContext } from "../lib/context";
import {
  checkoutQuoteSchema,
  placeOrderSchema,
  saveAddressSchema,
  startPaymentSchema,
} from "../schemas/checkout";
import { startOrderPayment } from "../server/shop-payment.service";

export async function quoteCheckoutAction(input: unknown) {
  const t = await getTranslations("Shop");
  const parsed = checkoutQuoteSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      category: "ValidationError" as const,
      message: t("somethingWrong"),
    };
  try {
    const quote = await quoteCheckout(parsed.data);
    return { ok: true as const, quote };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const category =
      error instanceof Error && error.message === "Cart mismatch."
        ? "ConflictError"
        : code
          ? "InfrastructureError"
          : "UnexpectedError";
    if (category !== "ConflictError")
      console.error("shop.checkout.quote failed", {
        errorType: error instanceof Error ? error.name : typeof error,
        code,
      });
    return {
      ok: false as const,
      category,
      message: t("somethingWrong"),
    };
  }
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

  const cart = await getCartView();
  const methods = await getPaymentMethods(
    ctx.locale,
    parsed.paymentCurrency || cart.currency
  );
  const method = methods.find((item) => item.code === parsed.paymentMethodCode);
  if (!method) throw new Error("The selected payment method is not available.");

  const order = await placeOrder({
    cartId: parsed.cartId,
    idempotencyKey: parsed.idempotencyKey,
    email: parsed.email,
    shippingAddress: parsed.shippingAddress,
    billingAddress:
      parsed.sameBilling || !parsed.billingAddress
        ? parsed.shippingAddress
        : parsed.billingAddress,
    deliveryMethodId: parsed.deliveryMethodId,
    paymentMethodId: method.id,
    paymentCurrency: method.currency,
    note: parsed.note,
    sourceSurface: parsed.sourceSurface ?? "shop_checkout",
  });

  await emitCommerceEvent("shop_checkout_started", {
    orderId: order.orderId,
    value: order.grandTotal,
    currency: order.currency,
    idempotencyKey: parsed.idempotencyKey,
  });

  let payment:
    | Awaited<ReturnType<typeof startOrderPayment>>
    | { mode: "error"; message: string };
  try {
    payment = await startOrderPayment({
      orderId: order.orderId,
      methodCode: parsed.paymentMethodCode,
      locale: ctx.locale,
    });
  } catch (e) {
    console.error("shop.payment.start failed", {
      orderId: order.orderId,
      errorType: e instanceof Error ? e.name : typeof e,
      code: (e as { code?: string })?.code,
    });
    const t = await getTranslations("Shop");
    payment = {
      mode: "error",
      message: t("somethingWrong"),
    };
  }

  revalidatePath("/n/app/mobile/shop/orders");
  return { ok: true as const, order, payment };
}

export async function startPaymentAction(input: unknown) {
  const parsed = startPaymentSchema.parse(input);
  const ctx = await getShopContext();
  const payment = await startOrderPayment({
    orderId: parsed.orderId,
    methodCode: parsed.methodCode,
    locale: ctx.locale,
  });
  return { ok: true as const, payment };
}
