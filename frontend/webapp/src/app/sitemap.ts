import { MetadataRoute } from "next";

import sql from "@/config/database/db";
import { absoluteUrl, languageAlternates } from "@/lib/seo/alternates";
import { routing } from "@/i18n/routing";

/**
 * This file used to be the next-intl starter verbatim: it advertised "/" and
 * "/pathnames" — a demo route that does not exist in this app — and nothing else.
 * Every provider and provider-type page was invisible to crawlers.
 *
 * The catalog comes from Postgres, which is not reachable during `next build`
 * (the same reason [locale]/layout.tsx is force-dynamic), so this renders per
 * request and is cached for an hour. If the database is down the static routes
 * still ship: a thin sitemap beats a 500 that costs the whole file.
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Public, locale-prefixed routes that exist for every visitor. */
const STATIC_PATHS = ["", "/consulting"];

const entriesFor = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap => {
  const languages = languageAlternates(path);
  return routing.locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
};

const listActiveProviderIds = async (): Promise<string[]> => {
  try {
    const rows = await sql<{ id: string }[]>`
      select sp.id::text as id
      from category.service_providers sp
      where sp.is_active = true
    `;
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
};

const listActiveProviderTypeIds = async (): Promise<string[]> => {
  try {
    const rows = await sql<{ id: string }[]>`
      select pt.id::text as id
      from category.provider_types pt
      where pt.is_active = true
    `;
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [providerIds, providerTypeIds] = await Promise.all([
    listActiveProviderIds(),
    listActiveProviderTypeIds(),
  ]);

  return [
    ...STATIC_PATHS.flatMap((path) =>
      entriesFor(path, "daily", path === "" ? 1 : 0.8)
    ),
    ...providerTypeIds.flatMap((id) =>
      entriesFor(`/type/${id}`, "weekly", 0.7)
    ),
    ...providerIds.flatMap((id) =>
      entriesFor(`/service-providers/${id}`, "weekly", 0.6)
    ),
  ];
}
