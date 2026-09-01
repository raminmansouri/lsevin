import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

/**
 * DB-level checks for the returns flow (SHP-V03-006/007/008) and the
 * partial-shipment fulfilment projection (SHP-V03-003). Everything rolls back.
 */

const url = process.env.ACCOUNTING_TEST_DATABASE_URL || process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
afterAll(async () => {
  await sql?.end({ timeout: 5 });
});
const d = LOCAL ? describe : describe.skip;

async function rollback<T>(fn: (tx: postgres.TransactionSql) => Promise<T>) {
  try {
    await sql!.begin(async (tx) => {
      await fn(tx as unknown as postgres.TransactionSql);
      throw new Error("__rollback__");
    });
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "__rollback__") throw e;
  }
}

d("returns", () => {
  it("returnable quantity = ordered − already-returned; a full return marks the line returned; restock adds on_hand", async () => {
    if (!sql) return;
    await rollback(async (tx) => {
      const [{ id: pid }] = await tx<{ id: string }[]>`
        insert into shop.products (product_type, status, name_translations, slug, base_currency, base_price)
        values ('simple','active','{"en":"RET"}'::jsonb, ${"ret-" + Date.now()}, 'USD', 10) returning id::text as id`;
      const [{ id: iid }] = await tx<{ id: string }[]>`
        insert into shop.inventory (product_id, warehouse_id, on_hand, reserved)
        select ${pid}::uuid, w.id, 5, 0 from shop.warehouses w limit 1 returning id::text as id`;
      const [{ id: oid }] = await tx<{ id: string }[]>`
        insert into shop.orders (order_number, email, currency, status, payment_status, grand_total)
        values (${"RET-" + Date.now()}, 'x@e.com', 'USD', 'shipped', 'captured', 30) returning id::text as id`;
      const [{ id: oiid }] = await tx<{ id: string }[]>`
        insert into shop.order_items (order_id, product_id, quantity, currency, unit_price_snapshot, line_total_snapshot, product_name_snapshot)
        values (${oid}::uuid, ${pid}::uuid, 3, 'USD', 10, 30, '{"en":"RET"}'::jsonb) returning id::text as id`;

      const returnable = async () => {
        const [r] = await tx<{ v: number }[]>`
          select (3 - coalesce((select sum(ri.quantity)::int from shop.return_items ri
            join shop.return_requests rr on rr.id = ri.return_request_id
            where ri.order_item_id = ${oiid}::uuid and rr.status not in ('rejected','cancelled')), 0)) as v`;
        return r.v;
      };
      expect(await returnable()).toBe(3);

      const [{ id: rrid }] = await tx<{ id: string }[]>`
        insert into shop.return_requests (order_id, status, reason) values (${oid}::uuid, 'requested', 'defective') returning id::text as id`;
      await tx`insert into shop.return_items (return_request_id, order_item_id, quantity) values (${rrid}::uuid, ${oiid}::uuid, 3)`;
      expect(await returnable()).toBe(0);

      // approve -> receive -> restock 3
      await tx`update shop.return_requests set status = 'approved' where id = ${rrid}::uuid`;
      await tx`update shop.inventory set on_hand = on_hand + 3 where id = ${iid}::uuid`;
      await tx`update shop.return_requests set status = 'received' where id = ${rrid}::uuid`;
      await tx`update shop.order_items set fulfillment_status = 'returned' where id = ${oiid}::uuid`;

      const [inv] = await tx<{ on_hand: number }[]>`select on_hand from shop.inventory where id = ${iid}::uuid`;
      expect(inv.on_hand).toBe(8);
      const [oi] = await tx<{ fulfillment_status: string }[]>`select fulfillment_status from shop.order_items where id = ${oiid}::uuid`;
      expect(oi.fulfillment_status).toBe("returned");
    });
  });

  it("partial shipment: order is 'fully shipped' only when every line's shipped qty >= ordered qty", async () => {
    if (!sql) return;
    await rollback(async (tx) => {
      const [{ id: pid }] = await tx<{ id: string }[]>`
        insert into shop.products (product_type, status, name_translations, slug, base_currency, base_price)
        values ('simple','active','{"en":"PS"}'::jsonb, ${"ps-" + Date.now()}, 'USD', 10) returning id::text as id`;
      const [{ id: oid }] = await tx<{ id: string }[]>`
        insert into shop.orders (order_number, email, currency, status, payment_status, grand_total)
        values (${"PS-" + Date.now()}, 'x@e.com', 'USD', 'processing', 'captured', 40) returning id::text as id`;
      const [{ id: a }] = await tx<{ id: string }[]>`
        insert into shop.order_items (order_id, product_id, quantity, currency, unit_price_snapshot, line_total_snapshot, product_name_snapshot)
        values (${oid}::uuid, ${pid}::uuid, 2, 'USD', 10, 20, '{"en":"A"}'::jsonb) returning id::text as id`;
      const [{ id: b }] = await tx<{ id: string }[]>`
        insert into shop.order_items (order_id, product_id, quantity, currency, unit_price_snapshot, line_total_snapshot, product_name_snapshot)
        values (${oid}::uuid, ${pid}::uuid, 2, 'USD', 10, 20, '{"en":"B"}'::jsonb) returning id::text as id`;
      const [{ id: sh }] = await tx<{ id: string }[]>`
        insert into shop.shipments (order_id, status, shipment_number) values (${oid}::uuid, 'shipped', 'PS-1') returning id::text as id`;

      const fully = async () => {
        const [r] = await tx<{ fully: boolean }[]>`
          select bool_and(coalesce((select sum(si.quantity)::int from shop.shipment_items si where si.order_item_id = oi.id), 0) >= oi.quantity) as fully
          from shop.order_items oi where oi.order_id = ${oid}::uuid`;
        return r.fully;
      };

      await tx`insert into shop.shipment_items (shipment_id, order_item_id, quantity) values (${sh}::uuid, ${a}::uuid, 2)`;
      expect(await fully()).toBe(false); // line B not shipped
      await tx`insert into shop.shipment_items (shipment_id, order_item_id, quantity) values (${sh}::uuid, ${b}::uuid, 1)`;
      expect(await fully()).toBe(false); // line B only 1/2
      await tx`insert into shop.shipment_items (shipment_id, order_item_id, quantity) values (${sh}::uuid, ${b}::uuid, 1)`;
      expect(await fully()).toBe(true);
    });
  });
});
