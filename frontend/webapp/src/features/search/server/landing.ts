import "server-only";

import sql from "@/config/database/db";

import { pickText, resolveImage } from "./search";

/** Landing pages are published only when the web app says so: they are indexable, so they ship dark. */
export const landingPagesEnabled = () => process.env.SEARCH_LANDING_PAGES === "1";

type Translations = Record<string, string>;

export type LandingOffer = {
  id: string;
  title: string;
  provider: string;
  path: string;
  image: string | null;
  rating: number | null;
  reviewCount: number;
  priceToman: number | null;
};

export type LandingLink = { serviceSlug: string; citySlug: string; serviceName: string; cityName: string };

export type LandingData = {
  serviceSlug: string;
  citySlug: string;
  serviceNames: Translations;
  cityNames: Translations;
  providers: number;
  minPriceToman: number | null;
  maxPriceToman: number | null;
  avgRating: number | null;
  updatedAt: string;
  offers: LandingOffer[];
  otherCities: LandingLink[];
  otherServices: LandingLink[];
};

type PageRow = {
  service_key: string;
  service_slug: string;
  service_names: Translations;
  city_slug: string;
  city_names: Translations;
  providers: string;
  min_price_toman: string | null;
  max_price_toman: string | null;
  avg_rating: string | null;
  updated_at: Date;
};

/**
 * The data of one landing page, or null when the combination does not qualify (fewer than 3
 * providers, unknown city, ambiguous slug). A null must become a 404: a thin page is never served.
 */
export async function getLanding(serviceSlug: string, citySlug: string, locale: string): Promise<LandingData | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(serviceSlug) || !/^[a-z0-9-]{1,40}$/.test(citySlug)) return null;
  const [page] = await sql<PageRow[]>`
    select * from search.landing_pages where service_slug = ${serviceSlug} and city_slug = ${citySlug}`;
  if (!page) return null;

  const [offers, sameService, sameCity] = await Promise.all([
    sql<{ source_id: string; title: Translations; subtitle: Translations; url: string; image: string | null; rating: string | null; review_count: number; price_toman: string | null }[]>`
      select source_id, title, subtitle, url, image, rating, review_count, price_toman
        from search.documents
       where doc_type = 'offer' and is_public and service_key = ${page.service_key} and city = ${citySlug}
       order by quality desc, rating desc nulls last, source_id
       limit 30`,
    sql<PageRow[]>`select * from search.landing_pages where service_slug = ${serviceSlug} and city_slug <> ${citySlug} order by providers desc limit 8`,
    sql<PageRow[]>`select * from search.landing_pages where city_slug = ${citySlug} and service_slug <> ${serviceSlug} order by providers desc limit 8`,
  ]);

  const link = (row: PageRow): LandingLink => ({
    serviceSlug: row.service_slug,
    citySlug: row.city_slug,
    serviceName: pickText(row.service_names, locale),
    cityName: pickText(row.city_names, locale),
  });

  return {
    serviceSlug,
    citySlug,
    serviceNames: page.service_names,
    cityNames: page.city_names,
    providers: Number(page.providers),
    minPriceToman: page.min_price_toman === null ? null : Number(page.min_price_toman),
    maxPriceToman: page.max_price_toman === null ? null : Number(page.max_price_toman),
    avgRating: page.avg_rating === null ? null : Number(page.avg_rating),
    updatedAt: page.updated_at.toISOString(),
    offers: offers.map((row) => ({
      id: row.source_id,
      title: pickText(row.title, locale),
      provider: pickText(row.subtitle, locale),
      path: row.url,
      image: resolveImage(row.image),
      rating: row.rating === null ? null : Number(row.rating),
      reviewCount: row.review_count ?? 0,
      priceToman: row.price_toman === null ? null : Number(row.price_toman),
    })),
    otherCities: sameService.map(link),
    otherServices: sameCity.map(link),
  };
}

/** For the sitemap: every qualifying page, with the languages its names exist in. */
export async function listLandingPages(): Promise<{ serviceSlug: string; citySlug: string; updatedAt: string; locales: string[] }[]> {
  const rows = await sql<PageRow[]>`select * from search.landing_pages order by service_slug, city_slug`;
  return rows.map((row) => ({
    serviceSlug: row.service_slug,
    citySlug: row.city_slug,
    updatedAt: row.updated_at.toISOString(),
    // The page text is written in Persian and English only.
    locales: (["fa", "en"] as const).filter((locale) => {
      const tag = locale === "fa" ? "fa-IR" : "en-US";
      return Boolean(row.service_names?.[tag] && row.city_names?.[tag]);
    }),
  }));
}
