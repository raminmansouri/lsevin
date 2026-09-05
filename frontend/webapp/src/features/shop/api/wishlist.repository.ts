import "server-only";

import type { ProductCard } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency } from "../lib/pricing";
import { sql } from "../lib/db";
import { searchProducts } from "./catalog.repository";

/**
 * Wishlist (SHP-V02-001, SHP-WL-001/002). Authenticated customers only. A single
 * default wishlist per customer; items are unique per (wishlist, product,
 * variant). Archived / deleted products are simply filtered out of the read
 * model (SHP-WL-002).
 */

async function ensureDefaultWishlist(customerId: string): Promise<string> {
  const existing = await sql<{ id: string }[]>`
    select id::text as id from shop.wishlists where customer_id = ${customerId}::uuid order by create_date asc limit 1
  `;
  if (existing[0]) return existing[0].id;
  const [row] = await sql<{ id: string }[]>`
    insert into shop.wishlists (customer_id, name) values (${customerId}::uuid, 'Default') returning id::text as id
  `;
  return row.id;
}

export async function getWishlistProductIds(): Promise<Set<string>> {
  const ctx = await getShopContext();
  if (!ctx.customerId) return new Set();
  const rows = await sql<{ product_id: string }[]>`
    select wi.product_id::text as product_id
    from shop.wishlist_items wi
    join shop.wishlists w on w.id = wi.wishlist_id
    where w.customer_id = ${ctx.customerId}::uuid
  `;
  return new Set(rows.map((r) => r.product_id));
}

export async function getWishlistView(): Promise<{ items: ProductCard[]; count: number }> {
  const ctx = await getShopContext();
  if (!ctx.customerId) return { items: [], count: 0 };
  const lang = normalizeLocale(ctx.locale);
  const displayCurrency = (await resolveDisplayCurrency(ctx)).currency;

  const rows = await sql<{ slug: string }[]>`
    select p.slug
    from shop.wishlist_items wi
    join shop.wishlists w on w.id = wi.wishlist_id
    join shop.products p on p.id = wi.product_id
    where w.customer_id = ${ctx.customerId}::uuid and p.deleted_at is null and p.status = 'active'
    order by wi.create_date desc
    limit 60
  `;
  if (!rows.length) return { items: [], count: 0 };

  const slugs = rows.map((r) => r.slug);
  const { items } = await searchProducts({ slugs, page: 1, pageSize: 60 }, { locale: lang, displayCurrency });
  const bySlug = new Map(items.map((p) => [p.slug, p]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean) as ProductCard[];
  return { items: ordered.map((p) => ({ ...p, wishlistActive: true })), count: ordered.length };
}

export async function toggleWishlist(input: { productId: string; variantId?: string | null }): Promise<{ active: boolean }> {
  const ctx = await getShopContext();
  if (!ctx.customerId) throw new Error("Sign in to use your wishlist.");
  const wishlistId = await ensureDefaultWishlist(ctx.customerId);

  const existing = await sql<{ id: string }[]>`
    select id::text as id from shop.wishlist_items
    where wishlist_id = ${wishlistId}::uuid and product_id = ${input.productId}::uuid
      and variant_id is not distinct from ${input.variantId ?? null}::uuid
    limit 1
  `;
  if (existing[0]) {
    await sql`delete from shop.wishlist_items where id = ${existing[0].id}::uuid`;
    return { active: false };
  }
  await sql`
    insert into shop.wishlist_items (wishlist_id, product_id, variant_id)
    values (${wishlistId}::uuid, ${input.productId}::uuid, ${input.variantId ?? null}::uuid)
  `;
  return { active: true };
}
