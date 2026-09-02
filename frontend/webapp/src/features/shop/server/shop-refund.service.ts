import "server-only";

import sql from "@/config/database/db";

import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";
import { emitCommerceEvent } from "../lib/analytics";
import { notifyShopOrderEvent } from "./shop-notifications";

/**
 * After-sales refunds (SHP-ADM-016, SHP-PAY-007/008). V0.1 records an
 * *approved manual* refund — the platform's payment provider adapters expose no
 * `refund` method, so an automated gateway refund is out of scope here. The
 * refund amount can never exceed the captured-and-not-yet-refunded balance
 * (SHP-PAY-007) and each refund updates order + payment state exactly once
 * inside one transaction (SHP-PAY-008).
 */

export type RefundView = {
  orderId: string;
  orderNumber: string;
  currency: string;
  grandTotal: number;
  capturedTotal: number;
  refundedTotal: number;
  refundable: number;
  paymentStatus: string;
  orderStatus: string;
  refunds: Array<{ id: string; amount: number; currency: string; reason: string | null; status: string; refundedAt: string | null }>;
};

export async function getOrderRefundView(orderId: string): Promise<RefundView | null> {
  await assertShopPermission(SHOP_PERMISSIONS.paymentsView);
  const [order] = await sql<any[]>`
    select o.id::text as "orderId", o.order_number as "orderNumber", o.currency,
      o.grand_total::float as "grandTotal", o.payment_status as "paymentStatus", o.status as "orderStatus",
      coalesce((select sum(amount) from shop.payment_transactions t where t.order_id = o.id and t.status = 'captured'), 0)::float as "capturedTotal",
      coalesce((select sum(amount) from shop.refunds r where r.order_id = o.id and r.status in ('refunded','captured')), 0)::float as "refundedTotal"
    from shop.orders o where o.id = ${orderId}::uuid limit 1
  `;
  if (!order) return null;
  const refunds = await sql<any[]>`
    select id::text as id, amount::float as amount, currency, reason, status, refunded_at::text as "refundedAt"
    from shop.refunds where order_id = ${orderId}::uuid order by create_date desc
  `;
  const refundable = Math.max(0, Math.round((order.capturedTotal - order.refundedTotal + Number.EPSILON) * 100) / 100);
  return { ...order, refundable, refunds: refunds.map((r) => ({ ...r, amount: Number(r.amount) })) };
}

export async function recordManualRefund(input: {
  orderId: string;
  amount: number;
  reason: string;
  restock: boolean;
}): Promise<{ refundId: string; fullyRefunded: boolean }> {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.refundsManage);
  if (!input.reason?.trim()) throw new Error("A refund reason is required.");
  const amount = Math.round((Number(input.amount) + Number.EPSILON) * 100) / 100;
  if (!(amount > 0)) throw new Error("Refund amount must be positive.");

  const result = await sql.begin(async (tx) => {
    // lock the order row for the duration of the refund
    const [order] = await tx<any[]>`
      select o.id::text as id, o.order_number, o.currency, o.status, o.payment_status,
        coalesce((select sum(t.amount) from shop.payment_transactions t where t.order_id = o.id and t.status = 'captured'), 0)::float as captured,
        coalesce((select sum(r.amount) from shop.refunds r where r.order_id = o.id and r.status in ('refunded','captured')), 0)::float as refunded
      from shop.orders o where o.id = ${input.orderId}::uuid for update
    `;
    if (!order) throw new Error("Order not found.");
    if (!["captured", "partially_refunded"].includes(order.payment_status)) {
      throw new Error(`Order payment status is "${order.payment_status}"; only a captured payment can be refunded.`);
    }
    const refundable = Math.round((Number(order.captured) - Number(order.refunded) + Number.EPSILON) * 100) / 100;
    if (amount > refundable + 0.001) {
      throw new Error(`Refund ${amount} exceeds the refundable balance ${refundable}.`);
    }

    const [txn] = await tx<{ id: string }[]>`
      select id::text as id from shop.payment_transactions
      where order_id = ${input.orderId}::uuid and status = 'captured'
      order by captured_at desc nulls last, create_date desc limit 1
    `;

    const [refund] = await tx<{ id: string }[]>`
      insert into shop.refunds (order_id, payment_transaction_id, amount, currency, reason, status, refunded_at)
      values (${input.orderId}::uuid, ${txn?.id ?? null}::uuid, ${amount}, ${order.currency}, ${input.reason.trim()}, 'refunded', now())
      returning id::text as id
    `;

    const newRefunded = Math.round((Number(order.refunded) + amount + Number.EPSILON) * 100) / 100;
    const fullyRefunded = newRefunded + 0.001 >= Number(order.captured);
    const nextPayment = fullyRefunded ? "refunded" : "partially_refunded";
    const nextOrder = fullyRefunded ? "refunded" : "partially_refunded";

    await tx`
      update shop.orders
      set payment_status = ${nextPayment}::shop.payment_status,
          status = ${nextOrder}::shop.order_status,
          last_modified_date = now()
      where id = ${input.orderId}::uuid
    `;
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note, changed_by)
      values (${input.orderId}::uuid, ${order.status}::shop.order_status, ${nextOrder}::shop.order_status,
        ${`Refund ${amount} ${order.currency}: ${input.reason.trim()}`}, ${userId ?? null}::uuid)
    `;

    if (input.restock && fullyRefunded) {
      // return stock to on-hand for a full refund (SHP-INV-004 / SHP-V03-008)
      const items = await tx<any[]>`select product_id, variant_id, quantity from shop.order_items where order_id = ${input.orderId}::uuid`;
      for (const it of items) {
        const [inv] = await tx<{ id: string }[]>`
          select i.id::text as id from shop.inventory i
          where (${it.variant_id}::uuid is not null and i.variant_id = ${it.variant_id}::uuid)
             or (${it.variant_id}::uuid is null and i.product_id = ${it.product_id}::uuid and i.variant_id is null)
          limit 1
        `;
        if (!inv) continue;
        await tx`update shop.inventory set on_hand = on_hand + ${it.quantity}, last_modified_date = now() where id = ${inv.id}::uuid`;
        await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, note, created_by)
                 values (${inv.id}::uuid, 'return', ${it.quantity}, 'shop.refund', ${refund.id}::uuid, 'refund restock', ${userId ?? null}::uuid)`;
      }
    }

    return { refundId: refund.id, fullyRefunded };
  });

  const [order] = await sql<{ currency: string; total: number }[]>`
    select currency, ${amount}::float as total from shop.orders where id = ${input.orderId}::uuid
  `;
  await emitCommerceEvent("shop_refund_completed", { orderId: input.orderId, value: amount, currency: order?.currency });
  await notifyShopOrderEvent({ orderId: input.orderId, event: "order.refunded", extra: { reason: input.reason.trim() } });
  // Credit-note document against the canonical billing capability (SHP-V03-010).
  await import("./invoicing.service").then((m) =>
    m.issueRefundCreditNote({ orderId: input.orderId, amount, reason: input.reason.trim(), actorUserId: userId ?? null }),
  );
  return result;
}
