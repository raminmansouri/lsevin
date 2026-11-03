import NearbyClient from "./NearbyClient";
import { getNearbyPageData, parseNearbyFilters } from "./nearby.data";

import { DesktopNearbyView } from "@/features/web-desktop/nearby/DesktopNearbyView";
import { PageFaq } from "@/features/site-content/components/faq-section";

export const dynamic = "force-dynamic";

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
    <>
    <div className="xl:hidden">
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
    </div>
    <DesktopNearbyView
      initialView={initialView}
      locale={locale}
      categories={data.categories}
      providers={data.providers}
      filters={filters}
      mapCenter={data.mapCenter}
      expandedBeyondFilters={data.expandedBeyondFilters}
    />
    {/* A category or provider-type filter shows that FAQ (exact), else the map FAQ. */}
    <PageFaq
      target={[
        ...(filters.categoryId ? [{ scope: "category" as const, entityId: filters.categoryId, exact: true }] : []),
        ...(filters.providerTypeId ? [{ scope: "provider_type" as const, entityId: filters.providerTypeId, exact: true }] : []),
        { scope: "map" as const },
      ]}
      locale={locale}
    />
    </>
  );
}
