import type { CartItem, CartView } from "../types/domain";
import { buildCartTotals, calculateShipping, calculateTax } from "../lib/calculations";
import { resolveCurrentCustomerId, sql } from "../lib/db";

async function resolveActiveCartId(): Promise<string | null> {
  const customerId = await resolveCurrentCustomerId();
  if (!customerId) return null;
  const rows = await sql<{ id: string }[]>`
    select id::text as id from shop.carts
    where customer_id = ${customerId}::uuid and status = 'active'
    order by create_date desc limit 1
  `;
  return rows[0]?.id ?? null;
}

export async function getOrCreateActiveCart(currency = "USD"): Promise<string> {
  const existing = await resolveActiveCartId();
  if (existing) return existing;
  const customerId = await resolveCurrentCustomerId();
  const rows = await sql<{ id: string }[]>`
    insert into shop.carts (customer_id, guest_token, currency, status, expires_at)
    values (${customerId}::uuid, ${customerId ? null : "guest-cart"}, ${currency}, 'active', now() + interval '14 days')
    returning id::text as id
  `;
  return rows[0].id;
}

export async function getCartView(): Promise<CartView> {
  const cartId = await getOrCreateActiveCart();
  const rows = await sql<any[]>`
    select
      ci.id::text as id, ci.product_id::text as "productId", ci.variant_id::text as "variantId",
      p.slug, common.get_translation_t(p.name_translations, 'en', 'en') as name,
      pm.url as "imageUrl", '{}'::jsonb as attributes, ci.quantity, ci.unit_price::float as "unitPrice",
      ci.compare_at_price::float as "compareAtPrice", ci.currency, ci.saved_for_later as "savedForLater",
      999::int as "inventoryAvailable", true as "hasStock"
    from shop.cart_items ci
    join shop.products p on p.id = ci.product_id
    left join lateral (select url from shop.product_media where product_id = p.id order by is_primary desc, display_order asc limit 1) pm on true
    where ci.cart_id = ${cartId}::uuid
    order by ci.saved_for_later asc, ci.create_date desc
  `;
  const items: CartItem[] = rows.map((row) => ({ ...row, quantity: +row.quantity, unitPrice: +row.unitPrice, compareAtPrice: row.compareAtPrice == null ? null : +row.compareAtPrice, inventoryAvailable: +row.inventoryAvailable }));
  const activeItems = items.filter(x => !x.savedForLater);
  const subtotal = activeItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const [cartRow] = await sql<any[]>`select coupon_code, currency from shop.carts where id = ${cartId}::uuid limit 1`;
  const discountTotal = 0;
  const shipping = calculateShipping(subtotal - discountTotal, 8.99);
  const tax = calculateTax(subtotal - discountTotal);
  return { id: cartId, items, itemCount: activeItems.reduce((sum, x) => sum + x.quantity, 0), totals: buildCartTotals({ subtotal, discountTotal, shippingTotal: shipping.amount, taxTotal: tax.amount, currency: cartRow?.currency ?? "USD", couponCode: cartRow?.coupon_code ?? null }) };
}

export async function addCartItem(input: { productId: string; variantId?: string | null; quantity: number }) {
  const cartId = await getOrCreateActiveCart();
  const [product] = await sql<any[]>`
    select p.id::text as id, p.base_price::float as price, p.compare_at_price::float as compare_price, p.base_currency as currency,
      common.get_translation_t(p.name_translations, 'en', 'en') as name,
      (select url from shop.product_media where product_id = p.id order by is_primary desc, display_order asc limit 1) as image_url
    from shop.products p where p.id = ${input.productId}::uuid and p.status = 'active' and p.deleted_at is null limit 1
  `;
  if (!product) throw new Error("Product not found");
  await sql`
    insert into shop.cart_items (cart_id, product_id, variant_id, quantity, unit_price, compare_at_price, currency, item_snapshot)
    values (${cartId}::uuid, ${input.productId}::uuid, ${input.variantId ?? null}::uuid, ${input.quantity}, ${product.price}, ${product.compare_price ?? null}, ${product.currency}, ${JSON.stringify({ name: product.name, imageUrl: product.image_url })})
  `;
  return getCartView();
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  await sql`update shop.cart_items set quantity = ${quantity}, last_modified_date = now() where id = ${cartItemId}::uuid`;
  return getCartView();
}
export async function toggleSavedForLater(cartItemId: string) { await sql`update shop.cart_items set saved_for_later = not saved_for_later, last_modified_date = now() where id = ${cartItemId}::uuid`; return getCartView(); }
export async function removeCartItem(cartItemId: string) { await sql`delete from shop.cart_items where id = ${cartItemId}::uuid`; return getCartView(); }
export async function applyCoupon(cartId: string, code: string) { await sql`update shop.carts set coupon_code = ${code}, last_modified_date = now() where id = ${cartId}::uuid`; return getCartView(); }
export async function clearCoupon(cartId: string) { await sql`update shop.carts set coupon_code = null, last_modified_date = now() where id = ${cartId}::uuid`; return getCartView(); }
