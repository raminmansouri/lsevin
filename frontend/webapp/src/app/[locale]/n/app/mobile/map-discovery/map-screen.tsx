import NearbyClient from "./NearbyClient";
import type { getNearbyPageData, NearbyFiltersInput } from "./nearby.data";

import { DesktopNearbyView } from "@/features/web-desktop/nearby/DesktopNearbyView";
import { PageFaq } from "@/features/site-content/components/faq-section";

/** The map / provider list screen, shared by /map and /categories/<slug>/providers. */
export function MapScreen({
  locale,
  filters,
  data,
  initialView,
  providerTypeSlug,
  pageUrl,
}: {
  locale: string;
  filters: NearbyFiltersInput;
  data: Awaited<ReturnType<typeof getNearbyPageData>>;
  initialView: "map" | "list";
  providerTypeSlug: string | null;
  /** The canonical address, for the FAQ's structured data; omitted on /map (noindex). */
  pageUrl?: string;
}) {
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
      providerTypeSlug={providerTypeSlug}
    />
    </div>
    <DesktopNearbyView
      initialView={initialView}
      locale={locale}
      providerTypeSlug={providerTypeSlug}
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
      pageUrl={pageUrl}
    />
    </>
  );
}

export { requestedView } from "@/lib/routes/filter-paths";
