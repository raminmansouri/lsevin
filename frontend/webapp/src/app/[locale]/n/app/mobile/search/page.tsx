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
export const revalidate = 3600;

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MobileSearch.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

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
