import "server-only";

import { createHash } from "node:crypto";

import sql from "@/config/database/db";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency, lockPayableQuote } from "../lib/pricing";
import { calculateShipping, calculateTax, buildCartTotals } from "../lib/calculations";
import { getCartView } from "./cart.repository";
import { emitCommerceEvent } from "../lib/analytics";
import { notifyShopOrderEvent } from "../server/shop-notifications";
import { applyGeoRules } from "../lib/delivery-geo";
import type { CartTotals } from "../types/domain";

/**
 * Checkout = quote (server-computed totals + locked FX) then place-order
 * (idempotent, stock-reserving). Client-sent prices are never used
 * (SHP-V01-012, SHP-NFR-001).
 */

export type DeliveryOption = {
  id: string;
  code: string;
  name: string;
  description: string;
  fee: number;
  currency: string;
  etaMinDays: number | null;
  etaMaxDays: number | null;
};

export type CheckoutQuote = {
  cartId: string;
  currency: string;
  totals: CartTotals;
  deliveryOptions: DeliveryOption[];
  selectedDeliveryMethodId: string | null;
  paymentCurrency: string;
  paymentTotal: number;
  fxQuoteId: string | null;
  fxAppliedRate: number;
  quoteExpiresAt: string | null;
  blockingIssues: string[];
  couponEvidence: Record<string, unknown> | null;
};

export async function getDeliveryOptions(
  displayCurrency: string,
  lang: string,
  subtotal: number,
  destination?: { country?: string | null; region?: string | null }
): Promise<DeliveryOption[]> {
  const rows = await sql<any[]>`
    select id::text as id, code,
      common.get_translation_t(name_translations, ${lang}, 'en') as name,
      common.get_translation_t(description_translations, ${lang}, 'en') as description,
      base_fee::float as "baseFee", estimated_days_min as "etaMin", estimated_days_max as "etaMax",
      rules
    from shop.delivery_methods where is_active = true order by base_fee asc
  `;
  const out: DeliveryOption[] = [];
  for (const r of rows) {
    const geo = applyGeoRules(
      { baseFee: Number(r.baseFee), etaMin: r.etaMin ?? null, etaMax: r.etaMax ?? null, rules: r.rules },
      destination ?? {}
    );
    if (!geo) continue; // not served at this destination
    const shipping = calculateShipping(subtotal, geo.baseFee);
    out.push({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description ?? "",
      fee: shipping.amount,
      currency: displayCurrency,
      etaMinDays: geo.etaMin,
      etaMaxDays: geo.etaMax,
    });
  }
  return out;
}

/** Whether a specific delivery method serves a destination (SHP-V03-012). */
export async function isDeliveryMethodEligible(
  deliveryMethodId: string,
  destination: { country?: string | null; region?: string | null }
): Promise<boolean> {
  const [row] = await sql<any[]>`
    select base_fee::float as "baseFee", estimated_days_min as "etaMin", estimated_days_max as "etaMax", rules
    from shop.delivery_methods where id = ${deliveryMethodId}::uuid and is_active = true limit 1
  `;
  if (!row) return false;
  return (
    applyGeoRules(
      { baseFee: Number(row.baseFee), etaMin: row.etaMin ?? null, etaMax: row.etaMax ?? null, rules: row.rules },
      destination
    ) !== null
  );
}

export async function getPaymentMethods(lang: string) {
  return sql<any[]>`
    select id::text as id, code, provider,
      common.get_translation_t(name_translations, ${lang}, 'en') as name,
      common.get_translation_t(description_translations, ${lang}, 'en') as description,
      supports_refund as "supportsRefund"
    from shop.payment_methods where is_active = true order by sort_order asc
  `;
}

/**
 * Server-authoritative checkout quote. Recomputes the cart in the resolved
 * display currency, adds shipping/tax, and — when the payment currency differs —
 * locks a finance.fx_quote for the payable amount (SHP-CHK-014/015/019).
 */
export async function quoteCheckout(input: {
  cartId: string;
  deliveryMethodId?: string | null;
  paymentCurrency?: string | null;
  destinationCountry?: string | null;
  destinationRegion?: string | null;
}): Promise<CheckoutQuote> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(ctx.locale);
  const { currency } = await resolveDisplayCurrency(ctx);

  const cart = await getCartView();
  if (cart.id !== input.cartId) throw new Error("Cart mismatch.");
  const active = cart.items.filter((x) => !x.savedForLater);

  const blockingIssues: string[] = [];
  if (!active.length) blockingIssues.push("cart_empty");
  for (const line of active) {
    if (line.priceUnavailable) blockingIssues.push(`price_unavailable:${line.id}`);
    if (!line.hasStock) blockingIssues.push(`out_of_stock:${line.id}`);
  }

  const subtotal = active.reduce((s, x) => s + x.lineTotal, 0);
  const deliveryOptions = await getDeliveryOptions(currency, lang, subtotal, {
    country: input.destinationCountry,
    region: input.destinationRegion,
  });
  if (input.destinationCountry && !deliveryOptions.length) blockingIssues.push("no_delivery_to_destination");
  const selected =
    deliveryOptions.find((d) => d.id === input.deliveryMethodId) ?? deliveryOptions[0] ?? null;

  // coupon: authoritative re-evaluation at quote time (SHP-CHK-002/015)
  let discountTotal = 0;
  let couponEvidence: Record<string, unknown> | null = null;
  let freeShipping = false;
  if (cart.totals.couponCode && active.length) {
    const { evaluateCoupon } = await import("../server/coupon.service");
    const ev = await evaluateCoupon({
      code: cart.totals.couponCode,
      subtotal,
      displayCurrency: currency,
      customerId: ctx.customerId,
      locale: lang,
    });
    if (ev.valid) {
      discountTotal = ev.discountAmount;
      freeShipping = ev.freeShipping;
      couponEvidence = { couponId: ev.couponId, code: ev.code, type: ev.couponType, scope: ev.scope, discount: ev.discountAmount, freeShipping };
    } else {
      blockingIssues.push(`coupon_invalid:${ev.reason}`);
    }
  }

  const shippingTotal = freeShipping ? 0 : (selected?.fee ?? 0);
  const tax = calculateTax(Math.max(0, subtotal - discountTotal), "standard");

  const totals = buildCartTotals({
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal: tax.amount,
    currency,
    couponCode: cart.totals.couponCode,
    hasUnavailablePrice: cart.totals.hasUnavailablePrice,
  });

  const paymentCurrency = (input.paymentCurrency || currency).toUpperCase();
  const lock = await lockPayableQuote({
    userId: ctx.userId,
    amount: totals.grandTotal,
    sourceCurrency: currency,
    paymentCurrency,
    metadata: { cartId: input.cartId },
  });

  return {
    cartId: input.cartId,
    currency,
    totals,
    deliveryOptions,
    selectedDeliveryMethodId: selected?.id ?? null,
    paymentCurrency: lock.paymentCurrency,
    paymentTotal: lock.paymentAmount,
    fxQuoteId: lock.quoteId,
    fxAppliedRate: lock.appliedRate,
    quoteExpiresAt: lock.expiresAt,
    blockingIssues: Array.from(new Set(blockingIssues)),
    couponEvidence,
  };
}

function generateOrderNumber(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LS-${ymd}-${rand}`;
}

export type PlaceOrderInput = {
  cartId: string;
  idempotencyKey: string;
  email: string;
  shippingAddress: Record<string, string | null | undefined>;
  billingAddress: Record<string, string | null | undefined>;
  deliveryMethodId: string;
  paymentMethodId: string;
  paymentCurrency?: string | null;
  note?: string | null;
  sourceSurface?: string | null;
};

export type PlaceOrderResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  currency: string;
  paymentTotal: number;
  paymentCurrency: string;
  reused: boolean;
};

/**
 * Places an order idempotently. The (scope, idempotencyKey) pair is unique in
 * shop.checkout_intents, so a double-tap / retry returns the first order rather
 * than creating a second (SHP-V01-017, SHP-CHK-007, SHP-NFR-004). Stock is
 * reserved inside the same transaction with a conditional UPDATE, so concurrent
 * final-unit checkouts cannot oversell (SHP-V01-016, SHP-NFR-003, SHP-INV-002).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(ctx.locale);
  const scopeKind: "customer" | "guest" = ctx.customerId ? "customer" : "guest";
  const scopeId = ctx.customerId ?? ctx.guestToken;
  if (!scopeId) throw new Error("No checkout identity.");
  if (!input.idempotencyKey || input.idempotencyKey.length < 8) throw new Error("A valid idempotency key is required.");

  // A signed-in checkout may omit the email — fall back to the account email so
  // the order still has a contact and stays findable in the customer's list.
  const orderEmail = (input.email?.trim() || ctx.email || "").toLowerCase();
  if (!orderEmail) throw new Error("An email address is required to place the order.");

  // Idempotency short-circuit BEFORE re-quoting: a retry hits a cart that the
  // first call already converted, so re-quoting would fail with "cart mismatch"
  // before the in-transaction gate is reached (SHP-V01-017, SHP-CHK-007).
  const prior = await sql<any[]>`
    select ci.order_id::text as "orderId", o.order_number as "orderNumber", o.status, o.payment_status as "paymentStatus",
           o.grand_total::float as "grandTotal", o.currency, o.payment_total::float as "paymentTotal", o.payment_currency as "paymentCurrency"
    from shop.checkout_intents ci
    left join shop.orders o on o.id = ci.order_id
    where ci.scope_kind = ${scopeKind} and ci.scope_id = ${scopeId} and ci.idempotency_key = ${input.idempotencyKey}
    limit 1
  `;
  if (prior[0]?.orderId) {
    return {
      orderId: prior[0].orderId,
      orderNumber: prior[0].orderNumber,
      status: prior[0].status,
      paymentStatus: prior[0].paymentStatus,
      grandTotal: Number(prior[0].grandTotal),
      currency: prior[0].currency,
      paymentTotal: Number(prior[0].paymentTotal ?? prior[0].grandTotal),
      paymentCurrency: prior[0].paymentCurrency ?? prior[0].currency,
      reused: true,
    };
  }

  // Server-authoritative geographic eligibility (SHP-V03-012): the client may
  // have quoted with a different address than the one it is now submitting.
  const destCountry = (input.shippingAddress?.country as string | undefined) ?? null;
  const destRegion = (input.shippingAddress?.stateRegion as string | undefined) ?? null;
  if (input.deliveryMethodId && destCountry) {
    const eligible = await isDeliveryMethodEligible(input.deliveryMethodId, {
      country: destCountry,
      region: destRegion,
    });
    if (!eligible) throw new Error("The selected delivery method does not ship to this address.");
  }

  const quote = await quoteCheckout({
    cartId: input.cartId,
    deliveryMethodId: input.deliveryMethodId,
    paymentCurrency: input.paymentCurrency,
    destinationCountry: destCountry,
    destinationRegion: destRegion,
  });
  if (quote.blockingIssues.length) {
    throw new Error(`Checkout cannot proceed: ${quote.blockingIssues.join(", ")}`);
  }

  const requestHash = createHash("sha256")
    .update(JSON.stringify({ cartId: input.cartId, total: quote.totals.grandTotal, email: orderEmail }))
    .digest("hex");

  const result = await sql.begin(async (tx) => {
    // 1. idempotency gate
    const existing = await tx<any[]>`
      select ci.order_id::text as "orderId", o.order_number as "orderNumber", o.status, o.payment_status as "paymentStatus",
             o.grand_total::float as "grandTotal", o.currency, o.payment_total::float as "paymentTotal", o.payment_currency as "paymentCurrency"
      from shop.checkout_intents ci
      left join shop.orders o on o.id = ci.order_id
      where ci.scope_kind = ${scopeKind} and ci.scope_id = ${scopeId} and ci.idempotency_key = ${input.idempotencyKey}
      limit 1
    `;
    if (existing[0]?.orderId) {
      return { ...existing[0], reused: true } as PlaceOrderResult & { reused: true };
    }

    await tx`
      insert into shop.checkout_intents (idempotency_key, scope_kind, scope_id, cart_id, status, request_hash)
      values (${input.idempotencyKey}, ${scopeKind}, ${scopeId}, ${input.cartId}::uuid, 'started', ${requestHash})
      on conflict (scope_kind, scope_id, idempotency_key) do nothing
    `;

    // 2. re-read cart lines from canonical catalog inside the tx (SHP-CART-005, SHP-NFR-001)
    const lines = await tx<any[]>`
      select
        ci.id::text as "cartItemId", ci.product_id::text as "productId", ci.variant_id::text as "variantId",
        ci.quantity,
        common.get_translation_t(p.name_translations, ${lang}, 'en') as "nameEn",
        p.name_translations as "nameTr",
        common.get_translation_t(v.title_translations, ${lang}, 'en') as "variantEn",
        v.title_translations as "variantTr", v.sku,
        coalesce(v.price, p.base_price)::float as "sourceUnitPrice",
        coalesce(v.currency, p.base_currency) as "sourceCurrency",
        coalesce(v.compare_at_price, p.compare_at_price)::float as "sourceCompareAt",
        coalesce(v.allow_backorder, p.allow_backorder) as "allowBackorder",
        coalesce(v.is_preorder, p.is_preorder) as "isPreorder",
        coalesce(v.preorder_limit, p.preorder_limit) as "preorderLimit",
        coalesce(v.preorder_release_at, p.preorder_release_at)::text as "preorderReleaseAt",
        (p.status = 'active' and p.deleted_at is null) as "productActive",
        coalesce((
          select url from shop.product_media where product_id = p.id order by is_primary desc, display_order asc limit 1
        ), null) as "imageUrl"
      from shop.cart_items ci
      join shop.products p on p.id = ci.product_id
      left join shop.product_variants v on v.id = ci.variant_id
      where ci.cart_id = ${input.cartId}::uuid and ci.saved_for_later = false
      order by ci.create_date asc
    `;
    if (!lines.length) throw new Error("Cart is empty.");
    for (const l of lines) {
      if (!l.productActive) throw new Error(`"${l.nameEn}" is no longer available.`);
    }

    // 3. reserve stock atomically (skips backorder-allowed lines)
    for (const l of lines) {
      // Preorder line: never reserves physical stock (it isn't shippable yet,
      // SHP-V02-012). Instead the preorder cap is enforced server-side
      // (SHP-V02-011) — count units already sold as preorder for this product.
      if (l.isPreorder) {
        if (l.preorderLimit != null) {
          const [{ sold }] = await tx<{ sold: number }[]>`
            select coalesce(sum(oi.quantity), 0)::int as sold
            from shop.order_items oi
            join shop.orders o on o.id = oi.order_id
            where oi.product_id = ${l.productId}::uuid and oi.is_preorder = true
              and o.status not in ('cancelled', 'refunded', 'returned')
          `;
          if (Number(sold) + Number(l.quantity) > Number(l.preorderLimit)) {
            throw new Error(`Preorder allocation for "${l.nameEn}" is full.`);
          }
        }
        continue;
      }
      if (l.allowBackorder) continue;
      const reserved = await tx<{ id: string }[]>`
        update shop.inventory
        set reserved = reserved + ${l.quantity}, last_modified_date = now()
        where id = (
          select i.id
          from shop.inventory i
          join shop.warehouses w on w.id = i.warehouse_id and w.is_active
          where ((${l.variantId}::uuid is not null and i.variant_id = ${l.variantId}::uuid)
              or (${l.variantId}::uuid is null and i.product_id = ${l.productId}::uuid and i.variant_id is null))
            and (i.on_hand - i.reserved) >= ${l.quantity}
          -- Allocation policy (SHP-V03-001): prefer the highest-priority
          -- warehouse that can fully fill the line; ties break on most stock.
          order by w.priority asc, (i.on_hand - i.reserved) desc
          limit 1
        )
        and (on_hand - reserved) >= ${l.quantity}
        returning id::text as id
      `;
      if (!reserved[0]) {
        throw new Error(`Not enough stock for "${l.nameEn}".`);
      }
    }

    // 4. price lines in the display currency (server-side)
    const { resolvePrices } = await import("../lib/pricing");
    const priced = await resolvePrices(
      lines.map((l) => ({
        ref: l,
        amount: Number(l.sourceUnitPrice),
        sourceCurrency: l.sourceCurrency,
        compareAtAmount: l.sourceCompareAt != null ? Number(l.sourceCompareAt) : null,
      })),
      quote.currency
    );

    const orderNumber = generateOrderNumber();
    const fxSnapshot = {
      displayCurrency: quote.currency,
      paymentCurrency: quote.paymentCurrency,
      paymentTotal: quote.paymentTotal,
      fxQuoteId: quote.fxQuoteId,
      fxAppliedRate: quote.fxAppliedRate,
      quotedAt: new Date().toISOString(),
    };

    const [order] = await tx<{ id: string }[]>`
      insert into shop.orders (
        order_number, customer_id, cart_id, email, currency, status, payment_status, fulfillment_status,
        review_status, subtotal, discount_total, shipping_total, tax_total, grand_total, coupon_code, note,
        source_currency, display_currency, payment_currency, payment_total, fx_quote_id, fx_applied_rate,
        fx_snapshot, idempotency_key, source_surface
      ) values (
        ${orderNumber}, ${ctx.customerId ?? null}::uuid, ${input.cartId}::uuid, ${orderEmail}, ${quote.currency},
        'awaiting_payment', 'pending', 'pending', 'not_required',
        ${quote.totals.subtotal}, ${quote.totals.discountTotal}, ${quote.totals.shippingTotal}, ${quote.totals.taxTotal},
        ${quote.totals.grandTotal}, ${quote.totals.couponCode}, ${input.note ?? null},
        ${quote.currency}, ${quote.currency}, ${quote.paymentCurrency}, ${quote.paymentTotal},
        ${quote.fxQuoteId}::uuid, ${quote.fxAppliedRate}, ${sql.json(fxSnapshot)}, ${input.idempotencyKey}, ${input.sourceSurface ?? "shop_checkout"}
      )
      returning id::text as id
    `;

    for (const addressType of ["shipping", "billing"] as const) {
      const a = addressType === "shipping" ? input.shippingAddress : input.billingAddress;
      await tx`
        insert into shop.order_addresses
          (order_id, address_type, full_name, phone_number_country_code, phone_number, country, city, state_region, address_line_1, address_line_2, postal_code, company)
        values
          (${order.id}::uuid, ${addressType}, ${a.fullName ?? ""}, ${a.phoneNumberCountryCode ?? null}, ${a.phoneNumber ?? null},
           ${a.country ?? ""}, ${a.city ?? ""}, ${a.stateRegion ?? null}, ${a.addressLine1 ?? ""}, ${a.addressLine2 ?? null},
           ${a.postalCode ?? null}, ${a.company ?? null})
      `;
    }

    for (const p of priced) {
      const l = p.ref;
      const unit = p.price.amount;
      const lineTotal = Math.round((unit * l.quantity + Number.EPSILON) * 100) / 100;
      await tx`
        insert into shop.order_items (
          order_id, product_id, variant_id, sku, quantity, currency,
          unit_price_snapshot, compare_at_price_snapshot, discount_total_snapshot, tax_total_snapshot, line_total_snapshot,
          product_name_snapshot, variant_name_snapshot, attributes_snapshot, image_url_snapshot,
          source_currency, source_unit_price, display_currency, fx_applied_rate, is_preorder
        ) values (
          ${order.id}::uuid, ${l.productId}::uuid, ${l.variantId ?? null}::uuid, ${l.sku ?? null}, ${l.quantity}, ${quote.currency},
          ${unit}, ${p.compareAtPrice && !p.compareAtPrice.unavailable ? p.compareAtPrice.amount : null}, 0, 0, ${lineTotal},
          ${l.nameTr ?? sql.json({ en: l.nameEn })}, ${l.variantTr ?? sql.json({})}, ${sql.json({})}, ${l.imageUrl ?? null},
          ${l.sourceCurrency}, ${Number(l.sourceUnitPrice)}, ${quote.currency}, ${p.price.appliedRate}, ${Boolean(l.isPreorder)}
        )
      `;
      // trace reservation to the order (SHP-INV / SHP-V03-002) — preorder lines
      // hold no physical stock, so there is nothing to trace.
      if (!l.isPreorder) {
        await tx`
          insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
          select i.id, 'reservation', ${l.quantity}, 'shop.order', ${order.id}::uuid, ${"reserved at checkout " + orderNumber}
          from shop.inventory i
          where (${l.variantId}::uuid is not null and i.variant_id = ${l.variantId}::uuid)
             or (${l.variantId}::uuid is null and i.product_id = ${l.productId}::uuid and i.variant_id is null)
          limit 1
        `;
      }
    }

    // coupon redemption audit row (SHP-CHK-002)
    if (quote.couponEvidence && quote.couponEvidence.couponId) {
      const { recordCouponRedemption } = await import("../server/coupon.service");
      await recordCouponRedemption(tx, {
        couponId: String(quote.couponEvidence.couponId),
        code: String(quote.couponEvidence.code ?? quote.totals.couponCode ?? ""),
        orderId: order.id,
        cartId: input.cartId,
        customerId: ctx.customerId,
        amount: quote.totals.discountTotal,
      });
    }

    await tx`insert into shop.order_status_history (order_id, from_status, to_status, note) values (${order.id}::uuid, null, 'awaiting_payment', 'Order created via checkout')`;
    await tx`update shop.carts set status = 'converted', converted_order_id = ${order.id}::uuid, last_modified_date = now() where id = ${input.cartId}::uuid`;
    await tx`
      update shop.checkout_intents
      set order_id = ${order.id}::uuid, status = 'completed', last_modified_date = now(),
          response_snapshot = ${sql.json({ orderNumber })}
      where scope_kind = ${scopeKind} and scope_id = ${scopeId} and idempotency_key = ${input.idempotencyKey}
    `;

    return {
      orderId: order.id,
      orderNumber,
      status: "awaiting_payment",
      paymentStatus: "pending",
      grandTotal: quote.totals.grandTotal,
      currency: quote.currency,
      paymentTotal: quote.paymentTotal,
      paymentCurrency: quote.paymentCurrency,
      reused: false,
    } as PlaceOrderResult;
  });

  if (!result.reused) {
    await emitCommerceEvent("shop_order_placed", {
      orderId: result.orderId,
      value: result.grandTotal,
      currency: result.currency,
      surface: input.sourceSurface ?? "shop_checkout",
    });
    await notifyShopOrderEvent({ orderId: result.orderId, event: "order.placed", locale: ctx.locale });
    // Close the loop for abandoned-cart reporting (SHP-V03-011).
    await import("../server/cart-recovery.service").then((m) => m.markCartRecovered(input.cartId)).catch(() => undefined);
  }
  return result;
}
