import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type {
  SearchHistoryPopularCategoryVm,
  SearchHistoryTrendingSearchVm,
} from "@/features/service-providers/types";

import { getPopularSearchCategories, getTrendingSearches } from "./search.repository";

/**
 * The two global halves of the search page's "history" payload. Neither
 * depends on the visitor (only on `locale`): "trending now" is the most-booked
 * services, "popular categories" is a catalogue aggregate. They were being
 * recomputed — a multi-table join / group — on every search-page load.
 *
 * `getRecentSearches` stays uncached: it is per guest / user identity.
 *
 * Tag: `search-discovery` — revalidate from the booking / catalogue admin
 * mutations if a fresher list is wanted sooner than `cacheLife`.
 */

export async function getTrendingSearchesCached(
  locale?: string,
  limit = 6,
): Promise<SearchHistoryTrendingSearchVm[]> {
  "use cache";
  cacheTag("search-discovery");
  cacheLife("default");
  return getTrendingSearches(locale, limit);
}

export async function getPopularSearchCategoriesCached(
  locale?: string,
  limit = 8,
): Promise<SearchHistoryPopularCategoryVm[]> {
  "use cache";
  cacheTag("search-discovery");
  cacheLife("default");
  return getPopularSearchCategories(locale, limit);
}
