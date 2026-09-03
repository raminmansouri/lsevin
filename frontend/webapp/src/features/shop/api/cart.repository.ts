import "server-only";

import type { CartItem, CartView } from "../types/domain";
import { buildCartTotals } from "../lib/calculations";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency, resolvePrices } from "../lib/pricing";
import { sql } from "../lib/db";

/**
 * Cart read/write model.
 *
 * A cart row stores line quantities and a *source* unit price snapshot only.
 * Every amount the customer sees is (re)resolved into the request display
 * currency here (SHP-V01-012, SHP-CART-005) — a stale stored price is never
 * trusted, and changing display currency simply re-prices the same lines
 * (SHP-CHK-015).
 */

const MAX_LINE_QTY = 999;

type CartRow = { id: string; currency: string; couponCode: string | null };

async function findCartRow(kind: "customer" | "guest", id: string): Promise<CartRow | null> {
  const rows =
    kind === "customer"
      ? await sql<any[]>`
          select id::text as id, currency, coupon_code as "couponCode"
          from shop.carts where customer_id = ${id}::uuid and status = 'active'
          order by create_date desc limit 1`
      : await sql<any[]>`
          select id::text as id, currency, coupon_code as "couponCode"
          from shop.carts where guest_token = ${id} and status = 'active'
          order by create_date desc limit 1`;
  return rows[0] ?? null;
}

/**
 * Resolves (or creates) the caller's single active cart. Pass an explicit
 * `guestToken` from a Server Action / Route Handler where the cookie can be
 * minted; Server Components should rely on whatever token already exists.
 */
export async function getOrCreateActiveCart(opts?: { guestToken?: string }): Promise<string> {
  const ctx = await getShopContext();
  const guestToken = opts?.guestToken || ctx.guestToken || null;

  if (ctx.customerId) {
    const existing = await findCartRow("customer", ctx.customerId);
    if (existing) return existing.id;
    // adopt a guest cart on first authenticated access
    if (guestToken) {
      const adopted = await sql<{ id: string }[]>`
        update shop.carts set customer_id = ${ctx.customerId}::uuid, guest_token = null, last_modified_date = now()
        where guest_token = ${guestToken} and status = 'active' and customer_id is null
        returning id::text as id
      `;
      if (adopted[0]?.id) return adopted[0].id;
    }
    const created = await sql<{ id: string }[]>`
      insert into shop.carts (customer_id, currency, status, expires_at)
      values (${ctx.customerId}::uuid, 'USD', 'active', now() + interval '30 days')
      returning id::text as id
    `;
    return created[0].id;
  }

  if (!guestToken) {
    throw new Error("A guest cart token is required. Call ensureGuestToken() from the action first.");
  }
  const existing = await findCartRow("guest", guestToken);
  if (existing) return existing.id;
  const created = await sql<{ id: string }[]>`
    insert into shop.carts (guest_token, currency, status, expires_at)
    values (${guestToken}, 'USD', 'active', now() + interval '30 days')
    returning id::text as id
  `;
  return created[0].id;
}

type RawCartLine = {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantTitle: string | null;
  imageUrl: string | null;
  quantity: number;
  sourceUnitPrice: number;
  sourceCurrency: string;
  sourceCompareAt: number | null;
  savedForLater: boolean;
  available: number;
  allowBackorder: boolean;
  productActive: boolean;
};

async function loadCartLines(cartId: string, lang: string): Promise<RawCartLine[]> {
  return sql<RawCartLine[]>`
    select
      ci.id::text as id,
      ci.product_id::text as "productId",
      ci.variant_id::text as "variantId",
      p.slug,
      common.get_translation_t(p.name_translations, ${lang}, 'en') as name,
      common.get_translation_t(v.title_translations, ${lang}, 'en') as "variantTitle",
      coalesce(
        (select url from shop.product_media where variant_id = ci.variant_id order by is_primary desc, display_order asc limit 1),
        (select url from shop.product_media where product_id = ci.product_id order by is_primary desc, display_order asc limit 1)
      ) as "imageUrl",
      ci.quantity,
      coalesce(v.price, p.base_price)::float as "sourceUnitPrice",
      coalesce(v.currency, p.base_currency) as "sourceCurrency",
      coalesce(v.compare_at_price, p.compare_at_price)::float as "sourceCompareAt",
      ci.saved_for_later as "savedForLater",
      coalesce((
        select sum(greatest(i.on_hand - i.reserved, 0))::int from shop.inventory i
        where (ci.variant_id is not null and i.variant_id = ci.variant_id)
           or (ci.variant_id is null and i.product_id = ci.product_id and i.variant_id is null)
      ), 0) as available,
      coalesce(v.allow_backorder, p.allow_backorder) as "allowBackorder",
      (p.status = 'active' and p.deleted_at is null and (v.id is null or (v.is_active and v.deleted_at is null))) as "productActive"
    from shop.cart_items ci
    join shop.products p on p.id = ci.product_id
    left join shop.product_variants v on v.id = ci.variant_id
    where ci.cart_id = ${cartId}::uuid
    order by ci.saved_for_later asc, ci.create_date desc
  `;
}

export async function getCartView(opts?: { guestToken?: string }): Promise<CartView> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(ctx.locale);
  const { currency, mode, selectable } = await resolveDisplayCurrency(ctx);

  let cartId: string;
  try {
    cartId = await getOrCreateActiveCart(opts);
  } catch {
    // no guest token yet (pure Server Component render before any add) -> empty view
    return {
      id: "",
      items: [],
      itemCount: 0,
      currency,
      pricingMode: mode,
      selectableCurrencies: selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name })),
      couponMessage: null,
      totals: buildCartTotals({ subtotal: 0, discountTotal: 0, shippingTotal: 0, taxTotal: 0, currency }),
    };
  }

  const [rawLines, cartRow] = await Promise.all([
    loadCartLines(cartId, lang),
    sql<any[]>`select coupon_code as "couponCode" from shop.carts where id = ${cartId}::uuid limit 1`,
  ]);

  const priced = await resolvePrices(
    rawLines.map((l) => ({
      ref: l,
      amount: Number(l.sourceUnitPrice),
      sourceCurrency: l.sourceCurrency,
      compareAtAmount: l.sourceCompareAt != null ? Number(l.sourceCompareAt) : null,
    })),
    currency
  );

  const items: CartItem[] = priced.map((p) => {
    const l = p.ref;
    const unit = p.price.amount;
    const maxPurchasable = l.allowBackorder ? MAX_LINE_QTY : Math.max(0, Number(l.available));
    const effectiveQty = Math.min(l.quantity, l.allowBackorder ? MAX_LINE_QTY : Math.max(maxPurchasable, 0));
    const hasStock = l.allowBackorder || Number(l.available) >= l.quantity;
    return {
      id: l.id,
      productId: l.productId,
      variantId: l.variantId,
      slug: l.slug,
      name: l.name,
      variantTitle: l.variantTitle || null,
      imageUrl: l.imageUrl,
      attributes: {},
      quantity: l.quantity,
      unitPrice: unit,
      lineTotal: Math.round((unit * effectiveQty + Number.EPSILON) * 100) / 100,
      compareAtPrice: p.compareAtPrice && !p.compareAtPrice.unavailable ? p.compareAtPrice.amount : null,
      currency: p.price.currency,
      priceUnavailable: p.price.unavailable,
      sourceCurrency: l.sourceCurrency,
      sourceUnitPrice: Number(l.sourceUnitPrice),
      hasStock: hasStock && l.productActive,
      inventoryAvailable: Number(l.available),
      maxPurchasable,
      savedForLater: l.savedForLater,
    };
  });

  const active = items.filter((x) => !x.savedForLater);
  const subtotal = active.reduce((s, x) => s + x.lineTotal, 0);
  const hasUnavailablePrice = active.some((x) => x.priceUnavailable);

  // coupon (server-evaluated, display currency) — SHP-CHK-002
  let discountTotal = 0;
  let couponMessage: string | null = null;
  const couponCode: string | null = cartRow[0]?.couponCode ?? null;
  if (couponCode && active.length) {
    const { evaluateCoupon } = await import("../server/coupon.service");
    const ev = await evaluateCoupon({ code: couponCode, subtotal, displayCurrency: currency, customerId: ctx.customerId, locale: lang });
    if (ev.valid) {
      discountTotal = ev.discountAmount;
      couponMessage = ev.freeShipping ? "free_shipping" : "applied";
    } else {
      couponMessage = ev.reason;
    }
  }

  return {
    id: cartId,
    items,
    itemCount: active.reduce((s, x) => s + x.quantity, 0),
    currency,
    pricingMode: mode,
    selectableCurrencies: selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name })),
    couponMessage,
    totals: buildCartTotals({
      subtotal,
      discountTotal,
      shippingTotal: 0,
      taxTotal: 0,
      currency,
      couponCode,
      hasUnavailablePrice,
    }),
  };
}

export async function addCartItem(input: { productId: string; variantId?: string | null; quantity: number; guestToken?: string }): Promise<CartView> {
  const cartId = await getOrCreateActiveCart({ guestToken: input.guestToken });
  const qty = Math.max(1, Math.min(MAX_LINE_QTY, Math.trunc(input.quantity)));

  const [product] = await sql<any[]>`
    select p.id::text as id, p.product_type as "productType",
      coalesce(v.price, p.base_price)::float as price,
      coalesce(v.compare_at_price, p.compare_at_price)::float as compare_price,
      coalesce(v.currency, p.base_currency) as currency,
      (v.id is not null) as "hasVariantRow"
    from shop.products p
    left join shop.product_variants v on v.id = ${input.variantId ?? null}::uuid and v.product_id = p.id and v.is_active and v.deleted_at is null
    where p.id = ${input.productId}::uuid and p.status = 'active' and p.deleted_at is null
    limit 1
  `;
  if (!product) throw new Error("Product is not available.");
  if (product.productType === "variant" && !input.variantId) {
    throw new Error("Select an option before adding this product to the cart.");
  }
  if (input.variantId && !product.hasVariantRow) {
    throw new Error("The selected option is no longer available.");
  }

  // duplicate add merges into the existing line (SHP-CART-003)
  const existing = await sql<{ id: string; quantity: number }[]>`
    select id::text as id, quantity from shop.cart_items
    where cart_id = ${cartId}::uuid and product_id = ${input.productId}::uuid
      and variant_id is not distinct from ${input.variantId ?? null}::uuid and saved_for_later = false
    limit 1
  `;
  if (existing[0]) {
    const next = Math.min(MAX_LINE_QTY, existing[0].quantity + qty);
    await sql`update shop.cart_items set quantity = ${next}, last_modified_date = now() where id = ${existing[0].id}::uuid`;
  } else {
    await sql`
      insert into shop.cart_items
        (cart_id, product_id, variant_id, quantity, unit_price, compare_at_price, currency,
         source_currency, source_unit_price, item_snapshot)
      values
        (${cartId}::uuid, ${input.productId}::uuid, ${input.variantId ?? null}::uuid, ${qty},
         ${product.price}, ${product.compare_price ?? null}, ${product.currency},
         ${product.currency}, ${product.price}, ${sql.json({ addedAt: new Date().toISOString() })})
    `;
  }
  await touchCart(cartId);
  return getCartView({ guestToken: input.guestToken });
}

async function assertLineInCart(cartItemId: string): Promise<string> {
  const ctx = await getShopContext();
  const rows = await sql<{ cart_id: string }[]>`
    select ci.cart_id::text as cart_id
    from shop.cart_items ci join shop.carts c on c.id = ci.cart_id
    where ci.id = ${cartItemId}::uuid
      and c.status = 'active'
      and (
        (${ctx.customerId}::uuid is not null and c.customer_id = ${ctx.customerId}::uuid)
        or (${ctx.guestToken} <> '' and c.guest_token = ${ctx.guestToken})
        -- Signed-in visitor whose cart was adopted (guest_token nulled) under a
        -- customer row that this request resolved differently or not at all:
        -- accept it if the cart's customer row is this identity's, by id or email.
        or (
          c.customer_id is not null
          and (
            (${ctx.userId}::uuid is not null and c.customer_id = ${ctx.userId}::uuid)
            or (
              ${ctx.email ?? ""} <> ''
              and exists (
                select 1 from customer.customers cust
                where cust.id = c.customer_id and lower(cust.email) = ${ctx.email ?? ""}
              )
            )
          )
        )
      )
    limit 1
  `;
  if (!rows[0]) throw new Error("Cart line not found.");
  return rows[0].cart_id;
}

async function touchCart(cartId: string) {
  await sql`update shop.carts set last_modified_date = now() where id = ${cartId}::uuid`;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartView> {
  const cartId = await assertLineInCart(cartItemId);
  const qty = Math.max(1, Math.min(MAX_LINE_QTY, Math.trunc(quantity)));
  await sql`update shop.cart_items set quantity = ${qty}, last_modified_date = now() where id = ${cartItemId}::uuid`;
  await touchCart(cartId);
  return getCartView();
}

export async function removeCartItem(cartItemId: string): Promise<CartView> {
  const cartId = await assertLineInCart(cartItemId);
  await sql`delete from shop.cart_items where id = ${cartItemId}::uuid`;
  await touchCart(cartId);
  return getCartView();
}

export async function toggleSavedForLater(cartItemId: string): Promise<CartView> {
  const cartId = await assertLineInCart(cartItemId);
  await sql`update shop.cart_items set saved_for_later = not saved_for_later, last_modified_date = now() where id = ${cartItemId}::uuid`;
  await touchCart(cartId);
  return getCartView();
}

export async function applyCoupon(cartId: string, code: string): Promise<CartView> {
  await assertCartOwnership(cartId);
  await sql`update shop.carts set coupon_code = ${code.trim()}, last_modified_date = now() where id = ${cartId}::uuid`;
  return getCartView();
}

export async function clearCoupon(cartId: string): Promise<CartView> {
  await assertCartOwnership(cartId);
  await sql`update shop.carts set coupon_code = null, last_modified_date = now() where id = ${cartId}::uuid`;
  return getCartView();
}

async function assertCartOwnership(cartId: string): Promise<void> {
  const ctx = await getShopContext();
  const rows = await sql<{ id: string }[]>`
    select id::text as id from shop.carts
    where id = ${cartId}::uuid and status = 'active'
      and (
        (${ctx.customerId}::uuid is not null and customer_id = ${ctx.customerId}::uuid)
        or (${ctx.guestToken} <> '' and guest_token = ${ctx.guestToken})
      )
    limit 1
  `;
  if (!rows[0]) throw new Error("Cart not found.");
}

/**
 * Merges the guest cart into the authenticated customer's cart after sign-in
 * (SHP-V01-011). Quantities are summed per (product, variant); the guest cart is
 * marked converted. Safe to call repeatedly.
 */
export async function mergeGuestCartIntoCustomer(guestToken: string, customerId: string): Promise<void> {
  if (!guestToken || !customerId) return;
  await sql.begin(async (tx) => {
    const guestCart = await tx<{ id: string }[]>`
      select id::text as id from shop.carts
      where guest_token = ${guestToken} and status = 'active' limit 1
    `;
    if (!guestCart[0]) return;
    const guestCartId = guestCart[0].id;

    const customerCart = await tx<{ id: string }[]>`
      select id::text as id from shop.carts
      where customer_id = ${customerId}::uuid and status = 'active'
      order by create_date desc limit 1
    `;

    if (!customerCart[0]) {
      // no customer cart yet: just claim the guest cart
      await tx`
        update shop.carts set customer_id = ${customerId}::uuid, guest_token = null, last_modified_date = now()
        where id = ${guestCartId}::uuid
      `;
      return;
    }

    const targetId = customerCart[0].id;
    const guestItems = await tx<any[]>`
      select product_id, variant_id, quantity, unit_price, compare_at_price, currency,
             source_currency, source_unit_price, saved_for_later, item_snapshot
      from shop.cart_items where cart_id = ${guestCartId}::uuid
    `;
    for (const gi of guestItems) {
      const dup = await tx<{ id: string; quantity: number }[]>`
        select id::text as id, quantity from shop.cart_items
        where cart_id = ${targetId}::uuid and product_id = ${gi.product_id}
          and variant_id is not distinct from ${gi.variant_id} and saved_for_later = ${gi.saved_for_later}
        limit 1
      `;
      if (dup[0]) {
        await tx`update shop.cart_items set quantity = least(999, ${dup[0].quantity + gi.quantity}), last_modified_date = now() where id = ${dup[0].id}::uuid`;
      } else {
        await tx`
          insert into shop.cart_items
            (cart_id, product_id, variant_id, quantity, unit_price, compare_at_price, currency, source_currency, source_unit_price, saved_for_later, item_snapshot)
          values
            (${targetId}::uuid, ${gi.product_id}, ${gi.variant_id}, ${gi.quantity}, ${gi.unit_price}, ${gi.compare_at_price},
             ${gi.currency}, ${gi.source_currency}, ${gi.source_unit_price}, ${gi.saved_for_later}, ${gi.item_snapshot})
        `;
      }
    }
    await tx`update shop.carts set status = 'abandoned', last_modified_date = now() where id = ${guestCartId}::uuid`;
    await tx`update shop.carts set last_modified_date = now() where id = ${targetId}::uuid`;
  });
}
