import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

/**
 * DB-level checks for the refund flow (SHP-ADM-016, SHP-PAY-007/008). Exercises
 * the exact SQL shapes `recordManualRefund` uses and rolls everything back.
 */

const url = process.env.ACCOUNTING_TEST_DATABASE_URL || process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
afterAll(async () => {
  await sql?.end({ timeout: 5 });
});
const d = LOCAL ? describe : describe.skip;

d("manual refund", () => {
  it("refundable balance = captured − already-refunded, and partial→full transitions land correctly", async () => {
    if (!sql) return;
    await sql.begin(async (tx) => {
      const [{ id: orderId }] = await tx<{ id: string }[]>`
        insert into shop.orders (order_number, email, currency, status, payment_status, grand_total, subtotal)
        values (${"RFI-" + Date.now()}, 'x@e.com', 'USD', 'paid', 'captured', 50, 50)
        returning id::text as id
      `;
      await tx`
        insert into shop.payment_transactions (order_id, provider, amount, currency, status, type, captured_at)
        values (${orderId}::uuid, 'zarinpal', 50, 'USD', 'captured', 'charge', now())
      `;

      const refundable = async () => {
        const [r] = await tx<{ v: number }[]>`
          select (
            coalesce((select sum(amount) from shop.payment_transactions where order_id = ${orderId}::uuid and status = 'captured'), 0)
            - coalesce((select sum(amount) from shop.refunds where order_id = ${orderId}::uuid and status in ('refunded','captured')), 0)
          )::float as v
        `;
        return r.v;
      };

      expect(await refundable()).toBe(50);

      // partial refund 20
      await tx`insert into shop.refunds (order_id, amount, currency, reason, status, refunded_at) values (${orderId}::uuid, 20, 'USD', 'p', 'refunded', now())`;
      await tx`update shop.orders set payment_status = 'partially_refunded', status = 'partially_refunded' where id = ${orderId}::uuid`;
      expect(await refundable()).toBe(30);

      // final refund 30 -> fully refunded
      await tx`insert into shop.refunds (order_id, amount, currency, reason, status, refunded_at) values (${orderId}::uuid, 30, 'USD', 'f', 'refunded', now())`;
      await tx`update shop.orders set payment_status = 'refunded', status = 'refunded' where id = ${orderId}::uuid`;
      expect(await refundable()).toBe(0);

      const [o] = await tx<{ payment_status: string; status: string }[]>`select payment_status, status from shop.orders where id = ${orderId}::uuid`;
      expect(o.payment_status).toBe("refunded");
      expect(o.status).toBe("refunded");

      throw new Error("rollback"); // abort the transaction so nothing persists
    }).catch((e) => {
      if (!(e instanceof Error) || e.message !== "rollback") throw e;
    });
  });

  it("refund restock returns quantities to on_hand with a traceable movement", async () => {
    if (!sql) return;
    await sql
      .begin(async (tx) => {
        const [{ id: pid }] = await tx<{ id: string }[]>`
          insert into shop.products (product_type, status, name_translations, slug, base_currency, base_price)
          values ('simple','active','{"en":"RESTOCK"}'::jsonb, ${"restock-" + Date.now()}, 'USD', 10)
          returning id::text as id
        `;
        const [{ id: iid }] = await tx<{ id: string }[]>`
          insert into shop.inventory (product_id, warehouse_id, on_hand, reserved)
          select ${pid}::uuid, w.id, 3, 0 from shop.warehouses w limit 1
          returning id::text as id
        `;
        const [{ id: oid }] = await tx<{ id: string }[]>`
          insert into shop.orders (order_number, email, currency, status, payment_status, grand_total)
          values (${"RS-" + Date.now()}, 'x@e.com', 'USD', 'paid', 'captured', 20)
          returning id::text as id
        `;
        await tx`
          insert into shop.order_items (order_id, product_id, quantity, currency, unit_price_snapshot, line_total_snapshot, product_name_snapshot)
          values (${oid}::uuid, ${pid}::uuid, 2, 'USD', 10, 20, '{"en":"RESTOCK"}'::jsonb)
        `;

        // restock: +2 back to on_hand, movement type 'return'
        await tx`update shop.inventory set on_hand = on_hand + 2 where id = ${iid}::uuid`;
        await tx`insert into shop.inventory_movements (inventory_id, movement_type, quantity, reference_type, note) values (${iid}::uuid, 'return', 2, 'shop.refund', 'refund restock')`;

        const [inv] = await tx<{ on_hand: number }[]>`select on_hand from shop.inventory where id = ${iid}::uuid`;
        expect(inv.on_hand).toBe(5);
        const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from shop.inventory_movements where inventory_id = ${iid}::uuid and movement_type = 'return'`;
        expect(n).toBe(1);

        throw new Error("rollback");
      })
      .catch((e) => {
        if (!(e instanceof Error) || e.message !== "rollback") throw e;
      });
  });
});
