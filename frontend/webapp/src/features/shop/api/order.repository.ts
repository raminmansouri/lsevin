import "server-only";

import type { OrderDetail, OrderSummary } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { sql } from "../lib/db";

/**
 * Customer-facing order read model. Access is owner-scoped: a guest reads an
 * order only via (orderNumber + matching email); an authenticated customer reads
 * their own by customer_id (SHP-ORD-008 — the order number alone is not
 * authorization).
 */

const summarySelect = sql`
  o.id::text as id, o.order_number as "orderNumber", o.status, o.payment_status as "paymentStatus",
  o.fulfillment_status as "fulfillmentStatus", o.review_status as "reviewStatus",
  o.placed_at::text as "placedAt", o.grand_total::float as "grandTotal", o.currency,
  coalesce((select sum(oi.quantity) from shop.order_items oi where oi.order_id = o.id), 0)::int as "itemCount"
`;

export async function listCustomerOrders(): Promise<OrderSummary[]> {
  const ctx = await getShopContext();
  // Match on the customer id AND on the signed-in email — an order placed before
  // a `customer.customers` row existed (customer_id null) is still theirs.
  if (!ctx.customerId && !ctx.email) return [];
  const rows = await sql<any[]>`
    select ${summarySelect}
    from shop.orders o
    where (${ctx.customerId ?? null}::uuid is not null and o.customer_id = ${ctx.customerId ?? null}::uuid)
       or (${ctx.email ?? null}::text is not null and lower(o.email) = ${ctx.email ?? null}::text)
    order by o.placed_at desc
    limit 100
  `;
  return rows.map((r) => ({ ...r, grandTotal: Number(r.grandTotal), itemCount: Number(r.itemCount) }));
}

export async function getCustomerOrder(orderNumber: string, guestEmail?: string | null): Promise<OrderDetail | null> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(ctx.locale);

  const [order] = await sql<any[]>`
    select ${summarySelect},
      o.email, o.subtotal::float as subtotal, o.discount_total::float as "discountTotal",
      o.shipping_total::float as "shippingTotal", o.tax_total::float as "taxTotal",
      o.payment_currency as "paymentCurrency", o.payment_total::float as "paymentTotal",
      o.coupon_code as "couponCode", o.fx_snapshot as "fxSnapshot", o.customer_id::text as "customerId"
    from shop.orders o
    where o.order_number = ${orderNumber}
    limit 1
  `;
  if (!order) return null;

  const orderEmail = (order.email ?? "").toLowerCase();
  const authorized =
    (ctx.customerId && order.customerId === ctx.customerId) ||
    (!!ctx.email && orderEmail === ctx.email) ||
    (!!guestEmail && !!orderEmail && guestEmail.trim().toLowerCase() === orderEmail);
  if (!authorized) return null;

  const [items, addresses, statusHistory, shipments, payments, returns] = await Promise.all([
    sql<any[]>`
      select oi.id::text as id, oi.product_id::text as "productId", p.slug,
        common.get_translation_t(oi.product_name_snapshot, ${lang}, 'en') as name,
        nullif(common.get_translation_t(oi.variant_name_snapshot, ${lang}, 'en'), '') as "variantName",
        oi.image_url_snapshot as "imageUrl", oi.quantity,
        oi.unit_price_snapshot::float as "unitPrice", oi.line_total_snapshot::float as "lineTotal",
        oi.attributes_snapshot as attributes, oi.fulfillment_status as "fulfillmentStatus"
      from shop.order_items oi
      left join shop.products p on p.id = oi.product_id
      where oi.order_id = ${order.id}::uuid order by oi.create_date asc
    `,
    sql<any[]>`
      select address_type as "addressType", full_name as "fullName", phone_number_country_code as "phoneCc",
        phone_number as "phone", country, city, state_region as "stateRegion",
        address_line_1 as "addressLine1", address_line_2 as "addressLine2", postal_code as "postalCode", company
      from shop.order_addresses where order_id = ${order.id}::uuid
    `,
    sql<any[]>`
      select id::text as id, from_status as "fromStatus", to_status as "toStatus", note, create_date::text as "createDate"
      from shop.order_status_history where order_id = ${order.id}::uuid order by create_date desc
    `,
    sql<any[]>`
      select id::text as id, shipment_number as "shipmentNumber", tracking_number as "trackingNumber",
        carrier, status, shipped_at::text as "shippedAt", delivered_at::text as "deliveredAt"
      from shop.shipments where order_id = ${order.id}::uuid order by create_date desc
    `,
    sql<any[]>`
      select id::text as id, provider, amount::float as amount, currency, status, create_date::text as "createdAt"
      from shop.payment_transactions where order_id = ${order.id}::uuid order by create_date desc
    `,
    sql<any[]>`
      select rr.id::text as id, rr.status, rr.reason, rr.requested_at::text as "requestedAt", rr.review_note as "reviewNote",
        coalesce(jsonb_agg(jsonb_build_object(
          'name', common.get_translation_t(oi.product_name_snapshot, ${lang}, 'en'),
          'quantity', ri.quantity
        )) filter (where ri.id is not null), '[]'::jsonb) as items
      from shop.return_requests rr
      left join shop.return_items ri on ri.return_request_id = rr.id
      left join shop.order_items oi on oi.id = ri.order_item_id
      where rr.order_id = ${order.id}::uuid
      group by rr.id
      order by rr.requested_at desc
    `,
  ]);

  const addr = (t: string) => {
    const a = addresses.find((x) => x.addressType === t);
    return a ?? {};
  };

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    reviewStatus: order.reviewStatus,
    placedAt: order.placedAt,
    grandTotal: Number(order.grandTotal),
    currency: order.currency,
    itemCount: Number(order.itemCount),
    email: order.email,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    shippingTotal: Number(order.shippingTotal),
    taxTotal: Number(order.taxTotal),
    paymentCurrency: order.paymentCurrency ?? null,
    paymentTotal: order.paymentTotal != null ? Number(order.paymentTotal) : null,
    couponCode: order.couponCode ?? null,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.slug ?? null,
      name: i.name,
      variantName: i.variantName ?? null,
      imageUrl: i.imageUrl ?? null,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
      attributes: i.attributes ?? {},
      fulfillmentStatus: i.fulfillmentStatus,
    })),
    shippingAddress: addr("shipping"),
    billingAddress: addr("billing"),
    payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    statusHistory,
    shipments,
    returns,
    fxSnapshot: order.fxSnapshot ?? {},
  };
}
