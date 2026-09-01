import "server-only";

import type { ProductCard } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency } from "../lib/pricing";
import { sql } from "../lib/db";
import { searchProducts } from "./catalog.repository";

/**
 * The Shop-owned contract for "products related to an LSevin service definition"
 * (SHP-V02-007, SHP-REL-002/004/008, SHP-API-005/027). Other modules (a service
 * booking page, a care-journey step) call *this* — they never query
 * `shop.product_service_links` / `shop.category_service_links` directly.
 *
 * The read model returns priced product cards plus a localized service summary
 * so a caller needs no follow-up round trips (SHP-REL-008).
 */

export type ServiceRelationType =
  | "general"
  | "recommended_before"
  | "recommended_after"
  | "compatible"
  | "required"
  | "optional_addon";

export type ServiceRelatedProducts = {
  serviceDefinitionId: string;
  serviceName: string;
  byRelation: Array<{ relationType: ServiceRelationType; products: ProductCard[] }>;
  flat: ProductCard[];
};

const RELATION_ORDER: ServiceRelationType[] = [
  "required",
  "recommended_before",
  "recommended_after",
  "optional_addon",
  "compatible",
  "general",
];

export async function getProductsForService(
  serviceDefinitionId: string,
  opts?: { relationType?: ServiceRelationType; limit?: number; locale?: string; displayCurrency?: string },
): Promise<ServiceRelatedProducts> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(opts?.locale ?? ctx.locale);
  const displayCurrency = opts?.displayCurrency ?? (await resolveDisplayCurrency(ctx)).currency;
  const limit = Math.min(40, Math.max(1, opts?.limit ?? 24));

  const links = await sql<{ slug: string; relation_type: ServiceRelationType }[]>`
    select p.slug, psl.relation_type
    from shop.product_service_links psl
    join shop.products p on p.id = psl.product_id
    where psl.service_definition_id = ${serviceDefinitionId}::uuid
      and psl.is_active = true
      and p.deleted_at is null and p.status = 'active'
      and (${opts?.relationType ?? null}::text is null or psl.relation_type = ${opts?.relationType ?? null})
    order by psl.display_order asc, psl.create_date asc
    limit ${limit}
  `;
  const [svc] = await sql<{ name: string }[]>`
    select coalesce(common.get_translation_t(name_translations, ${lang}, 'en'), '') as name
    from category.service_definitions where id = ${serviceDefinitionId}::uuid
  `;

  if (!links.length) {
    return { serviceDefinitionId, serviceName: svc?.name ?? "", byRelation: [], flat: [] };
  }

  const slugs = Array.from(new Set(links.map((l) => l.slug)));
  const { items } = await searchProducts({ slugs, page: 1, pageSize: limit }, { locale: lang, displayCurrency });
  const bySlug = new Map(items.map((p) => [p.slug, p]));

  const groups = new Map<ServiceRelationType, ProductCard[]>();
  for (const l of links) {
    const p = bySlug.get(l.slug);
    if (!p) continue;
    const g = groups.get(l.relation_type) ?? [];
    if (!g.some((x) => x.id === p.id)) g.push(p);
    groups.set(l.relation_type, g);
  }

  const byRelation = RELATION_ORDER.filter((r) => groups.has(r)).map((relationType) => ({
    relationType,
    products: groups.get(relationType)!,
  }));

  const seen = new Set<string>();
  const flat: ProductCard[] = [];
  for (const l of links) {
    const p = bySlug.get(l.slug);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      flat.push(p);
    }
  }

  return { serviceDefinitionId, serviceName: svc?.name ?? "", byRelation, flat };
}

/** Curated product discovery from a Shop-category ↔ service link (SHP-V02-009). */
export async function getProductsForServiceViaCategory(
  serviceDefinitionId: string,
  opts?: { limit?: number; locale?: string; displayCurrency?: string },
): Promise<ProductCard[]> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(opts?.locale ?? ctx.locale);
  const displayCurrency = opts?.displayCurrency ?? (await resolveDisplayCurrency(ctx)).currency;
  const limit = Math.min(40, Math.max(1, opts?.limit ?? 24));

  const rows = await sql<{ slug: string }[]>`
    select distinct p.slug
    from shop.category_service_links csl
    join shop.product_categories pc on pc.category_id = csl.shop_category_id
    join shop.products p on p.id = pc.product_id
    where csl.service_definition_id = ${serviceDefinitionId}::uuid and csl.is_active = true
      and p.deleted_at is null and p.status = 'active'
    limit ${limit}
  `;
  if (!rows.length) return [];
  const { items } = await searchProducts(
    { slugs: rows.map((r) => r.slug), page: 1, pageSize: limit },
    { locale: lang, displayCurrency },
  );
  return items;
}
