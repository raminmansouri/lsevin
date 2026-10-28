import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, type SeoLocale } from "@/lib/seo/alternates";
import { indexableLocalesFromKeys, translatedKeys } from "@/lib/seo/locale-eligibility";

// Request-time metadata avoids requiring database access during image builds.
// Cache the successful public catalog, rather than re-querying it per crawler.
export const dynamic = "force-dynamic";

const ALL_LOCALES: readonly SeoLocale[] = routing.locales;
const PERSIAN_ONLY: readonly SeoLocale[] = [routing.defaultLocale];

// Fully translated UI pages: every locale is a genuine version.
const STATIC_PATHS = [
  "/n/app/mobile/home",
  "/n/app/mobile/categories",
  "/n/app/mobile/explore",
  "/n/app/mobile/shop",
  "/consulting",
  "/privacy-policy",
];

type CatalogEntry = { path: string; locales: readonly SeoLocale[] };
type CatalogRow = { path: string; keys: string[] | null; persian_only: boolean };

const catalogEntries = unstable_cache(
  async (): Promise<CatalogEntry[]> => {
    // One round trip. Entity pages list only the locales whose main text exists
    // (see lib/seo/locale-eligibility); the shop is a Persian storefront.
    const rows = await sql<CatalogRow[]>`
      select '/n/app/mobile/provider/' || sp.id::text as path,
             ${translatedKeys("sp.description_translations")} as keys, false as persian_only
      from category.service_providers sp
      where sp.is_active = true and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/n/app/mobile/service/' || ps.id::text,
             ${translatedKeys("ps.description_translations")}, false
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true and sp.is_active = true
        and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/n/app/mobile/specialist/' || s.id::text,
             ${translatedKeys("s.biography_translations")}, false
      from category.staff s
      where s.is_active = true and exists (
        select 1 from category.provider_staffs psf
        join category.service_providers sp on sp.id = psf.service_provider_id
        where psf.staff_id = s.id and psf.is_active = true and sp.is_active = true
      )
      union all
      select '/n/app/mobile/shop/product/' || p.slug, null, true
      from shop.products p
      where p.deleted_at is null and p.status = 'active' and p.slug is not null and p.slug <> ''
      union all
      select '/n/app/mobile/shop/category/' || c.slug, null, true
      from shop.categories c
      where c.deleted_at is null and c.is_active = true and c.slug is not null and c.slug <> ''
      order by path
    `;
    return rows.map((row) => ({
      path: row.path,
      locales: row.persian_only ? PERSIAN_ONLY : indexableLocalesFromKeys(row.keys),
    }));
  },
  ["public-sitemap-catalog-v3"],
  { revalidate: 300, tags: ["sitemap-catalog"] }
);

const guideEntries = (): (CatalogEntry & { lastModified: string })[] =>
  allGuides().map((guide) => ({
    path: guidePath(guide.slug),
    locales: guideLocales(guide),
    lastModified: guide.reviewedAt,
  }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let catalog: CatalogEntry[];
  try {
    catalog = await catalogEntries();
  } catch {
    // Outside the cache: an outage must never cache an empty catalog.
    console.error(
      "[seo] Sitemap catalog unavailable; serving public static paths."
    );
    catalog = [];
  }

  const entries: (CatalogEntry & { lastModified?: string })[] = [
    ...STATIC_PATHS.map((path) => ({ path, locales: ALL_LOCALES })),
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
