import NearbyClient from "./NearbyClient";
import { getNearbyPageData, parseNearbyFilters } from "./nearby.data";

export default async function MapDiscoveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const filters = parseNearbyFilters(resolvedSearchParams);
  const data = await getNearbyPageData({ locale, filters });

  // `view` is a presentation choice, not a filter, so it stays out of
  // parseNearbyFilters and never reaches the query.
  const requestedView = resolvedSearchParams.view;
  const initialView = (Array.isArray(requestedView) ? requestedView[0] : requestedView) === "list" ? "list" : "map";

  return (
    <NearbyClient
      initialView={initialView}
      locale={locale}
      customerId={data.customerId}
      categories={data.categories}
      activeCategoryLabel={data.activeCategoryLabel}
      providers={data.providers}
      availableLanguages={data.availableLanguages}
      availableSpecialties={data.availableSpecialties}
      availableCurrencies={data.availableCurrencies}
      filters={filters}
      mapCenter={data.mapCenter}
      expandedBeyondFilters={data.expandedBeyondFilters}
    />
  );
}
