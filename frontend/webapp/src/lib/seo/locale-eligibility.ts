import "server-only";

import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";
import { routing } from "@/i18n/routing";
import { catalogDataLocale } from "@/lib/pwa/data-locale";

import type { SeoLocale } from "./alternates";

/**
 * Which locale versions of an entity page deserve to be indexed.
 *
 * Every entity page renders in all 11 UI locales, but its main text falls back
 * to Persian where no translation exists (most service descriptions exist only
 * in fa-IR). Those variants are Persian content inside translated chrome:
 * near-duplicates that dilute the site. A locale qualifies only when the
 * entity's main text exists in that language; Persian, the source language,
 * always qualifies. Non-qualifying variants stay reachable but are
 * noindex,follow and are left out of hreflang and the sitemap.
 */
export type IndexableEntity = "provider" | "service" | "specialist";

// The category tree currently has complete page copy and category descriptions
// only in Persian and English. The shop catalog is published in Persian only.
// Keep fallback-language variants reachable, but out of search results until
// their main content is translated and reviewed.
export const INDEXABLE_CATEGORY_LOCALES: readonly SeoLocale[] = ["fa", "en"];
export const INDEXABLE_SHOP_LOCALES: readonly SeoLocale[] = ["fa"];

export const MIN_TRANSLATED_CHARS = 40;

/** Maps translation keys found in the data (e.g. "en-US") to routed locales. */
export function indexableLocalesFromKeys(keys: readonly string[] | null | undefined): SeoLocale[] {
  const present = new Set(keys ?? []);
  return routing.locales.filter(
    (locale) => locale === routing.defaultLocale || present.has(catalogDataLocale(locale))
  );
}

/**
 * SQL text[] of translation keys whose text is long enough and is not just a
 * copy of the Persian text. `column` is a qualified identifier such as
 * "sp.description_translations"; a fresh fragment is built per query.
 */
export const translatedKeys = (column: string) => {
  const c = sql(column);
  return sql`
    array(
      select e.key from jsonb_each_text(coalesce(${c}, '{}'::jsonb)) e
      where length(e.value) >= ${MIN_TRANSLATED_CHARS}
        and (e.key = 'fa-IR' or e.value is distinct from ${c} ->> 'fa-IR')
    )
  `;
};

async function loadKeys(entity: IndexableEntity, id: string): Promise<string[] | null> {
  const rows =
    entity === "provider"
      ? await sql<{ keys: string[] }[]>`
          select ${translatedKeys("sp.description_translations")} as keys
          from category.service_providers sp where sp.id = ${id}::uuid`
      : entity === "service"
        ? await sql<{ keys: string[] }[]>`
            select ${translatedKeys("ps.description_translations")} as keys
            from category.provider_services ps where ps.id = ${id}::uuid`
        : await sql<{ keys: string[] }[]>`
            select ${translatedKeys("s.biography_translations")} as keys
            from category.staff s where s.id = ${id}::uuid`;
  return rows[0]?.keys ?? null;
}

const cachedKeys = unstable_cache(loadKeys, ["seo-indexable-locales-v1"], {
  revalidate: 3600,
  tags: ["sitemap-catalog"],
});

/**
 * Indexable locales for one entity. On a lookup failure every locale is
 * returned: a transient database error must not deindex pages.
 */
export async function getIndexableLocales(entity: IndexableEntity, id: string): Promise<SeoLocale[]> {
  try {
    const keys = await cachedKeys(entity, id);
    return keys ? indexableLocalesFromKeys(keys) : [...routing.locales];
  } catch (error) {
    console.error("[seo] indexable-locale lookup failed", { entity, id, error });
    return [...routing.locales];
  }
}
