import { getLocale } from "next-intl/server";

import ExploreClient from "./ExploreClient";
import { getExplorePageData, parseExploreFilters } from "./explore.data";

// Explore is a URL-filter-driven directory (country / city / category /
// provider-type / language / currency / rating). Its content is *defined* by
// the query string and it resolves per-visitor favourites, so it renders
// dynamically — the same way a search-results page does. `getExplorePageData`
// carries `noStore()` for that reason.
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
  );
}
