import "server-only";

import sql from "@/config/database/db";

import { assertShopPermission, SHOP_PERMISSIONS } from "../lib/permissions";
import { completeOrderIfFullyHandedOver } from "./order-fulfilment";
import { issuePickupCode, PICKUP_CODE_MAX_ATTEMPTS, pickupCodeMatches } from "./pickup-code";
import { sellerPartsNotReceived } from "./seller-handover.service";

/**
 * Pickup at the Lsevin office (shop.order_office_pickups, one row per order).
 *
 * - ready: when every seller's items are at Lsevin, an admin marks the order ready. A 6-digit
 *   pickup code is issued, sent to the customer by SMS and shown on their order page. Marking it
 *   ready again issues a NEW code (the "send a new code" action, also the way out of a lock).
 * - picked_up: the admin types the customer's code. A wrong code counts; after
 *   PICKUP_CODE_MAX_ATTEMPTS the code locks until a new one is issued. The order completes.
 */

/** The code scope: one office pickup per order. */
const SCOPE = "office";
const OPEN_STATUSES = ["paid", "processing"];

// Flat (not a discriminated union): this repo compiles without strictNullChecks, where a boolean
// discriminant does not narrow.
export type OfficePickupResult = {
  ok: boolean;
  status?: "ready" | "picked_up";
  orderCompleted?: boolean;
  reason?: "wrong_code" | "code_locked";
  attemptsLeft?: number;
};

export async function getOfficePickup(orderId: string) {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const [row] = await sql<{
    status: "ready" | "picked_up";
    ready_at: string;
    picked_up_at: string | null;
    attempts: number;
    locked: boolean;
  }[]>`
    select status, ready_at::text as ready_at, picked_up_at::text as picked_up_at,
      pickup_code_attempts as attempts, pickup_code_locked_at is not null as locked
    from shop.order_office_pickups where order_id = ${orderId}::uuid
  `;
  if (!row) return null;
  return {
    status: row.status,
    readyAt: row.ready_at,
    pickedUpAt: row.picked_up_at,
    locked: Boolean(row.locked),
    attemptsLeft: Math.max(PICKUP_CODE_MAX_ATTEMPTS - Number(row.attempts ?? 0), 0),
  };
}

/** Marks an office pickup order ready (or re-issues its code) and sends the customer the code. */
export async function markOrderReadyForOfficePickup(orderId: string): Promise<OfficePickupResult> {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const code = await sql.begin(async (tx) => {
    const [order] = await tx<{ status: string; mode: string; paid: boolean }[]>`
      select status::text as status, fulfillment_mode as mode, paid_at is not null as paid
      from shop.orders where id = ${orderId}::uuid for update
    `;
    if (!order) throw new Error("Order not found.");
    if (order.mode !== "office_pickup") throw new Error("This order is delivered to an address, not picked up at the office.");
    if (["cancelled", "refunded"].includes(order.status)) throw new Error("This order was cancelled.");
    if (!order.paid || !OPEN_STATUSES.includes(order.status)) throw new Error("This order is not paid, or already handed over.");
    if ((await sellerPartsNotReceived(tx, orderId)) > 0)
      throw new Error("Items from a seller have not been received yet; mark them received first.");
    const [current] = await tx<{ status: string }[]>`
      select status from shop.order_office_pickups where order_id = ${orderId}::uuid for update
    `;
    if (current?.status === "picked_up") throw new Error("This order was already picked up.");

    const issued = issuePickupCode(orderId, SCOPE);
    await tx`
      insert into shop.order_office_pickups (order_id, status, ready_at, pickup_code_hash, pickup_code_cipher,
        pickup_code_attempts, pickup_code_locked_at, pickup_code_issued_at, customer_notified_at, updated_by_user_id, updated_at)
      values (${orderId}::uuid, 'ready', now(), ${issued.hash}, ${issued.cipher}, 0, null, now(), null, ${userId ?? null}::uuid, now())
      on conflict (order_id) do update set
        pickup_code_hash = excluded.pickup_code_hash, pickup_code_cipher = excluded.pickup_code_cipher,
        pickup_code_attempts = 0, pickup_code_locked_at = null, pickup_code_issued_at = now(),
        customer_notified_at = null, updated_by_user_id = excluded.updated_by_user_id, updated_at = now()
    `;
    if (!current) {
      await tx`
        update shop.order_items set fulfillment_status = 'ready'::shop.shipment_status
        where order_id = ${orderId}::uuid and fulfillment_status::text in ('pending', 'packed')
      `;
      await tx`update shop.orders set fulfillment_status = 'ready', last_modified_date = now() where id = ${orderId}::uuid`;
      await tx`
        insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
        values (${orderId}::uuid, ${order.status}::shop.order_status, ${order.status}::shop.order_status,
          'Ready for pickup at the Lsevin office', ${userId ?? null}::uuid)
      `;
    }
    return issued.code;
  });
  // After commit; never throws.
  const { notifyShopOfficePickupReady } = await import("./shop-notifications");
  await notifyShopOfficePickupReady({ orderId, code });
  return { ok: true, status: "ready" };
}

/** The customer collected the order at the office: needs their code. */
export async function confirmOfficePickup(orderId: string, enteredCode: string): Promise<OfficePickupResult> {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const outcome = await sql.begin(async (tx) => {
    const [order] = await tx<{ status: string }[]>`
      select status::text as status from shop.orders where id = ${orderId}::uuid for update
    `;
    if (!order) throw new Error("Order not found.");
    if (["cancelled", "refunded"].includes(order.status)) throw new Error("This order was cancelled.");
    const [row] = await tx<{ status: string; hash: string | null; attempts: number; locked: boolean }[]>`
      select status, pickup_code_hash as hash, pickup_code_attempts as attempts, pickup_code_locked_at is not null as locked
      from shop.order_office_pickups where order_id = ${orderId}::uuid for update
    `;
    if (!row) throw new Error("Mark the order ready for pickup first.");
    if (row.status === "picked_up") throw new Error("This order was already picked up.");
    if (row.locked) return { ok: false as const, reason: "code_locked" as const, attemptsLeft: 0 };

    if (!pickupCodeMatches(orderId, SCOPE, enteredCode, row.hash)) {
      const attempts = Number(row.attempts ?? 0) + 1;
      const locked = attempts >= PICKUP_CODE_MAX_ATTEMPTS;
      await tx`
        update shop.order_office_pickups
        set pickup_code_attempts = ${attempts}, pickup_code_locked_at = ${locked ? sql`now()` : sql`null`}, updated_at = now()
        where order_id = ${orderId}::uuid
      `;
      // Returned, not thrown, so the counted attempt is committed.
      return {
        ok: false as const,
        reason: locked ? ("code_locked" as const) : ("wrong_code" as const),
        attemptsLeft: Math.max(PICKUP_CODE_MAX_ATTEMPTS - attempts, 0),
      };
    }

    await tx`
      update shop.order_office_pickups
      set status = 'picked_up', picked_up_at = now(), pickup_code_hash = null, pickup_code_cipher = null,
          pickup_code_attempts = 0, pickup_code_locked_at = null, updated_by_user_id = ${userId ?? null}::uuid, updated_at = now()
      where order_id = ${orderId}::uuid
    `;
    await tx`update shop.order_items set fulfillment_status = 'delivered'::shop.shipment_status where order_id = ${orderId}::uuid`;
    const completed = await completeOrderIfFullyHandedOver(tx, orderId, userId ?? null, "Picked up at the Lsevin office");
    return { ok: true as const, status: "picked_up" as const, orderCompleted: completed };
  });
  if (outcome.ok) {
    const { notifyShopOrderEvent } = await import("./shop-notifications");
    await notifyShopOrderEvent({ orderId, event: "order.delivered" });
  }
  return outcome;
}
