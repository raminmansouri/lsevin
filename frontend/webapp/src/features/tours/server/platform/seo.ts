import "server-only";

import { cache } from "react";

import db from "@/config/database/db";
import { routing } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo/alternates";
import { publicMediaUrl } from "@/lib/seo/media-url";

import { UI_TO_CONTENT_LOCALE } from "../../domain/content";

type UiLocale = (typeof routing.locales)[number];

/** "fa-IR" -> "fa"; content locales without a site language are dropped. */
function uiLocalesFor(contentLocales: string[]): UiLocale[] {
  const wanted = new Set(contentLocales.map((tag) => tag.toLowerCase()));
  return routing.locales.filter((locale) => wanted.has((UI_TO_CONTENT_LOCALE[locale] ?? locale).toLowerCase()));
}

/**
 * The site languages a published tour is written in (a published title in that
 * language). Every other language renders the tour through the content
 * fallback chain, i.e. another language's text: crawlable, not indexed, and
 * not announced in hreflang (Google: a page whose main content is not
 * translated is a duplicate, not a localized version).
 */
export const tourLanguages = cache(async (tourId: string): Promise<UiLocale[]> => {
  const rows = await db<{ locale: string }[]>`
    select distinct c.locale
      from tour.content c
     where c.entity_type = 'tour' and c.entity_id = ${tourId}::uuid and c.field_key = 'title'
       and nullif(btrim(c.published_value), '') is not null
  `;
  return uiLocalesFor(rows.map((row) => row.locale));
});

/** Languages any published tour is written in: the tour listings' indexable languages. */
export const tourCatalogLanguages = cache(async (): Promise<UiLocale[]> => {
  const rows = await db<{ locale: string }[]>`
    select distinct c.locale
      from tour.content c
      join tour.tours t on t.id = c.entity_id and t.status = 'published'
      join category.service_providers sp on sp.id = t.service_provider_id and sp.is_active
     where c.entity_type = 'tour' and c.field_key = 'title'
       and nullif(btrim(c.published_value), '') is not null
  `;
  return uiLocalesFor(rows.map((row) => row.locale));
});

export interface TourSitemapEntry {
  path: string;
  locales: UiLocale[];
  lastModified: Date | null;
  /** Approved photos, for the image sitemap. */
  images?: string[];
}

/** Published tours and the destinations that have them, for the sitemap. */
export async function listTourSitemapEntries(): Promise<TourSitemapEntry[]> {
  const [tours, destinations, catalog] = await Promise.all([
    db<{ id: string; slug: string; updated_at: Date | null; locales: string[]; images: string[] | null }[]>`
      select t.id::text, t.slug, t.updated_at,
             array(select m.url from tour.media m
                    where m.tour_id = t.id and m.moderation_status = 'approved' and m.kind = 'image' and nullif(btrim(m.url), '') is not null
                    order by m.album = 'cover' desc, m.id limit 5) as images,
             coalesce(array_agg(distinct c.locale) filter (where nullif(btrim(c.published_value), '') is not null), '{}') as locales
        from tour.tours t
        join category.service_providers sp on sp.id = t.service_provider_id and sp.is_active
        left join tour.content c on c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title'
       where t.status = 'published' and t.slug is not null
       group by t.id
    `,
    db<{ slug: string; updated_at: Date | null }[]>`
      select d.slug, max(t.updated_at) as updated_at
        from tour.destinations d
        join tour.tours t on t.destination_id = d.id and t.status = 'published'
        join category.service_providers sp on sp.id = t.service_provider_id and sp.is_active
       where d.slug is not null
       group by d.slug
    `,
    tourCatalogLanguages(),
  ]);
  const newest = tours.reduce<Date | null>((latest, tour) => (tour.updated_at && (!latest || tour.updated_at > latest) ? tour.updated_at : latest), null);
  return [
    { path: "/tours/explore", locales: catalog, lastModified: newest },
    ...destinations.map((destination) => ({
      path: `/tours/destinations/${destination.slug}`,
      locales: catalog,
      lastModified: destination.updated_at,
    })),
    ...tours.map((tour) => ({
      path: `/tours/${tour.slug}`,
      locales: uiLocalesFor(tour.locales),
      lastModified: tour.updated_at,
      images: (tour.images ?? []).map((src) => publicMediaUrl(src)).filter((url): url is string => Boolean(url)),
    })),
  ].filter((entry) => entry.locales.length > 0);
}

/**
 * Canonical and hreflang for a public Tours page (until 2026-11-15 Tours pages
 * had neither). A language the page is not written in stays reachable but is
 * kept out of the index, like the other public pages (lib/seo/metadata.ts).
 */
export function tourAlternates(locale: string, path: string, languages: readonly UiLocale[]) {
  // No languages known (lookup failed): leave indexing as it was.
  const indexable = !languages.length || (languages as readonly string[]).includes(locale);
  return {
    alternates: alternatesFor(locale, path, languages.length ? languages : undefined),
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/**
 * The current slug of a tour whose URL used to be `slug` (migration 0111:
 * tour.tour_slug_history), for a permanent redirect. Null when the slug was
 * never retired, the tour is not published, or the table does not exist yet.
 */
export async function currentTourSlug(slug: string): Promise<string | null> {
  try {
    const [row] = await db<{ slug: string }[]>`
      select t.slug
        from tour.tour_slug_history h
        join tour.tours t on t.id = h.tour_id
       where h.slug = ${slug} and t.status = 'published' and t.slug <> ${slug}
       limit 1
    `;
    return row?.slug ?? null;
  } catch {
    return null;
  }
}
