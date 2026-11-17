import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { alternatesFor } from "@/lib/seo/alternates";

import { ExploreContent } from "./explore-content";
import { getExplorePageData, parseExploreFilters } from "./explore.data";

import { absoluteUrl } from "@/lib/seo/alternates";
import { directoryHref } from "@/lib/routes/filter-paths";
import { otherFilters, resolveListingParams, resolvedSlugs } from "@/lib/seo/listing-params";
import { breadcrumbList, collectionPage, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";

import { exploreListedItems } from "./explore-schema";

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
    alternates: alternatesFor(locale, "/explore"),
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
  // ?category=<slug> filters in place; a provider type has its own page
  // (/specialties/<slug>). Old ?categoryId= / ?providerTypeId= links move once.
  const listing = await resolveListingParams(rawSearchParams);
  if (listing.stale || listing.providerTypeId) {
    permanentRedirect(`/${locale}${directoryHref(listing, resolvedSlugs(listing), otherFilters(rawSearchParams))}`);
  }
  const filters = parseExploreFilters(listing.params);
  const data = await getExplorePageData({ locale, filters });
  const pageUrl = absoluteUrl(locale, "/explore");
  const [t, brand] = await Promise.all([
    getTranslations({ locale, namespace: "Explore" }),
    getTranslations({ locale, namespace: "LocaleLayout" }).then((l) => l("title")),
  ]);

  return (
    <>
      <JsonLd
        data={graph(
          collectionPage({
            url: pageUrl,
            name: t("header.title"),
            description: t("header.subtitle"),
            locale,
            items: exploreListedItems(locale, data),
          }),
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: t("header.title"), url: pageUrl },
          ])
        )}
      />
      <ExploreContent locale={locale} filters={filters} data={data} pageUrl={pageUrl} />
    </>
  );
}
