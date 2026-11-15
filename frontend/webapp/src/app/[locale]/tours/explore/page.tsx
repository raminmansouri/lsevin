import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { listTaxonomy } from "@/features/tours/server/actions/customer/state";
import { currentActor, ownerKey } from "@/features/tours/server/platform/access";
import {
  listDestinations,
  listRecentSearches,
  parseTourSearch,
  searchToParams,
  searchTours,
  wishlistIds,
} from "@/features/tours/server/platform/catalog";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { tourAlternates, tourCatalogLanguages } from "@/features/tours/server/platform/seo";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, collectionPage, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { ExploreView } from "@/features/tours/ui/customer/explore/explore-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.explore" });
  return { title: t("title"), ...tourAlternates(locale, "/tours/explore", await tourCatalogLanguages().catch(() => [])) };
}

/** Explore & search (C-021..C-030, AT-06). The URL is the whole search state, so it is shareable. */
export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await searchParams;
  const search = parseTourSearch(raw);
  const content = contentLocaleFor(locale);
  const actor = await currentActor();
  const owner = await ownerKey(actor);
  const [results, destinations, taxonomy, recentSearches, saved, settings] = await Promise.all([
    searchTours(search, content),
    listDestinations(content),
    listTaxonomy(locale),
    owner ? listRecentSearches(owner) : Promise.resolve([]),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
    getTourSettings(),
  ]);
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : (raw[k] as string | undefined));
  const [t, nav, brand] = await Promise.all([
    getTranslations({ locale, namespace: "TourApp.explore" }),
    getTranslations({ locale, namespace: "TourApp.nav" }),
    getTranslations({ locale, namespace: "LocaleLayout" }).then((l) => l("title")),
  ]);
  const pageUrl = absoluteUrl(locale, "/tours/explore");

  return (
    <>
    <JsonLd
      data={graph(
        collectionPage({
          url: pageUrl,
          name: t("title"),
          locale,
          items: results.items.map((tour) => ({
            url: absoluteUrl(locale, `/tours/t/${tour.slug}`),
            name: tour.title?.value ?? tour.slug,
            image: tour.coverUrl,
          })),
        }),
        breadcrumbList([
          { name: brand, url: absoluteUrl(locale) },
          { name: nav("brand"), url: absoluteUrl(locale, "/tours/intro") },
          { name: t("title"), url: pageUrl },
        ])
      )}
    />
    <ExploreView
      params={searchToParams(search).toString()}
      search={search}
      results={results}
      destinations={destinations}
      taxonomy={taxonomy}
      recentSearches={recentSearches.map((r) => ({ id: r.id, query: r.query, filters: r.filters }))}
      savedIds={saved}
      guideLanguages={[...new Set(settings.enabledLocales.map((l) => l.split("-")[0]))]}
      openFilters={one("filters") === "1"}
      view={one("view") === "map" ? "map" : "list"}
    />
    </>
  );
}
