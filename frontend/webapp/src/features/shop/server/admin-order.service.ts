import "server-only";

import sql from "@/config/database/db";
import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";
import { emitCommerceEvent } from "../lib/analytics";
import { notifyShopOrderEvent } from "./shop-notifications";

/**
 * Admin order operations. Order / payment / fulfilment are separate state
 * machines (SHP-ARCH-005, SHP-ORD-002..004); each transition is validated
 * server-side and written to shop.order_status_history with the acting admin and
 * a reason where one is required (SHP-NFR-005, SHP-ORD-006).
 */

const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["partially_shipped", "shipped", "cancelled", "completed"],
  partially_shipped: ["shipped", "completed", "cancelled"],
  shipped: ["completed", "returned"],
  completed: ["returned", "refunded"],
  cancelled: [],
  refunded: [],
  partially_refunded: ["refunded"],
  returned: ["refunded"],
};

function assertTransition(from: string, to: string) {
  if (!(ORDER_TRANSITIONS[from] ?? []).includes(to)) {
    throw new Error(`Order transition ${from} → ${to} is not allowed.`);
  }
}

async function loadOrder(orderId: string) {
  const rows = await sql<any[]>`
    select id::text as id, order_number, status, payment_status, fulfillment_status, review_status, currency, grand_total::float as grand_total
    from shop.orders where id = ${orderId}::uuid limit 1
  `;
  if (!rows[0]) throw new Error("Order not found.");
  return rows[0];
}

/** Manual acceptance is tracked independently of payment/fulfilment (SHP-ORD-005). */
export async function reviewOrder(input: { orderId: string; decision: "accepted" | "rejected"; reason?: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  if (input.decision === "rejected" && !input.reason?.trim()) throw new Error("A reason is required to reject an order.");
  const order = await loadOrder(input.orderId);

  await sql.begin(async (tx) => {
    await tx`
      update shop.orders
      set review_status = ${input.decision}::shop.order_review_status,
          review_note = ${input.reason ?? null},
          reviewed_by = ${userId ?? null}::uuid,
          reviewed_at = now(),
          status = case when ${input.decision} = 'rejected' then 'cancelled'::shop.order_status else status end,
          cancelled_at = case when ${input.decision} = 'rejected' then now() else cancelled_at end,
          last_modified_date = now()
      where id = ${input.orderId}::uuid
    `;
    if (input.decision === "rejected") {
      await releaseReservations(tx, input.orderId, "order rejected by admin");
      await tx`
        insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
        values (${input.orderId}::uuid, ${order.status}::shop.order_status, 'cancelled', ${"Rejected: " + input.reason}, ${userId ?? null}::uuid)
      `;
    } else {
      await tx`
        insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
        values (${input.orderId}::uuid, ${order.status}::shop.order_status, ${order.status}::shop.order_status, 'Accepted for processing', ${userId ?? null}::uuid)
      `;
    }
  });
  if (input.decision === "rejected") {
    await notifyShopOrderEvent({ orderId: input.orderId, event: "order.cancelled", extra: { reason: input.reason ?? "" } });
  }
}

export async function advanceOrderStatus(input: { orderId: string; to: string; reason?: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const order = await loadOrder(input.orderId);
  assertTransition(order.status, input.to);
  if ((input.to === "cancelled") && !input.reason?.trim()) throw new Error("A reason is required to cancel an order.");

  await sql.begin(async (tx) => {
    await tx`
      update shop.orders set status = ${input.to}::shop.order_status,
        cancelled_at = case when ${input.to} = 'cancelled' then now() else cancelled_at end,
        last_modified_date = now()
      where id = ${input.orderId}::uuid
    `;
    if (input.to === "cancelled") {
      await releaseReservations(tx, input.orderId, "order cancelled by admin");
    }
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
      values (${input.orderId}::uuid, ${order.status}::shop.order_status, ${input.to}::shop.order_status, ${input.reason ?? null}, ${userId ?? null}::uuid)
    `;
  });
  if (input.to === "cancelled") {
    await notifyShopOrderEvent({ orderId: input.orderId, event: "order.cancelled", extra: { reason: input.reason ?? "" } });
  }
}

/** Approved manual/bank-transfer settlement (SHP-ADM path for SHP-V01-018). */
export async function markOrderPaidManually(input: { orderId: string; reference?: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const order = await loadOrder(input.orderId);
  if (order.payment_status === "captured") return;

  await sql.begin(async (tx) => {
    // record / update a manual transaction
    const txn = await tx<{ id: string }[]>`
      select id::text as id from shop.payment_transactions
      where order_id = ${input.orderId}::uuid and provider = 'manual'
      order by create_date desc limit 1
    `;
    if (txn[0]) {
      await tx`update shop.payment_transactions set status = 'captured', captured_at = now(),
        provider_transaction_id = coalesce(${input.reference ?? null}, provider_transaction_id), last_modified_date = now()
        where id = ${txn[0].id}::uuid`;
    } else {
      await tx`insert into shop.payment_transactions (order_id, provider, amount, currency, status, type, provider_transaction_id, captured_at)
        values (${input.orderId}::uuid, 'manual', ${order.grand_total}, ${order.currency}, 'captured', 'manual', ${input.reference ?? null}, now())`;
    }
    await tx`
      update shop.orders
      set payment_status = 'captured',
          status = case when status = 'awaiting_payment' then 'paid'::shop.order_status else status end,
          paid_at = coalesce(paid_at, now()), last_modified_date = now()
      where id = ${input.orderId}::uuid
    `;
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
      values (${input.orderId}::uuid, ${order.status}::shop.order_status, 'paid', ${"Manual payment recorded" + (input.reference ? ` (${input.reference})` : "")}, ${userId ?? null}::uuid)
    `;
  });
  await emitCommerceEvent("shop_payment_succeeded", { orderId: input.orderId, value: order.grand_total, currency: order.currency });
  await notifyShopOrderEvent({ orderId: input.orderId, event: "order.paid" });
}

export async function recordShipment(input: {
  orderId: string;
  carrier?: string;
  trackingNumber?: string;
  markShipped?: boolean;
}) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const order = await loadOrder(input.orderId);
  const shipmentNumber = `SHP-${order.order_number}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await sql.begin(async (tx) => {
    const [ship] = await tx<{ id: string }[]>`
      insert into shop.shipments (order_id, status, shipment_number, tracking_number, carrier, shipped_at)
      values (${input.orderId}::uuid, ${input.markShipped ? "shipped" : "pending"}::shop.shipment_status, ${shipmentNumber},
              ${input.trackingNumber ?? null}, ${input.carrier ?? null}, ${input.markShipped ? sql`now()` : null})
      returning id::text as id
    `;
    // whole-order shipment: all items
    await tx`
      insert into shop.shipment_items (shipment_id, order_item_id, quantity)
      select ${ship.id}::uuid, oi.id, oi.quantity from shop.order_items oi where oi.order_id = ${input.orderId}::uuid
    `;
    if (input.markShipped) {
      await tx`update shop.order_items set fulfillment_status = 'shipped' where order_id = ${input.orderId}::uuid`;
      await tx`
        update shop.orders set fulfillment_status = 'shipped',
          status = case when status in ('paid','processing','partially_shipped') then 'shipped'::shop.order_status else status end,
          last_modified_date = now()
        where id = ${input.orderId}::uuid
      `;
      await convertReservationsToOutbound(tx, input.orderId);
      await tx`
        insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
        values (${input.orderId}::uuid, ${order.status}::shop.order_status, 'shipped', ${"Shipment " + shipmentNumber}, ${userId ?? null}::uuid)
      `;
    }
  });
  if (input.markShipped) {
    await notifyShopOrderEvent({
      orderId: input.orderId,
      event: "order.shipped",
      extra: { trackingNumber: input.trackingNumber ?? "-", carrier: input.carrier ?? "-" },
    });
  }
}

export async function markShipmentDelivered(input: { orderId: string; shipmentId: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const order = await loadOrder(input.orderId);
  await sql.begin(async (tx) => {
    await tx`update shop.shipments set status = 'delivered', delivered_at = now(), last_modified_date = now() where id = ${input.shipmentId}::uuid and order_id = ${input.orderId}::uuid`;
    await tx`update shop.order_items set fulfillment_status = 'delivered' where order_id = ${input.orderId}::uuid`;
    await tx`
      update shop.orders set fulfillment_status = 'delivered',
        status = case when status = 'shipped' then 'completed'::shop.order_status else status end,
        last_modified_date = now()
      where id = ${input.orderId}::uuid
    `;
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
      values (${input.orderId}::uuid, ${order.status}::shop.order_status, 'completed', 'Delivered', ${userId ?? null}::uuid)
    `;
  });
  await notifyShopOrderEvent({ orderId: input.orderId, event: "order.delivered" });
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertReservationsToOutbound(tx: any, orderId: string) {
  const items = await tx<any[]>`select product_id, variant_id, quantity from shop.order_items where order_id = ${orderId}::uuid`;
  for (const it of items) {
    const [inv] = await tx<{ id: string }[]>`
      select i.id::text as id from shop.inventory i
      where (${it.variant_id}::uuid is not null and i.variant_id = ${it.variant_id}::uuid)
         or (${it.variant_id}::uuid is null and i.product_id = ${it.product_id}::uuid and i.variant_id is null)
      limit 1
    `;
    if (!inv) continue;
    await tx`
      update shop.inventory
      set reserved = greatest(reserved - ${it.quantity}, 0),
          on_hand = greatest(on_hand - ${it.quantity}, 0),
          last_modified_date = now()
      where id = ${inv.id}::uuid
    `;
    await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note)
             values (${inv.id}::uuid, 'outbound', ${it.quantity}, 'shop.order', ${orderId}::uuid, 'shipped')`;
  }
}

export async function setProductPublished(input: { productId: string; published: boolean }) {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`
    update shop.products
    set status = ${input.published ? "active" : "draft"}::shop.product_status,
        published_at = case when ${input.published} then coalesce(published_at, now()) else published_at end,
        last_modified_date = now()
    where id = ${input.productId}::uuid and deleted_at is null
  `;
}

export async function adjustInventory(input: { inventoryId: string; delta: number; reason: string }) {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.inventoryManage);
  if (!input.reason?.trim()) throw new Error("An adjustment reason is required.");
  await sql.begin(async (tx) => {
    const [row] = await tx<{ on_hand: number }[]>`select on_hand from shop.inventory where id = ${input.inventoryId}::uuid for update`;
    if (!row) throw new Error("Inventory row not found.");
    const next = row.on_hand + Math.trunc(input.delta);
    if (next < 0) throw new Error("Adjustment would make on-hand negative.");
    await tx`update shop.inventory set on_hand = ${next}, last_modified_date = now(), last_counted_at = now() where id = ${input.inventoryId}::uuid`;
    await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, note, created_by)
             values (${input.inventoryId}::uuid, 'adjustment', ${Math.trunc(input.delta)}, 'manual', ${input.reason}, ${userId ?? null}::uuid)`;
  });
}
