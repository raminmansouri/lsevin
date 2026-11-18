import "server-only";

import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache";

import type { StaySearch } from "../domain/search";
import type { PropertyDetail } from "../types";

import {
  exploreSuggestions,
  getCity,
  getPropertyDetail,
  kindCounts,
  listAmenities,
  listCities,
  listLandmarks,
  listReviews,
  reviewStats,
  searchProperties,
  similarStays,
} from "./catalog";

/**
 * Public catalogue reads shared by every visitor, kept in the in-process "use cache" store
 * (an LRU in memory, never on disk). Nothing here depends on the visitor or on live
 * availability: dated searches, room offers, price calendars, wishlists and bookings always
 * go to the database. Admin writes and new reviews call revalidateTag(STAYS_CATALOG_TAG);
 * the short lifetime also bounds staleness on the other site, whose admin writes do not
 * reach this process.
 */
export const STAYS_CATALOG_TAG = "stays-catalog";

const LIFE = { stale: 60, revalidate: 120, expire: 600 };

/**
 * STAYS_CATALOG_CACHE=off reads the database every time. Only for test servers whose fixtures
 * are written straight into the database (no admin action to clear the cache).
 */
const cacheOff = () => process.env.STAYS_CATALOG_CACHE === "off";

async function cachedPropertyDetailStore(slug: string, locale: string): Promise<PropertyDetail | null> {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return getPropertyDetail({ slug }, locale);
}

/** Everything on the hotel page below the rooms that is the same for every guest. */
async function cachedPropertyExtrasStore(property: Pick<PropertyDetail, "id" | "city" | "location">, locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return propertyExtras(property, locale);
}

async function propertyExtras(property: Pick<PropertyDetail, "id" | "city" | "location">, locale: string) {
  const [reviews, stats, similar, landmarks, amenities] = await Promise.all([
    listReviews(property.id, { limit: 30 }),
    reviewStats(property.id).catch(() => ({ histogram: [0, 0, 0, 0, 0], recommendPercent: null as number | null })),
    similarStays(property, locale).catch(() => []),
    listLandmarks(property.city.slug, locale).catch(() => []),
    listAmenities(locale).catch(() => []),
  ]);
  return { reviews, stats, similar, landmarks, amenities };
}

async function cachedCitiesStore(locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return listCities(locale);
}

async function cachedCityStore(slug: string, locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return getCity(slug, locale);
}

async function cachedAmenitiesStore(locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return listAmenities(locale);
}

async function cachedLandmarksStore(citySlug: string | null, locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return listLandmarks(citySlug, locale);
}

async function cachedKindCountsStore() {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return kindCounts();
}

/** Undated searches only show catalogue prices ("from"), so they are shared; dated ones are live. */
async function cachedUndatedSearchStore(search: StaySearch, locale: string, pageSize: number | null) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return searchProperties(search, locale, pageSize ? { pageSize } : {});
}

export function catalogSearch(search: StaySearch, locale: string, opts: { pageSize?: number } = {}) {
  return search.checkIn || search.checkOut || cacheOff() ? searchProperties(search, locale, opts) : cachedUndatedSearchStore(search, locale, opts.pageSize ?? null);
}

async function cachedUndatedSuggestionsStore(search: StaySearch, locale: string) {
  "use cache";
  cacheTag(STAYS_CATALOG_TAG);
  cacheLife(LIFE);
  return exploreSuggestions(search, locale);
}

export function catalogSuggestions(search: StaySearch, locale: string) {
  return search.checkIn || search.checkOut || cacheOff() ? exploreSuggestions(search, locale) : cachedUndatedSuggestionsStore(search, locale);
}

// Public entry points: the cache, unless switched off.
export const cachedPropertyDetail = (slug: string, locale: string) => (cacheOff() ? getPropertyDetail({ slug }, locale) : cachedPropertyDetailStore(slug, locale));
export const cachedPropertyExtras = (property: Pick<PropertyDetail, "id" | "city" | "location">, locale: string) =>
  cacheOff() ? propertyExtras(property, locale) : cachedPropertyExtrasStore(property, locale);
export const cachedCities = (locale: string) => (cacheOff() ? listCities(locale) : cachedCitiesStore(locale));
export const cachedCity = (slug: string, locale: string) => (cacheOff() ? getCity(slug, locale) : cachedCityStore(slug, locale));
export const cachedAmenities = (locale: string) => (cacheOff() ? listAmenities(locale) : cachedAmenitiesStore(locale));
export const cachedLandmarks = (citySlug: string | null, locale: string) => (cacheOff() ? listLandmarks(citySlug, locale) : cachedLandmarksStore(citySlug, locale));
export const cachedKindCounts = () => (cacheOff() ? kindCounts() : cachedKindCountsStore());
