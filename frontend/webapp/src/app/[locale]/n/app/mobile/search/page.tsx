import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MobileSearchPageClient } from "@/features/service-providers/components/search/mobile-search-page-client";
import {
  getPopularSearchCategoriesCached,
  getTrendingSearchesCached,
} from "@/features/service-providers/server/search.repository.cached";

type SearchPageProps = {
  params: Promise<{ locale: string }> | { locale: string };
};

// Rendered per request; "trending" and "popular categories" come from their
// own data caches, and the visitor's recent searches load on the client. Not
// ISR: the image build has no database, so the prerendered copy would be empty
// rails served as fresh for the whole revalidate window after each deploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "MobileSearch.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // An outage empties the rails for that request only; nothing is cached.
  const [popularCategories, trendingSearches] = await Promise.all([
    getPopularSearchCategoriesCached(locale, 8).catch(() => []),
    getTrendingSearchesCached(locale, 6).catch(() => []),
  ]);

  return (
    <MobileSearchPageClient
      initialData={{ recentSearches: [], popularCategories, trendingSearches }}
    />
  );
}
