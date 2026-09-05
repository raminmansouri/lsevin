import "server-only";

import sql from "@/config/database/db";

import { getShopContext } from "../lib/context";
import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";
import { emitCommerceEvent } from "../lib/analytics";
import { notifyShopOrderEvent } from "./shop-notifications";

/**
 * Cancellations & returns (SHP-V03-005/006/007/008, SHP-AfterSales).
 *
 * - Cancellation is allowed only before fulfilment starts. A *paid* order that is
 *   cancelled does NOT auto-refund (SHP-ORD-007) — the admin runs the refund
 *   flow, and the order carries a `refund_pending` marker.
 * - A return request needs a delivered/shipped order and lists eligible items and
 *   quantities. Receiving an approved return restocks per the item condition.
 */

const CANCELLABLE_ORDER_STATUSES = ["pending", "awaiting_payment", "paid", "processing"];
const RETURNABLE_ORDER_STATUSES = ["shipped", "partially_shipped", "completed"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function releaseReservations(tx: any, orderId: string, note: string) {
  const items = await tx<any[]>`select product_id, variant_id, quantity from shop.order_items where order_id = ${orderId}::uuid`;
  for (const it of items) {
    const [inv] = await tx<{ id: string }[]>`
      select i.id::text as id from shop.inventory i
      where (${it.variant_id}::uuid is not null and i.variant_id = ${it.variant_id}::uuid)
         or (${it.variant_id}::uuid is null and i.product_id = ${it.product_id}::uuid and i.variant_id is null)
      limit 1
    `;
    if (!inv) continue;
    await tx`update shop.inventory set reserved = greatest(reserved - ${it.quantity}, 0), last_modified_date = now() where id = ${inv.id}::uuid`;
    await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
             values (${inv.id}::uuid, 'release', ${it.quantity}, 'shop.order', ${orderId}::uuid, ${note})`;
  }
}

/** Customer-initiated cancellation before the cutoff (SHP-V03-005). */
export async function requestOrderCancellation(input: { orderNumber: string; email?: string | null; reason?: string }) {
  const ctx = await getShopContext();
  const [order] = await sql<any[]>`
    select id::text as id, customer_id::text as "customerId", email, status, payment_status
    from shop.orders where order_number = ${input.orderNumber} limit 1
  `;
  if (!order) throw new Error("Order not found.");
  const owns =
    (ctx.customerId && order.customerId === ctx.customerId) ||
    (!!input.email && order.email && input.email.trim().toLowerCase() === order.email.toLowerCase());
  if (!owns) throw new Error("This order does not belong to you.");
  if (!CANCELLABLE_ORDER_STATUSES.includes(order.status)) {
    throw new Error(`This order can no longer be cancelled (status: ${order.status}).`);
  }

  const paid = ["captured", "partially_refunded"].includes(order.payment_status);
  await sql.begin(async (tx) => {
    await tx`
      update shop.orders
      set status = 'cancelled'::shop.order_status, cancelled_at = now(), last_modified_date = now(),
          meta = coalesce(meta, '{}'::jsonb) || ${sql.json({ cancelledBy: "customer", refundPending: paid })}
      where id = ${order.id}::uuid
    `;
    await releaseReservations(tx, order.id, "order cancelled by customer");
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note)
      values (${order.id}::uuid, ${order.status}::shop.order_status, 'cancelled',
        ${`Customer cancellation${input.reason ? `: ${input.reason}` : ""}${paid ? " (refund pending)" : ""}`})
    `;
  });
  await notifyShopOrderEvent({ orderId: order.id, event: "order.cancelled", extra: { reason: input.reason ?? "" } });
  return { cancelled: true, refundPending: paid };
}

export async function getReturnableItems(orderNumber: string, email?: string | null) {
  const ctx = await getShopContext();
  const [order] = await sql<any[]>`
    select id::text as id, customer_id::text as "customerId", email, status
    from shop.orders where order_number = ${orderNumber} limit 1
  `;
  if (!order) return null;
  const owns =
    (ctx.customerId && order.customerId === ctx.customerId) ||
    (!!email && order.email && email.trim().toLowerCase() === order.email.toLowerCase());
  if (!owns) return null;
  if (!RETURNABLE_ORDER_STATUSES.includes(order.status)) return { orderId: order.id, eligible: false, items: [] };

  const items = await sql<any[]>`
    select oi.id::text as id,
      common.get_translation_t(oi.product_name_snapshot, 'en', 'en') as name,
      oi.quantity,
      coalesce((select sum(ri.quantity)::int
        from shop.return_items ri join shop.return_requests rr on rr.id = ri.return_request_id
        where ri.order_item_id = oi.id and rr.status not in ('rejected','cancelled')), 0) as already_returned
    from shop.order_items oi where oi.order_id = ${order.id}::uuid
    order by oi.create_date asc
  `;
  return {
    orderId: order.id,
    eligible: true,
    items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, returnable: Math.max(0, i.quantity - i.already_returned) })),
  };
}

export async function submitReturnRequest(input: {
  orderNumber: string;
  email?: string | null;
  reason: string;
  items: Array<{ orderItemId: string; quantity: number; reason?: string }>;
}) {
  if (!input.reason?.trim()) throw new Error("A return reason is required.");
  const lines = input.items.filter((i) => i.quantity > 0);
  if (!lines.length) throw new Error("Select at least one item to return.");

  const returnable = await getReturnableItems(input.orderNumber, input.email);
  if (!returnable || !returnable.eligible) throw new Error("This order is not eligible for return.");
  const byId = new Map(returnable.items.map((i) => [i.id, i]));
  for (const l of lines) {
    const it = byId.get(l.orderItemId);
    if (!it) throw new Error("Unknown item in the return request.");
    if (l.quantity > it.returnable) throw new Error(`You can return at most ${it.returnable} of "${it.name}".`);
  }

  const ctx = await getShopContext();
  return sql.begin(async (tx) => {
    const [rr] = await tx<{ id: string }[]>`
      insert into shop.return_requests (order_id, customer_id, status, reason)
      values (${returnable.orderId}::uuid, ${ctx.customerId ?? null}::uuid, 'requested', ${input.reason.trim()})
      returning id::text as id
    `;
    for (const l of lines) {
      await tx`
        insert into shop.return_items (return_request_id, order_item_id, quantity, reason)
        values (${rr.id}::uuid, ${l.orderItemId}::uuid, ${Math.trunc(l.quantity)}, ${l.reason?.trim() || null})
      `;
    }
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note)
      select id, status, status, ${"Return requested: " + input.reason.trim()}
      from shop.orders where id = ${returnable.orderId}::uuid
    `;
    return { returnRequestId: rr.id };
  });
}

// ---- admin ---------------------------------------------------------------

export async function reviewReturnRequest(input: { id: string; decision: "approved" | "rejected"; note?: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  if (input.decision === "rejected" && !input.note?.trim()) throw new Error("A reason is required to reject a return.");
  await sql`
    update shop.return_requests
    set status = ${input.decision}::shop.return_status, reviewed_at = now(),
        review_note = ${input.note?.trim() || null}, last_modified_date = now()
    where id = ${input.id}::uuid and status = 'requested'
  `;
  void userId;
}

/** Mark an approved return received → restock per item (SHP-V03-008). */
export async function receiveReturn(input: { id: string; restock: boolean }) {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  await sql.begin(async (tx) => {
    const [rr] = await tx<any[]>`
      select id::text as id, order_id::text as order_id, status from shop.return_requests where id = ${input.id}::uuid for update
    `;
    if (!rr) throw new Error("Return request not found.");
    if (rr.status !== "approved") throw new Error(`Return must be approved first (status: ${rr.status}).`);

    const items = await tx<any[]>`
      select ri.quantity, oi.product_id, oi.variant_id
      from shop.return_items ri join shop.order_items oi on oi.id = ri.order_item_id
      where ri.return_request_id = ${input.id}::uuid
    `;
    if (input.restock) {
      for (const it of items) {
        const [inv] = await tx<{ id: string }[]>`
          select i.id::text as id from shop.inventory i
          where (${it.variant_id}::uuid is not null and i.variant_id = ${it.variant_id}::uuid)
             or (${it.variant_id}::uuid is null and i.product_id = ${it.product_id}::uuid and i.variant_id is null)
          limit 1
        `;
        if (!inv) continue;
        await tx`update shop.inventory set on_hand = on_hand + ${it.quantity}, last_modified_date = now() where id = ${inv.id}::uuid`;
        await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
                 values (${inv.id}::uuid, 'return', ${it.quantity}, 'shop.return_request', ${input.id}::uuid, 'return received')`;
      }
    }
    await tx`update shop.return_requests set status = 'received'::shop.return_status, last_modified_date = now() where id = ${input.id}::uuid`;
    // mark those order lines returned
    await tx`
      update shop.order_items set fulfillment_status = 'returned'::shop.shipment_status
      where id in (select order_item_id from shop.return_items where return_request_id = ${input.id}::uuid)
    `;
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note)
      select id, status, status, 'Return received' from shop.orders where id = ${rr.order_id}::uuid
    `;
  });
  await emitCommerceEvent("shop_refund_completed", { surface: "return_received" });
}
