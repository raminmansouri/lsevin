import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { alternatesFor } from "@/lib/seo/alternates";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import ExploreClient from "./ExploreClient";
import { getExplorePageData, parseExploreFilters } from "./explore.data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Explore" });

  return {
    title: t("header.title"),
    description: t("header.subtitle"),
    alternates: alternatesFor(locale, "/n/app/mobile/explore"),
  };
}

// Explore is a URL-filter-driven directory (country / city / category /
// provider-type / language / currency / rating). It reads `searchParams`
// directly and resolves per-visitor favourites, so the page itself still
// renders dynamically — the same way a search-results page does. The
// visitor-agnostic catalogue data (categories, provider types, featured /
// trending / sponsored rows, language & currency facets) is cached per
// locale + filter combination inside getExplorePageData via `"use cache"`;
// only the favourites lookup and this per-request wrapper stay dynamic.
export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function Explore({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const locale = await getLocale().catch(() => "en");
  const rawSearchParams = await Promise.resolve(searchParams ?? {});
  const filters = parseExploreFilters(rawSearchParams);
  const data = await getExplorePageData({ locale, filters });

  return (
    <>
      <ExploreClient
        customerId={data.customerId}
        categories={data.categories}
        providerTypes={data.providerTypes}
        featuredProviders={data.featuredProviders}
        trendingServices={data.trendingServices}
        sponsoredProviders={data.sponsoredProviders}
        availableLanguages={data.availableLanguages}
        availableCurrencies={data.availableCurrencies}
        locale={locale}
        filters={filters}
      />
      <SponsoredPlacementSlot locale={locale} placement="explore" />
    </>
  );
}
