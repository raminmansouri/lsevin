import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { categoryProviderCountsCte } from "@/features/categories/db/category-tree";
import {
  categoryBrowserHref,
  categoryProvidersHref,
  isTourismCategory,
} from "@/features/categories/utils/category-href";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { getPublishedSitePageIndex } from "@/features/site-content/server/repository";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, type SeoLocale } from "@/lib/seo/alternates";
import {
  INDEXABLE_CATEGORY_LOCALES,
  INDEXABLE_SHOP_LOCALES,
  indexableLocalesFromKeys,
  translatedKeys,
} from "@/lib/seo/locale-eligibility";

// Request-time metadata avoids requiring database access during image builds.
// Cache the successful public catalog, rather than re-querying it per crawler.
export const dynamic = "force-dynamic";

const ALL_LOCALES: readonly SeoLocale[] = routing.locales;
const PERSIAN_ONLY: readonly SeoLocale[] = [routing.defaultLocale];

// Fully translated UI pages: every locale is a genuine version.
type CatalogEntry = { path: string; locales: readonly SeoLocale[] };
type CatalogRow = { path: string; keys: string[] | null; persian_only: boolean };

const STATIC_PATHS: CatalogEntry[] = [
  { path: "", locales: ALL_LOCALES },
  { path: "/categories", locales: INDEXABLE_CATEGORY_LOCALES },
  { path: "/explore", locales: ALL_LOCALES },
  { path: "/shop", locales: INDEXABLE_SHOP_LOCALES },
  { path: "/offers", locales: PERSIAN_ONLY },
  { path: "/featured", locales: PERSIAN_ONLY },
  { path: "/packages", locales: PERSIAN_ONLY },
  { path: "/providers", locales: ALL_LOCALES },
  { path: "/consulting", locales: ALL_LOCALES },
  { path: "/privacy-policy", locales: ALL_LOCALES },
];

const catalogEntries = unstable_cache(
  async (): Promise<CatalogEntry[]> => {
    // One round trip. Entity pages list only the locales whose main text exists
    // (see lib/seo/locale-eligibility); the shop is a Persian storefront.
    const rows = await sql<CatalogRow[]>`
      select '/providers/' || sp.slug as path,
             ${translatedKeys("sp.description_translations")} as keys, false as persian_only
      from category.service_providers sp
      where sp.is_active = true and sp.slug is not null
        and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/services/' || ps.slug,
             ${translatedKeys("ps.description_translations")}, false
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true and ps.slug is not null and sp.is_active = true
        and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/specialists/' || s.slug,
             ${translatedKeys("s.biography_translations")}, false
      from category.staff s
      where s.is_active = true and s.slug is not null and exists (
        select 1 from category.provider_staffs psf
        join category.service_providers sp on sp.id = psf.service_provider_id
        where psf.staff_id = s.id and psf.is_active = true and sp.is_active = true
      )
      union all
      select '/specialties/' || pt.slug,
             ${translatedKeys("pt.name_translations")}, false
      from category.provider_types pt
      where pt.is_active = true and pt.slug is not null
        and category.provider_type_is_public(pt.id)
      union all
      select '/products/' || p.slug, null, true
      from shop.products p
      where p.deleted_at is null and p.status = 'active' and p.slug is not null and p.slug <> ''
      union all
      select '/shop/' || c.slug, null, true
      from shop.categories c
      where c.deleted_at is null and c.is_active = true and c.slug is not null and c.slug <> ''
      union all
      select '/packages/' || p.slug, null, true
      from marketing.special_packages p
      where p.is_active = true and p.slug is not null
        and nullif(btrim(p.title_translations ->> 'fa-IR'), '') is not null
      order by path
    `;
    return rows.map((row) => ({
      path: row.path,
      locales: row.persian_only
        ? PERSIAN_ONLY
        : row.path.startsWith("/specialties/")
          ? // Specialty landings are directory pages, indexed like category landings.
            indexableLocalesFromKeys(row.keys).filter((locale) => INDEXABLE_CATEGORY_LOCALES.includes(locale))
          : indexableLocalesFromKeys(row.keys),
    }));
  },
  ["public-sitemap-catalog-v6"],
  { revalidate: 300, tags: ["sitemap-catalog"] }
);

// Category pages (migration 0095): a category with subcategories has its browser
// page, and any category with providers has its provider list. Tourism and its
// subtree open the Tours app instead, so they are left out.
const categoryEntries = unstable_cache(
  async (): Promise<CatalogEntry[]> => {
    const [rows, tourismCategoryId] = await Promise.all([
      sql<{ id: string; parentId: string | null; slug: string; childCount: number; providerCount: number }[]>`
        with recursive ${categoryProviderCountsCte()}
        select c.id::text as id, c.parent_id::text as "parentId", c.slug,
               coalesce(cc.child_count, 0) as "childCount",
               coalesce(pc.provider_count, 0) as "providerCount"
        from category.categories c
        left join category_provider_counts pc on pc.category_id = c.id
        left join category_child_counts cc on cc.category_id = c.id
        where c.is_active = true and c.slug is not null
        order by c.slug
      `,
      getTourSettings().then((settings) => settings.tourismCategoryId).catch(() => null),
    ]);
    const parentOf = new Map(rows.map((row) => [row.id, row.parentId]));
    return rows
      .filter((row) => row.providerCount > 0)
      .filter((row) => !isTourismCategory(row.id, (id) => parentOf.get(id), tourismCategoryId))
      .flatMap((row) => [
        ...(row.childCount > 0 ? [{ path: categoryBrowserHref(row), locales: INDEXABLE_CATEGORY_LOCALES }] : []),
        { path: categoryProvidersHref(row), locales: INDEXABLE_CATEGORY_LOCALES },
      ]);
  },
  ["public-sitemap-categories-v1"],
  { revalidate: 300, tags: ["sitemap-catalog"] }
);

const guideEntries = (): (CatalogEntry & { lastModified: string })[] =>
  allGuides().map((guide) => ({
    path: guidePath(guide.slug),
    locales: guideLocales(guide),
    lastModified: guide.reviewedAt,
  }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each part on its own: an outage in one must never cache an empty catalog,
  // nor drop the other part from the sitemap.
  const unavailable = (part: string) => (): CatalogEntry[] => {
    console.error(`[seo] Sitemap ${part} unavailable; serving the rest.`);
    return [];
  };
  const [entities, categories] = await Promise.all([
    catalogEntries().catch(unavailable("catalog")),
    categoryEntries().catch(unavailable("categories")),
  ]);
  const catalog = [...entities, ...categories];

  // Editorial pages (admin → Editorial) list only their translated locales; first
  // so a published /privacy-policy replaces the built-in all-locale entry.
  const sitePages = (await getPublishedSitePageIndex()).map((page) => ({
    path: `/${page.slug}`,
    locales: page.locales,
    ...(page.updatedAt ? { lastModified: page.updatedAt } : {}),
  }));

  const entries: (CatalogEntry & { lastModified?: string })[] = [
    ...sitePages,
    ...STATIC_PATHS,
    ...guideEntries(),
    ...catalog,
  ];
  const seen = new Set<string>();
  const unique = entries.filter((entry) => !seen.has(entry.path) && seen.add(entry.path));

  const total = unique.reduce((sum, entry) => sum + entry.locales.length, 0);
  if (total > 50_000) {
    throw new Error("Catalog requires sharded sitemaps (50,000 URL limit).");
  }

  return unique.flatMap((entry) => {
    // Reciprocal hreflang among the indexable versions only; a lone version
    // needs no alternates.
    const languages =
      entry.locales.length > 1 ? languageAlternates(entry.path, entry.locales) : undefined;
    return entry.locales.map((locale) => ({
      url: absoluteUrl(locale, entry.path),
      ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
      changeFrequency: "weekly" as const,
      ...(languages ? { alternates: { languages } } : {}),
    }));
  });
}
