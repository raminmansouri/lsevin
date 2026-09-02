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
  | "recommended_during"
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
  "recommended_during",
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

/**
 * Same as `getProductsForService` but aggregated across several service
 * definitions — the read model behind a provider page or a specialist page,
 * where a booking covers many services (SHP-V02-007). Products are deduped and
 * the group order is preserved.
 */
export async function getProductsForServices(
  serviceDefinitionIds: string[],
  opts?: { limit?: number; locale?: string; displayCurrency?: string },
): Promise<{ byRelation: Array<{ relationType: ServiceRelationType; products: ProductCard[] }>; flat: ProductCard[] }> {
  const ids = Array.from(new Set((serviceDefinitionIds ?? []).filter((v) => /^[0-9a-fA-F-]{36}$/.test(v))));
  if (!ids.length) return { byRelation: [], flat: [] };

  const ctx = await getShopContext();
  const lang = normalizeLocale(opts?.locale ?? ctx.locale);
  const displayCurrency = opts?.displayCurrency ?? (await resolveDisplayCurrency(ctx)).currency;
  const limit = Math.min(60, Math.max(1, opts?.limit ?? 30));

  const links = await sql<{ slug: string; relation_type: ServiceRelationType }[]>`
    select distinct on (p.slug, psl.relation_type) p.slug, psl.relation_type
    from shop.product_service_links psl
    join shop.products p on p.id = psl.product_id
    where psl.service_definition_id = any(${ids}::uuid[])
      and psl.is_active = true
      and p.deleted_at is null and p.status = 'active'
    order by p.slug, psl.relation_type, psl.display_order asc
    limit ${limit}
  `;
  if (!links.length) return { byRelation: [], flat: [] };

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
  for (const g of byRelation) for (const p of g.products) if (!seen.has(p.id)) { seen.add(p.id); flat.push(p); }
  return { byRelation, flat };
}

/** Products recommended around every service a provider offers (SHP-V02-007). */
export async function getProductsForProvider(
  serviceProviderId: string,
  opts?: { limit?: number; locale?: string; displayCurrency?: string },
) {
  if (!/^[0-9a-fA-F-]{36}$/.test(serviceProviderId)) return { byRelation: [], flat: [] };
  const rows = await sql<{ id: string }[]>`
    select distinct service_definition_id::text as id
    from category.provider_services
    where service_provider_id = ${serviceProviderId}::uuid and is_active = true
  `;
  return getProductsForServices(rows.map((r) => r.id), opts);
}

/** Products recommended around every service a staff member (doctor) offers. */
export async function getProductsForStaff(
  staffId: string,
  opts?: { limit?: number; locale?: string; displayCurrency?: string },
) {
  if (!/^[0-9a-fA-F-]{36}$/.test(staffId)) return { byRelation: [], flat: [] };
  const rows = await sql<{ id: string }[]>`
    select distinct service_definition_id::text as id
    from category.staff_services
    where staff_id = ${staffId}::uuid and is_active = true
  `;
  return getProductsForServices(rows.map((r) => r.id), opts);
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
