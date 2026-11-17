import "server-only";

import { providerUrl, serviceUrl, type ListedItem } from "@/lib/seo/entity-schema";

import type { ExploreFeaturedProvider, ExploreTrendingService } from "./explore.data";

/** What an explore listing shows, in page order: its providers, then its services. */
export function exploreListedItems(
  locale: string,
  data: { featuredProviders: Pick<ExploreFeaturedProvider, "id" | "slug" | "name" | "image">[]; trendingServices: Pick<ExploreTrendingService, "id" | "slug" | "name" | "image">[] }
): ListedItem[] {
  return [
    ...data.featuredProviders.map((p) => ({ url: providerUrl(locale, p), name: p.name, image: p.image })),
    ...data.trendingServices.map((s) => ({ url: serviceUrl(locale, s), name: s.name, image: s.image })),
  ];
}
