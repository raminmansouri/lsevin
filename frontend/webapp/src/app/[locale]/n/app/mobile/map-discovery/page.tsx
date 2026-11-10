import { permanentRedirect } from "next/navigation";

import { getNearbyPageData, parseNearbyFilters } from "./nearby.data";
import { MapScreen, requestedView } from "./map-screen";

import { mapHref } from "@/lib/routes/filter-paths";
import { otherFilters, resolveListingParams, resolvedSlugs } from "@/lib/seo/listing-params";

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
  // `view` is a presentation choice, not a filter, so it stays out of
  // parseNearbyFilters and never reaches the query.
  const initialView = requestedView(resolvedSearchParams.view, "map");

  // ?category=<slug>&type=<slug>. A category on its own has its own page
  // (/categories/<slug>/providers); an old ?categoryId=<uuid> link moves once.
  const listing = await resolveListingParams(resolvedSearchParams);
  if (listing.stale || (listing.categoryId && !listing.providerTypeId)) {
    permanentRedirect(
      `/${locale}${mapHref(listing, resolvedSlugs(listing), otherFilters(resolvedSearchParams, ["view"]), initialView)}`
    );
  }
  const filters = parseNearbyFilters(listing.params);
  const data = await getNearbyPageData({ locale, filters });

  return (
    <MapScreen
      locale={locale}
      filters={filters}
      data={data}
      initialView={initialView}
      providerTypeSlug={listing.typeSlug}
    />
  );
}
