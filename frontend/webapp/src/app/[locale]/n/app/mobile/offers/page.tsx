import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

import OffersClient from "./OffersClient";
import { getOffersPageData, parseOffersFilters } from "./offers.data";
import { DesktopOffersView } from "@/features/web-desktop/offers/DesktopOffersView";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const filters = parseOffersFilters(resolvedSearchParams);
  const data = await getOffersPageData({ locale, filters });

  return (
    <>
      <div className="xl:hidden">
        <OffersClient {...data} filters={filters} />
        <SponsoredPlacementSlot locale={locale} placement="offers" />
      </div>
      <DesktopOffersView {...data} filters={filters} />
      <div className="lsd hidden pb-14 xl:block">
        <DesktopSponsoredSection locale={locale} placement="offers" />
      </div>
    </>
  );
}
