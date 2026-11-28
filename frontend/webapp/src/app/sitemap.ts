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
import { listTourSitemapEntries } from "@/features/tours/server/platform/seo";
import { propertyLocales, STAY_INDEXABLE_LOCALES } from "@/features/stays/domain/seo-locales";
import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { getPublishedPostIndex } from "@/features/blog/server/repository";
import { getPublishedSitePageIndex } from "@/features/site-content/server/repository";
import { landingPagesEnabled, listLandingPages } from "@/features/search/server/landing";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, type SeoLocale } from "@/lib/seo/alternates";
import { publicMediaUrl } from "@/lib/seo/media-url";
import { shopImageSrc } from "@/features/shop/lib/image";
import {
  INDEXABLE_CATEGORY_LOCALES,
  INDEXABLE_CONSULTATION_LOCALES,
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
type CatalogEntry = { path: string; locales: readonly SeoLocale[]; images?: string[] };
type CatalogRow = { path: string; keys: string[] | null; persian_only: boolean; images: string[] | null };

// A stored media reference is a storage key, a media-library id or a URL; ids
// resolve to their file. Google Images: an image sitemap lists the images of
// each page (up to 1,000; we list the page's main photos).
const MEDIA_ID = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
const resolvedMedia = (column: string) =>
  sql.unsafe(`coalesce((select ml.file_url from media.media_library ml where ${column} ~* '${MEDIA_ID}' and ml.id = ${column}::uuid), nullif(btrim(${column}), ''))`);
const SITEMAP_IMAGES_PER_PAGE = 5;

function sitemapImages(path: string, images: string[] | null): string[] {
  const urls = (images ?? [])
    .map((src) => publicMediaUrl(path.startsWith("/products/") ? shopImageSrc(src) : src))
    .filter((url): url is string => Boolean(url));
  return [...new Set(urls)].slice(0, SITEMAP_IMAGES_PER_PAGE);
}

// Treatment-in-city landing pages (/find/<treatment>/<city>): only combinations with enough real
// providers (search.landing_pages), and only while SEARCH_LANDING_PAGES=1.
const landingEntries = unstable_cache(
  async (): Promise<(CatalogEntry & { lastModified?: string })[]> => {
    if (!landingPagesEnabled()) return [];
    return (await listLandingPages())
      .filter((page) => page.locales.length > 0)
      .map((page) => ({ path: `/find/${page.serviceSlug}/${page.citySlug}`, locales: page.locales as SeoLocale[], lastModified: page.updatedAt }));
  },
  ["sitemap-landing-v1"],
  { revalidate: 3600 },
);

const STATIC_PATHS: CatalogEntry[] = [
  { path: "", locales: ALL_LOCALES },
  { path: "/categories", locales: INDEXABLE_CATEGORY_LOCALES },
  { path: "/explore", locales: ALL_LOCALES },
  { path: "/shop", locales: INDEXABLE_SHOP_LOCALES },
  { path: "/offers", locales: PERSIAN_ONLY },
  { path: "/featured", locales: PERSIAN_ONLY },
  { path: "/packages", locales: PERSIAN_ONLY },
  { path: "/providers", locales: ALL_LOCALES },
  { path: "/consultation/doctors", locales: INDEXABLE_CONSULTATION_LOCALES },
  { path: "/consulting", locales: ALL_LOCALES },
  { path: "/privacy-policy", locales: ALL_LOCALES },
];

const catalogEntries = unstable_cache(
  async (): Promise<CatalogEntry[]> => {
    // One round trip. Entity pages list only the locales whose main text exists
    // (see lib/seo/locale-eligibility); the shop is a Persian storefront.
    const rows = await sql<CatalogRow[]>`
      select '/providers/' || sp.slug as path,
             ${translatedKeys("sp.description_translations")} as keys, false as persian_only,
             array_remove(array[${resolvedMedia("sp.image_url")}] || array(
               select ${resolvedMedia("g.url")} from category.provider_gallery_items g
                where g.service_provider_id = sp.id and coalesce(nullif(btrim(g.media_type), ''), 'image') <> 'video'
                order by g.display_order, g.create_date limit 4
             ), null) as images
      from category.service_providers sp
      where sp.is_active = true and sp.slug is not null
        and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/services/' || ps.slug,
             ${translatedKeys("ps.description_translations")}, false,
             array_remove(array[${resolvedMedia("ps.image_url")}], null)
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true and ps.slug is not null and sp.is_active = true
        and category.provider_type_is_public(sp.provider_type_id)
      union all
      select '/specialists/' || s.slug,
             ${translatedKeys("s.biography_translations")}, false,
             array_remove(array[${resolvedMedia("s.profile_image_url")}], null)
      from category.staff s
      where s.is_active = true and s.slug is not null and exists (
        select 1 from category.provider_staffs psf
        join category.service_providers sp on sp.id = psf.service_provider_id
        where psf.staff_id = s.id and psf.is_active = true and sp.is_active = true
      )
      union all
      select '/specialties/' || pt.slug,
             ${translatedKeys("pt.name_translations")}, false, null::text[]
      from category.provider_types pt
      where pt.is_active = true and pt.slug is not null
        and category.provider_type_is_public(pt.id)
      union all
      select '/products/' || p.slug, null, true,
             array(select m.url from shop.product_media m
                    where m.product_id = p.id and coalesce(m.media_type, 'image') = 'image' and nullif(btrim(m.url), '') is not null
                    order by m.is_primary desc, m.display_order, m.create_date limit 5)
      from shop.products p
      where p.deleted_at is null and p.status = 'active' and p.slug is not null and p.slug <> ''
      union all
      select '/shop/' || c.slug, null, true, null::text[]
      from shop.categories c
      where c.deleted_at is null and c.is_active = true and c.slug is not null and c.slug <> ''
      union all
      select '/shop/seller/' || s.slug, null, true,
             array_remove(array[s.logo_url], null)
      from shop.sellers s
      where s.deleted_at is null and s.is_active = true and s.shop_status = 'active'
        and s.slug is not null and s.slug <> ''
      union all
      select '/packages/' || p.slug, null, true, null::text[]
      from marketing.special_packages p
      where p.is_active = true and p.slug is not null
        and nullif(btrim(p.title_translations ->> 'fa-IR'), '') is not null
      order by path
    `;
    return rows.map((row) => ({
      path: row.path,
      images: sitemapImages(row.path, row.images),
      locales: row.persian_only
        ? PERSIAN_ONLY
        : row.path.startsWith("/specialties/")
          ? // Specialty landings are directory pages, indexed like category landings.
            indexableLocalesFromKeys(row.keys).filter((locale) => INDEXABLE_CATEGORY_LOCALES.includes(locale))
          : indexableLocalesFromKeys(row.keys),
    }));
  },
  ["public-sitemap-catalog-v8"],
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

// Tours (2026-11-15: they were missing from the sitemap). Each tour lists only
// the languages it is written in; listings the languages any tour is written in.
const tourEntries = unstable_cache(
  async (): Promise<(CatalogEntry & { lastModified?: string })[]> =>
    (await listTourSitemapEntries()).map((entry) => ({
      path: entry.path,
      locales: entry.locales,
      ...(entry.images?.length ? { images: entry.images } : {}),
      ...(entry.lastModified ? { lastModified: new Date(entry.lastModified).toISOString() } : {}),
    })),
  ["sitemap-tours-v2"],
  { revalidate: 3600 }
);

const guideEntries = (): (CatalogEntry & { lastModified: string })[] =>
  allGuides().map((guide) => ({
    path: guidePath(guide.slug),
    locales: guideLocales(guide),
    lastModified: guide.reviewedAt,
  }));

// Stays (hotels / اقامتگاه): the intro (where /stays sends crawlers), destination
// pages that have published stays, and each published stay in the languages its
// own name is written in. Search URLs (/stays/explore?...) are never listed.
const stayEntries = unstable_cache(
  async (): Promise<(CatalogEntry & { lastModified?: string })[]> => {
    const exists = await sql<{ ok: boolean }[]>`select to_regclass('stay.properties') is not null as ok`;
    if (!exists[0]?.ok) return [];
    const [cities, properties] = await Promise.all([
      sql<{ slug: string; updated_at: Date }[]>`
        select c.slug, greatest(c.updated_at, max(p.updated_at)) as updated_at
          from stay.cities c join stay.properties p on p.city_id = c.id and p.status = 'published'
         where c.is_published group by c.id order by c.slug`,
      sql<{ slug: string; keys: string[]; updated_at: Date; images: string[] | null }[]>`
        select p.slug, array(select jsonb_object_keys(p.name)) as keys, p.updated_at,
               array(select m.url from stay.media m where m.property_id = p.id and m.room_type_id is null and nullif(btrim(m.url), '') is not null
                      order by m.is_cover desc, m.sort_order, m.id limit 5) as images
          from stay.properties p join stay.cities c on c.id = p.city_id and c.is_published
         where p.status = 'published' order by p.slug`,
    ]);
    return [
      { path: "/stays/intro", locales: STAY_INDEXABLE_LOCALES },
      ...cities.map((c) => ({ path: `/stays/city/${c.slug}`, locales: STAY_INDEXABLE_LOCALES, lastModified: new Date(c.updated_at).toISOString() })),
      ...properties.map((p) => ({
        path: `/stays/${p.slug}`,
        locales: propertyLocales(p.keys ?? []),
        lastModified: new Date(p.updated_at).toISOString(),
        images: sitemapImages(`/stays/${p.slug}`, p.images),
      })),
    ];
  },
  ["sitemap-stays-v2"],
  { revalidate: 3600 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each part on its own: an outage in one must never cache an empty catalog,
  // nor drop the other part from the sitemap.
  const unavailable = (part: string) => (): CatalogEntry[] => {
    console.error(`[seo] Sitemap ${part} unavailable; serving the rest.`);
    return [];
  };
  const [entities, categories, tours, stays, landing] = await Promise.all([
    catalogEntries().catch(unavailable("catalog")),
    categoryEntries().catch(unavailable("categories")),
    tourEntries().catch(unavailable("tours")),
    stayEntries().catch(unavailable("stays")),
    landingEntries().catch(unavailable("landing pages")),
  ]);
  const catalog = [...entities, ...categories, ...tours, ...stays, ...landing];

  // Editorial pages (admin → Editorial) list only their translated locales; first
  // so a published /privacy-policy replaces the built-in all-locale entry.
  const sitePages = (await getPublishedSitePageIndex()).map((page) => ({
    path: `/${page.slug}`,
    locales: page.locales,
    ...(page.updatedAt ? { lastModified: page.updatedAt } : {}),
  }));

  // Blog: the index (indexable where at least one post is published) and each post in the
  // languages it is published in. Never throws: an outage yields no blog entries, not a failed sitemap.
  const posts = await getPublishedPostIndex();
  const blogLocales = [...new Set(posts.flatMap((post) => post.locales))];
  const blogEntries = posts.length
    ? [
        { path: "/blog", locales: blogLocales },
        ...posts.map((post) => ({ path: `/blog/${post.slug}`, locales: post.locales, lastModified: post.updatedAt })),
      ]
    : [];

  const entries: (CatalogEntry & { lastModified?: string })[] = [
    ...sitePages,
    ...blogEntries,
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
      ...(entry.images?.length ? { images: entry.images } : {}),
    }));
  });
}
