import type { OrderDetail, OrderSummary } from "../types/domain";
import { resolveCurrentCustomerId, sql } from "../lib/db";

export async function listCustomerOrders(): Promise<OrderSummary[]> {
  const customerId = await resolveCurrentCustomerId();
  if (!customerId) return [];
  const rows = await sql<any[]>`
    select o.id::text as id, o.order_number as "orderNumber", o.status, o.payment_status as "paymentStatus", o.fulfillment_status as "fulfillmentStatus",
      o.placed_at::text as "placedAt", o.grand_total::float as "grandTotal", o.currency, coalesce(sum(oi.quantity), 0)::int as "itemCount"
    from shop.orders o left join shop.order_items oi on oi.order_id = o.id
    where o.customer_id = ${customerId}::uuid
    group by o.id order by o.placed_at desc
  `;
  return rows.map(row => ({ ...row, grandTotal: +row.grandTotal, itemCount: +row.itemCount }));
}

export async function getCustomerOrder(orderNumber: string): Promise<OrderDetail | null> {
  const customerId = await resolveCurrentCustomerId();
  if (!customerId) return null;
  const [order] = await sql<any[]>`
    select o.id::text as id, o.order_number as "orderNumber", o.status, o.payment_status as "paymentStatus", o.fulfillment_status as "fulfillmentStatus",
      o.placed_at::text as "placedAt", o.grand_total::float as "grandTotal", o.currency, coalesce(sum(oi.quantity), 0)::int as "itemCount"
    from shop.orders o left join shop.order_items oi on oi.order_id = o.id
    where o.customer_id = ${customerId}::uuid and o.order_number = ${orderNumber}
    group by o.id limit 1
  `;
  if (!order) return null;
  const items = await sql<any[]>`
    select oi.id::text as id, oi.product_id::text as "productId", p.slug, common.get_translation_t(oi.product_name_snapshot, 'en', 'en') as name,
      common.get_translation_t(oi.variant_name_snapshot, 'en', 'en') as "variantName", oi.image_url_snapshot as "imageUrl",
      oi.quantity, oi.unit_price_snapshot::float as "unitPrice", oi.line_total_snapshot::float as "lineTotal", oi.attributes_snapshot as attributes
    from shop.order_items oi left join shop.products p on p.id = oi.product_id where oi.order_id = ${order.id}::uuid order by oi.create_date asc
  `;
  const addresses = await sql<any[]>`select address_type, full_name, country, city, state_region, address_line_1, address_line_2, postal_code, company from shop.order_addresses where order_id = ${order.id}::uuid`;
  const statusHistory = await sql<any[]>`select id::text as id, from_status as "fromStatus", to_status as "toStatus", note, create_date::text as "createDate" from shop.order_status_history where order_id = ${order.id}::uuid order by create_date desc`;
  const shipments = await sql<any[]>`select id::text as id, shipment_number as "shipmentNumber", tracking_number as "trackingNumber", carrier, status from shop.shipments where order_id = ${order.id}::uuid order by create_date desc`;
  return { ...order, grandTotal: +order.grandTotal, itemCount: +order.itemCount, items: items.map(i => ({ ...i, quantity: +i.quantity, unitPrice: +i.unitPrice, lineTotal: +i.lineTotal })), shippingAddress: addresses.find(x => x.address_type === "shipping") ?? {}, billingAddress: addresses.find(x => x.address_type === "billing") ?? {}, statusHistory, shipments };
}
