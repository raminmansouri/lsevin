import { getLocale } from "next-intl/server";

import ExploreClient from "./ExploreClient";
import { getExplorePageData, parseExploreFilters } from "./explore.data";

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
    <ExploreClient
      customerId={data.customerId}
      categories={data.categories}
      providerTypes={data.providerTypes}
      featuredProviders={data.featuredProviders}
      trendingServices={data.trendingServices}
      sponsoredProviders={data.sponsoredProviders}
      availableLanguages={data.availableLanguages}
      filters={filters}
    />
  );
}
