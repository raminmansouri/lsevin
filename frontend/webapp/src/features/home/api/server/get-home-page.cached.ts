import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import {
  getFeaturedHomeServices,
  getHomeCategories,
  getHomeHeroOffer,
  getNearbyProviderCount,
  getTrendingHomeServices,
  getTrustedHomeProviders,
  type HomeCategory,
  type HomeFeaturedService,
  type HomeHeroOffer,
  type HomeQueryInput,
  type HomeTrendingService,
  type HomeTrustedProvider,
} from "./get-home-page";

/**
 * Cached views of the home-page rails. Each is a read-only projection that only
 * changes when the underlying catalogue / bookings / offers change — not per
 * request — so the (still dynamic, per-visitor) home page serves them from the
 * `"use cache"` data cache instead of re-querying Postgres on every load.
 *
 * The whole `HomeQueryInput` (locale + coarse location) is the cache key, so a
 * visitor still gets their location-scoped, nearest-first list; visitors sharing
 * a locale + city (or IP-derived coordinates) share the entry.
 *
 * Tag: `home-rails` — call `revalidateTag("home-rails")` from the catalogue /
 * marketing admin mutations.
 */

export async function getHomeCategoriesCached(input: HomeQueryInput, limit = 6): Promise<HomeCategory[]> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getHomeCategories(input, limit);
}

export async function getFeaturedHomeServicesCached(input: HomeQueryInput, limit = 8): Promise<HomeFeaturedService[]> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getFeaturedHomeServices(input, limit);
}

export async function getTrendingHomeServicesCached(input: HomeQueryInput, limit = 8): Promise<HomeTrendingService[]> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getTrendingHomeServices(input, limit);
}

export async function getTrustedHomeProvidersCached(input: HomeQueryInput, limit = 8): Promise<HomeTrustedProvider[]> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getTrustedHomeProviders(input, limit);
}

export async function getHomeHeroOfferCached(input: HomeQueryInput): Promise<HomeHeroOffer | null> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getHomeHeroOffer(input);
}

export async function getNearbyProviderCountCached(input: HomeQueryInput): Promise<number> {
  "use cache";
  cacheTag("home-rails");
  cacheLife("default");
  return getNearbyProviderCount(input);
}
