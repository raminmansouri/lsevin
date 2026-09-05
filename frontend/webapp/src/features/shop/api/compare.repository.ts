import "server-only";

import type { ProductCard } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency } from "../lib/pricing";
import { sql } from "../lib/db";
import { searchProducts } from "./catalog.repository";

/**
 * Product comparison (SHP-V02-002, SHP-CMP-001/002). Bounded to
 * {@link MAX_COMPARE} items; one entry per product. Keyed by customer id or the
 * guest cart token.
 */

export const MAX_COMPARE = 4;

async function ensureList(): Promise<{ listId: string; customerId: string | null; guestToken: string | null }> {
  const ctx = await getShopContext();
  const customerId = ctx.customerId;
  const guestToken = customerId ? null : ctx.guestToken || null;
  if (!customerId && !guestToken) throw new Error("No comparison identity.");

  const existing = customerId
    ? await sql<{ id: string }[]>`select id::text as id from shop.compare_lists where customer_id = ${customerId}::uuid order by create_date asc limit 1`
    : await sql<{ id: string }[]>`select id::text as id from shop.compare_lists where guest_token = ${guestToken} order by create_date asc limit 1`;
  if (existing[0]) return { listId: existing[0].id, customerId, guestToken };

  const [row] = await sql<{ id: string }[]>`
    insert into shop.compare_lists (customer_id, guest_token) values (${customerId ?? null}::uuid, ${guestToken})
    returning id::text as id
  `;
  return { listId: row.id, customerId, guestToken };
}

export async function getCompareCount(): Promise<number> {
  const ctx = await getShopContext();
  const customerId = ctx.customerId;
  const guestToken = customerId ? null : ctx.guestToken || null;
  if (!customerId && !guestToken) return 0;
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from shop.compare_list_items i
    join shop.compare_lists l on l.id = i.compare_list_id
    where i.status = 'active'
      and ((${customerId}::uuid is not null and l.customer_id = ${customerId}::uuid)
        or (${guestToken}::text is not null and l.guest_token = ${guestToken}))
  `;
  return row?.n ?? 0;
}

export async function getCompareState(productId: string): Promise<{ inList: boolean; count: number }> {
  const ctx = await getShopContext();
  const customerId = ctx.customerId;
  const guestToken = customerId ? null : ctx.guestToken || null;
  if (!customerId && !guestToken) return { inList: false, count: 0 };
  const [row] = await sql<{ in_list: boolean }[]>`
    select exists(
      select 1 from shop.compare_list_items i
      join shop.compare_lists l on l.id = i.compare_list_id
      where i.status = 'active' and i.product_id = ${productId}::uuid
        and ((${customerId}::uuid is not null and l.customer_id = ${customerId}::uuid)
          or (${guestToken}::text is not null and l.guest_token = ${guestToken}))
    ) as in_list
  `;
  return { inList: Boolean(row?.in_list), count: await getCompareCount() };
}

export async function getCompareView(): Promise<{
  products: Array<ProductCard & { attributes: Array<{ name: string; value: string }> }>;
  max: number;
}> {
  const ctx = await getShopContext();
  const customerId = ctx.customerId;
  const guestToken = customerId ? null : ctx.guestToken || null;
  if (!customerId && !guestToken) return { products: [], max: MAX_COMPARE };
  const lang = normalizeLocale(ctx.locale);
  const displayCurrency = (await resolveDisplayCurrency(ctx)).currency;

  const rows = await sql<{ slug: string; product_id: string }[]>`
    select p.slug, p.id::text as product_id
    from shop.compare_list_items i
    join shop.compare_lists l on l.id = i.compare_list_id
    join shop.products p on p.id = i.product_id
    where i.status = 'active' and p.deleted_at is null and p.status = 'active'
      and ((${customerId}::uuid is not null and l.customer_id = ${customerId}::uuid)
        or (${guestToken}::text is not null and l.guest_token = ${guestToken}))
    order by i.create_date asc
    limit ${MAX_COMPARE}
  `;
  if (!rows.length) return { products: [], max: MAX_COMPARE };

  const slugs = rows.map((r) => r.slug);
  const [{ items }, attrRows] = await Promise.all([
    searchProducts({ slugs, page: 1, pageSize: MAX_COMPARE }, { locale: lang, displayCurrency }),
    sql<{ product_id: string; name: string; value: string }[]>`
      select pa.product_id::text as product_id,
        common.get_translation_t(a.name_translations, ${lang}, 'en') as name,
        string_agg(distinct av.value, ', ') as value
      from shop.product_attributes pa
      join shop.attributes a on a.id = pa.attribute_id
      left join shop.variant_attribute_values vav on vav.attribute_id = a.id
      left join shop.attribute_values av on av.id = vav.attribute_value_id
      where pa.product_id = any(${rows.map((r) => r.product_id)}::uuid[])
      group by pa.product_id, a.id, a.name_translations
    `,
  ]);
  const bySlug = new Map(items.map((p) => [p.slug, p]));
  const attrsByProduct = new Map<string, Array<{ name: string; value: string }>>();
  for (const a of attrRows) {
    if (!a.value) continue;
    const list = attrsByProduct.get(a.product_id) ?? [];
    list.push({ name: a.name, value: a.value });
    attrsByProduct.set(a.product_id, list);
  }

  const products = rows
    .map((r) => {
      const p = bySlug.get(r.slug);
      if (!p) return null;
      return { ...p, attributes: attrsByProduct.get(r.product_id) ?? [] };
    })
    .filter(Boolean) as Array<ProductCard & { attributes: Array<{ name: string; value: string }> }>;

  return { products, max: MAX_COMPARE };
}

export async function toggleCompare(productId: string): Promise<{ inList: boolean; count: number; atMax: boolean }> {
  const { listId } = await ensureList();

  const existing = await sql<{ id: string; status: string }[]>`
    select id::text as id, status::text as status from shop.compare_list_items
    where compare_list_id = ${listId}::uuid and product_id = ${productId}::uuid limit 1
  `;
  if (existing[0]?.status === "active") {
    await sql`update shop.compare_list_items set status = 'removed' where id = ${existing[0].id}::uuid`;
    return { inList: false, count: await getCompareCount(), atMax: false };
  }

  const count = await getCompareCount();
  if (count >= MAX_COMPARE) return { inList: false, count, atMax: true };

  if (existing[0]) {
    await sql`update shop.compare_list_items set status = 'active', create_date = now() where id = ${existing[0].id}::uuid`;
  } else {
    await sql`insert into shop.compare_list_items (compare_list_id, product_id, status) values (${listId}::uuid, ${productId}::uuid, 'active')`;
  }
  return { inList: true, count: count + 1, atMax: false };
}
