import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import db from "@/config/database/db";

import {
  getOrCreateActiveCart,
  mergeGuestCartIntoCustomer,
} from "./cart.repository";

const request = vi.hoisted(() => ({
  customerId: null as string | null,
  guestToken: "",
}));
vi.mock("../lib/context", () => ({
  getShopContext: async () => request,
  normalizeLocale: () => "en",
}));
vi.mock("../lib/pricing", () => ({
  resolveDisplayCurrency: vi.fn(),
  resolvePrices: vi.fn(),
}));

const local = new URL(process.env.DATABASE_URL!).hostname;
const sql = postgres(process.env.DATABASE_URL!, { max: 4, prepare: false });
const ids = {
  customer: randomUUID(),
  product: randomUUID(),
  guest: randomUUID(),
  target: randomUUID(),
};
const token = `cart-merge-test-${randomUUID()}`;

describe.skipIf(!["localhost", "127.0.0.1"].includes(local))(
  "guest cart adoption with real PostgreSQL",
  () => {
    beforeEach(async () => {
      await sql`delete from shop.cart_items where cart_id in (${ids.guest}::uuid, ${ids.target}::uuid)`;
      await sql`delete from shop.carts where id in (${ids.guest}::uuid, ${ids.target}::uuid)`;
      await sql`insert into customer.customers (id, email, phone_number, phone_number_country_code, first_name, last_name, is_active)
      values (${ids.customer}::uuid, ${token + "@example.invalid"}, ${ids.customer.slice(0, 15)}, 'IR', 'Cart', 'Test', true)
      on conflict (id) do nothing`;
      await sql`insert into shop.products (id, product_type, status, slug, name_translations, base_currency, base_price)
      values (${ids.product}::uuid, 'simple', 'active', ${token}, '{"en":"Cart merge test"}'::jsonb, 'IRR', 1000000)
      on conflict (id) do nothing`;
      await sql`insert into shop.carts (id, guest_token, currency, status) values (${ids.guest}::uuid, ${token}, 'IRR', 'active')`;
      await sql`insert into shop.cart_items (cart_id, product_id, quantity, unit_price, currency, item_snapshot)
      values (${ids.guest}::uuid, ${ids.product}::uuid, 2, 1000000, 'IRR', '{"test":true}'::jsonb)`;
      request.customerId = ids.customer;
      request.guestToken = token;
    });

    it("adopts a guest cart on the first authenticated read", async () => {
      expect(await getOrCreateActiveCart()).toBe(ids.guest);
      const [cart] =
        await sql`select customer_id, guest_token from shop.carts where id = ${ids.guest}::uuid`;
      expect(cart.customer_id).toBe(ids.customer);
      expect(cart.guest_token).toBeNull();
    });

    it("merges guest items when the customer already has a cart, once under concurrent reads", async () => {
      await sql`insert into shop.carts (id, customer_id, currency, status) values (${ids.target}::uuid, ${ids.customer}::uuid, 'IRR', 'active')`;
      await sql`insert into shop.cart_items (cart_id, product_id, quantity, unit_price, currency)
      values (${ids.target}::uuid, ${ids.product}::uuid, 3, 1000000, 'IRR')`;
      expect(
        await Promise.all([getOrCreateActiveCart(), getOrCreateActiveCart()])
      ).toEqual([ids.target, ids.target]);
      await mergeGuestCartIntoCustomer(token, ids.customer);
      const rows =
        await sql`select quantity from shop.cart_items where cart_id = ${ids.target}::uuid`;
      expect(rows).toHaveLength(1);
      expect(rows[0].quantity).toBe(5);
    });

    it("preserves a distinct saved-for-later line and its JSON snapshot", async () => {
      await sql`insert into shop.carts (id, customer_id, currency, status) values (${ids.target}::uuid, ${ids.customer}::uuid, 'IRR', 'active')`;
      await sql`update shop.cart_items set saved_for_later = true where cart_id = ${ids.guest}::uuid`;
      await mergeGuestCartIntoCustomer(token, ids.customer);
      const [line] =
        await sql`select quantity, saved_for_later, item_snapshot from shop.cart_items where cart_id = ${ids.target}::uuid`;
      expect(line).toMatchObject({
        quantity: 2,
        saved_for_later: true,
        item_snapshot: { test: true },
      });
    });

    it("cannot transfer an already adopted cart to another customer", async () => {
      await mergeGuestCartIntoCustomer(token, ids.customer);
      await mergeGuestCartIntoCustomer(token, randomUUID());
      const [cart] =
        await sql`select customer_id from shop.carts where id = ${ids.guest}::uuid`;
      expect(cart.customer_id).toBe(ids.customer);
    });
  }
);

afterAll(async () => {
  await sql`delete from shop.cart_items where cart_id in (${ids.guest}::uuid, ${ids.target}::uuid)`;
  await sql`delete from shop.carts where id in (${ids.guest}::uuid, ${ids.target}::uuid)`;
  await sql`delete from shop.products where id = ${ids.product}::uuid`;
  await sql`delete from customer.customers where id = ${ids.customer}::uuid`;
  await Promise.all([sql.end({ timeout: 3 }), db.end({ timeout: 3 })]);
});
