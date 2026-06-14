"use server";
import { revalidatePath } from "next/cache";
import { sql, resolveCurrentCustomerId } from "../lib/db";
import { getCartView } from "../api/cart.repository";
import { checkoutSubmitSchema } from "../schemas/checkout";

function generateOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `SO-${stamp}`;
}

export async function submitCheckoutAction(input: unknown) {
  const parsed = checkoutSubmitSchema.parse(input);
  const cart = await getCartView();
  if (!cart.items.filter(x => !x.savedForLater).length) throw new Error("Cart is empty");
  const insufficient = cart.items.find(x => !x.savedForLater && !x.hasStock);
  if (insufficient) throw new Error(`Insufficient stock for ${insufficient.name}`);
  const customerId = await resolveCurrentCustomerId();
  const orderNumber = generateOrderNumber();

  const [order] = await sql<{ id: string }[]>`
    insert into shop.orders (order_number, customer_id, cart_id, email, currency, status, payment_status, fulfillment_status, subtotal, discount_total, shipping_total, tax_total, grand_total, coupon_code, note)
    values (${orderNumber}, ${customerId}::uuid, ${parsed.cartId}::uuid, ${parsed.email}, ${cart.totals.currency}, 'pending', 'pending', 'pending', ${cart.totals.subtotal}, ${cart.totals.discountTotal}, ${cart.totals.shippingTotal}, ${cart.totals.taxTotal}, ${cart.totals.grandTotal}, ${cart.totals.couponCode}, ${parsed.note ?? null})
    returning id::text as id
  `;

  for (const addressType of ["shipping", "billing"] as const) {
    const source = parsed[`${addressType}Address`];
    await sql`
      insert into shop.order_addresses (order_id, address_type, full_name, phone_number_country_code, phone_number, country, city, state_region, address_line_1, address_line_2, postal_code, company)
      values (${order.id}::uuid, ${addressType}, ${source.fullName}, ${source.phoneNumberCountryCode ?? null}, ${source.phoneNumber ?? null}, ${source.country}, ${source.city}, ${source.stateRegion ?? null}, ${source.addressLine1}, ${source.addressLine2 ?? null}, ${source.postalCode ?? null}, ${source.company ?? null})
    `;
  }

  for (const item of cart.items.filter(x => !x.savedForLater)) {
    await sql`
      insert into shop.order_items (order_id, product_id, variant_id, quantity, currency, unit_price_snapshot, compare_at_price_snapshot, discount_total_snapshot, tax_total_snapshot, line_total_snapshot, product_name_snapshot, variant_name_snapshot, attributes_snapshot, image_url_snapshot)
      values (${order.id}::uuid, ${item.productId}::uuid, ${item.variantId ?? null}::uuid, ${item.quantity}, ${item.currency}, ${item.unitPrice}, ${item.compareAtPrice ?? null}, 0, 0, ${item.unitPrice * item.quantity}, ${JSON.stringify({ en: item.name })}, ${JSON.stringify(item.variantId ? { en: "Selected variant" } : {})}, ${JSON.stringify(item.attributes)}, ${item.imageUrl})
    `;
  }

  await sql`insert into shop.order_status_history (order_id, from_status, to_status, note) values (${order.id}::uuid, null, 'pending', 'Order created via checkout')`;
  await sql`update shop.carts set status = 'converted', converted_order_id = ${order.id}::uuid, last_modified_date = now() where id = ${parsed.cartId}::uuid`;
  revalidatePath("/n/app/mobile/shop/cart");
  revalidatePath("/n/app/mobile/shop/orders");
  return { ok: true, orderId: order.id, orderNumber };
}
