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

// Static / ISR: the shell shows the global "trending" + "popular categories"
// (both `"use cache"`d). The visitor's own recent searches are pulled on the
// client by `MobileSearchPageClient`.
export const dynamic = "force-static";
export const revalidate = 300;

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

  // Outages reject so ISR keeps the last good page, except during `next build`
  // (no database in the image build): bake empty rails, ISR refills them.
  const duringBuild = <T,>(fallback: T) => (error: unknown): T => {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error;
    return fallback;
  };
  const [popularCategories, trendingSearches] = await Promise.all([
    getPopularSearchCategoriesCached(locale, 8).catch(duringBuild([])),
    getTrendingSearchesCached(locale, 6).catch(duringBuild([])),
  ]);

  return (
    <MobileSearchPageClient
      initialData={{ recentSearches: [], popularCategories, trendingSearches }}
    />
  );
}
