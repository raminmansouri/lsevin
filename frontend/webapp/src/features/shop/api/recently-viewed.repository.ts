import "server-only";

import type { ProductCard } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency } from "../lib/pricing";
import { sql } from "../lib/db";
import { searchProducts } from "./catalog.repository";

/**
 * Recently viewed products (SHP-V02-003). Keyed by customer id when signed in,
 * otherwise by the guest cart token. Dedup on (actor, product); the newest view
 * wins. Safe to call from a Server Component render (it is a fast upsert).
 */

const KEEP = 20;

export async function recordRecentlyViewed(productId: string): Promise<void> {
  try {
    const ctx = await getShopContext();
    const customerId = ctx.customerId;
    const guestToken = customerId ? null : ctx.guestToken || null;
    if (!customerId && !guestToken) return;

    await sql`
      delete from shop.recently_viewed_products
      where product_id = ${productId}::uuid
        and ((${customerId}::uuid is not null and customer_id = ${customerId}::uuid)
          or (${guestToken}::text is not null and guest_token = ${guestToken}))
    `;
    await sql`
      insert into shop.recently_viewed_products (customer_id, guest_token, product_id, viewed_at)
      values (${customerId ?? null}::uuid, ${guestToken}, ${productId}::uuid, now())
    `;
    // trim to KEEP most recent for this actor
    await sql`
      delete from shop.recently_viewed_products r
      where r.id in (
        select id from shop.recently_viewed_products
        where (${customerId}::uuid is not null and customer_id = ${customerId}::uuid)
           or (${guestToken}::text is not null and guest_token = ${guestToken})
        order by viewed_at desc offset ${KEEP}
      )
    `;
  } catch {
    // never let a telemetry-ish write break the product page
  }
}

export async function getRecentlyViewed(excludeSlug?: string, limit = 12): Promise<ProductCard[]> {
  const ctx = await getShopContext();
  const customerId = ctx.customerId;
  const guestToken = customerId ? null : ctx.guestToken || null;
  if (!customerId && !guestToken) return [];
  const lang = normalizeLocale(ctx.locale);
  const displayCurrency = (await resolveDisplayCurrency(ctx)).currency;

  const rows = await sql<{ slug: string }[]>`
    select p.slug
    from shop.recently_viewed_products r
    join shop.products p on p.id = r.product_id
    where ((${customerId}::uuid is not null and r.customer_id = ${customerId}::uuid)
        or (${guestToken}::text is not null and r.guest_token = ${guestToken}))
      and p.deleted_at is null and p.status = 'active'
      and (${excludeSlug ?? null}::text is null or p.slug <> ${excludeSlug ?? null})
    order by r.viewed_at desc
    limit ${limit}
  `;
  if (!rows.length) return [];
  const slugs = rows.map((r) => r.slug);
  const { items } = await searchProducts({ slugs, page: 1, pageSize: limit }, { locale: lang, displayCurrency });
  const bySlug = new Map(items.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as ProductCard[];
}
