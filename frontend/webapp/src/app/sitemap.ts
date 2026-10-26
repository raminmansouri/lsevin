import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates } from "@/lib/seo/alternates";

// Request-time metadata avoids requiring database access during image builds.
// Cache the successful public catalog, rather than re-querying it per crawler.
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/n/app/mobile/home",
  "/n/app/mobile/categories",
  "/n/app/mobile/explore",
  "/consulting",
];

const catalogPaths = unstable_cache(
  async (): Promise<string[]> => {
    // One round trip; EXISTS prevents duplicate staff URLs for multiple employers.
    const rows = await sql<{ path: string }[]>`
      select '/n/app/mobile/provider/' || sp.id::text as path
      from category.service_providers sp where sp.is_active = true
      union all
      select '/type/' || pt.id::text
      from category.provider_types pt where pt.is_active = true
      union all
      select '/n/app/mobile/service/' || ps.id::text
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true and sp.is_active = true
      union all
      select '/n/app/mobile/specialist/' || s.id::text
      from category.staff s
      where s.is_active = true and exists (
        select 1 from category.provider_staffs psf
        join category.service_providers sp on sp.id = psf.service_provider_id
        where psf.staff_id = s.id and psf.is_active = true and sp.is_active = true
      )
      order by path
    `;
    return rows.map((row) => row.path);
  },
  ["public-sitemap-catalog-v2"],
  { revalidate: 300, tags: ["sitemap-catalog"] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let catalog: string[];
  try {
    catalog = await catalogPaths();
  } catch {
    // Outside the cache: an outage must never cache an empty catalog.
    console.error(
      "[seo] Sitemap catalog unavailable; serving public static paths."
    );
    catalog = [];
  }
  const paths = [...new Set([...STATIC_PATHS, ...catalog])];
  if (paths.length * routing.locales.length > 50_000) {
    throw new Error("Catalog requires sharded sitemaps (50,000 URL limit).");
  }
  return paths.flatMap((path) => {
    const languages = languageAlternates(path);
    return routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      changeFrequency: "weekly" as const,
      alternates: { languages },
    }));
  });
}
