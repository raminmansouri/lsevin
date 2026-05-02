import NearbyClient from "./NearbyClient";
import { getNearbyPageData, parseNearbyFilters } from "./nearby.data";

export default async function MapDiscoveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const filters = parseNearbyFilters(resolvedSearchParams);
  const data = await getNearbyPageData({ locale, filters });

  return (
    <NearbyClient
      locale={locale}
      customerId={data.customerId}
      categories={data.categories}
      providers={data.providers}
      availableLanguages={data.availableLanguages}
      availableSpecialties={data.availableSpecialties}
      filters={filters}
      mapCenter={data.mapCenter}
    />
  );
}
