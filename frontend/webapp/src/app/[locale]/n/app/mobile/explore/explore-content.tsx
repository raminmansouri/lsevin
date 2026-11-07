import ExploreClient from "./ExploreClient";
import type { ExploreFiltersInput, getExplorePageData } from "./explore.data";

import { DesktopExploreView } from "@/features/web-desktop/explore/DesktopExploreView";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";
import { PageFaq } from "@/features/site-content/components/faq-section";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

/** The explore directory, shared by /explore and the /specialties/<slug> landings. */
export function ExploreContent({
  locale,
  filters,
  data,
  pageUrl,
}: {
  locale: string;
  filters: ExploreFiltersInput;
  data: Awaited<ReturnType<typeof getExplorePageData>>;
  pageUrl: string;
}) {
  return (
    <>
      <div className="xl:hidden">
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
      </div>
      <DesktopExploreView
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
      <div className="xl:hidden">
        <SponsoredPlacementSlot locale={locale} placement="explore" />
      </div>
      <div className="lsd hidden pb-14 pt-4 xl:block">
        <DesktopSponsoredSection locale={locale} placement="explore" />
      </div>
      {/* A provider-type filter shows that type's FAQ (exact), else the explore FAQ. */}
      <PageFaq
        target={[
          ...(filters.providerTypeId ? [{ scope: "provider_type" as const, entityId: filters.providerTypeId, exact: true }] : []),
          ...(filters.categoryId ? [{ scope: "category" as const, entityId: filters.categoryId, exact: true }] : []),
          { scope: "explore" as const },
        ]}
        locale={locale}
        pageUrl={pageUrl}
      />
    </>
  );
}
