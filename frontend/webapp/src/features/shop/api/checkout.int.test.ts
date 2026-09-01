import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

/**
 * Database-level integration tests for the two checkout invariants that must not
 * regress (SHP-NFR-003 oversell, SHP-CHK-007 idempotency). They exercise the
 * exact SQL shapes `placeOrder()` uses, against the real local schema, and roll
 * everything back.
 */

const url = process.env.ACCOUNTING_TEST_DATABASE_URL || process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);

const sql = LOCAL ? postgres(url as string, { max: 4, prepare: false }) : null;

afterAll(async () => {
  await sql?.end({ timeout: 5 });
});

const d = LOCAL ? describe : describe.skip;

d("checkout stock reservation", () => {
  it("conditional reserve UPDATE lets exactly one of two concurrent final-unit checkouts win", async () => {
    if (!sql) return;
    // fresh product + inventory row with a single unit
    const [{ pid }] = await sql<{ pid: string }[]>`
      insert into shop.products (product_type, status, name_translations, slug, base_currency, base_price, published_at)
      values ('simple','active','{"en":"CONCURRENCY TEST"}'::jsonb, ${"concurrency-test-" + Date.now()}, 'USD', 10, now())
      returning id::text as pid
    `;
    const [{ iid }] = await sql<{ iid: string }[]>`
      insert into shop.inventory (product_id, warehouse_id, on_hand, reserved)
      select ${pid}::uuid, w.id, 1, 0 from shop.warehouses w limit 1
      returning id::text as iid
    `;

    const reserve = () =>
      sql`
        update shop.inventory
        set reserved = reserved + 1
        where id = ${iid}::uuid and (on_hand - reserved) >= 1
        returning id
      `;

    const [a, b] = await Promise.all([reserve(), reserve()]);
    const winners = [a.count, b.count].filter((c) => c === 1).length;
    expect(winners).toBe(1); // never oversold

    const [inv] = await sql<{ on_hand: number; reserved: number }[]>`
      select on_hand, reserved from shop.inventory where id = ${iid}::uuid
    `;
    expect(inv.reserved).toBe(1);
    expect(inv.reserved).toBeLessThanOrEqual(inv.on_hand);

    // cleanup
    await sql`delete from shop.inventory where id = ${iid}::uuid`;
    await sql`delete from shop.products where id = ${pid}::uuid`;
  });

  it("the reserved<=on_hand CHECK constraint blocks an over-reservation", async () => {
    if (!sql) return;
    const [{ pid }] = await sql<{ pid: string }[]>`
      insert into shop.products (product_type, status, name_translations, slug, base_currency, base_price)
      values ('simple','active','{"en":"CHECK TEST"}'::jsonb, ${"check-test-" + Date.now()}, 'USD', 10)
      returning id::text as pid
    `;
    const [{ iid }] = await sql<{ iid: string }[]>`
      insert into shop.inventory (product_id, warehouse_id, on_hand, reserved)
      select ${pid}::uuid, w.id, 2, 0 from shop.warehouses w limit 1
      returning id::text as iid
    `;
    await expect(
      sql`update shop.inventory set reserved = reserved + 5 where id = ${iid}::uuid`
    ).rejects.toThrow(/ck_shop_inventory_reserved_le_on_hand/);

    await sql`delete from shop.inventory where id = ${iid}::uuid`;
    await sql`delete from shop.products where id = ${pid}::uuid`;
  });
});

d("checkout idempotency", () => {
  it("a duplicate (scope, idempotency_key) is rejected by the unique constraint", async () => {
    if (!sql) return;
    const key = "itest-" + Date.now();
    await sql`
      insert into shop.checkout_intents (idempotency_key, scope_kind, scope_id, status)
      values (${key}, 'guest', 'itest-scope', 'started')
    `;
    await expect(
      sql`
        insert into shop.checkout_intents (idempotency_key, scope_kind, scope_id, status)
        values (${key}, 'guest', 'itest-scope', 'started')
      `
    ).rejects.toThrow(/uq_shop_checkout_intents_key|duplicate key/);

    await sql`delete from shop.checkout_intents where idempotency_key = ${key}`;
  });

  it("orders.idempotency_key is globally unique", async () => {
    if (!sql) return;
    const key = "otest-" + Date.now();
    const mk = (n: string) => sql`
      insert into shop.orders (order_number, email, currency, idempotency_key)
      values (${n}, 'x@example.com', 'USD', ${key})
    `;
    await mk("OTEST-" + Date.now() + "-A");
    await expect(mk("OTEST-" + Date.now() + "-B")).rejects.toThrow(/uq_shop_orders_idempotency_key|duplicate key/);
    await sql`delete from shop.orders where idempotency_key = ${key}`;
  });
});
