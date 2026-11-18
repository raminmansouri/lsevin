import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { parseStaySearch } from "@/features/stays/domain/search";
import { wishlistIds } from "@/features/stays/server/catalog";
import { cachedAmenities, cachedCities, cachedLandmarks, catalogSearch, catalogSuggestions } from "@/features/stays/server/cache";
import { logUnexpected } from "@/features/stays/server/errors";
import { ExploreView } from "@/features/stays/ui/explore/explore-view";
import { alternatesFor } from "@/lib/seo/alternates";
import { PageBreadcrumbs } from "@/lib/seo/page-breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  // Search results are endless URL combinations: never indexed, links followed.
  // City pages (/stays/city/<slug>) are the indexable landing pages.
  return {
    title: t("exploreTitle"),
    description: t("description"),
    robots: { index: false, follow: true },
    alternates: { canonical: alternatesFor(locale, "/stays/explore").canonical },
  };
}

export default async function StaysExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const search = parseStaySearch(await searchParams);
  const content = contentLocaleFor(locale);
  const t = await getTranslations({ locale, namespace: "StayApp.explore" });
  const actor = await currentActor();
  const [cities, amenities, saved] = await Promise.all([
    cachedCities(content).catch(() => []),
    cachedAmenities(content).catch(() => []),
    actor.userId ? wishlistIds(actor.userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
  ]);
  // A failed search shows a retry state (not "no stays"), so an outage never looks like an empty catalog.
  const result = await catalogSearch(search, content).catch((e) => {
    logUnexpected("stays.explore", e);
    return null;
  });
  const city = cities.find((c) => c.slug === search.city);
  const landmarkCity = search.city ?? result?.anchor?.citySlug ?? null;
  const [landmarks, suggestions] = await Promise.all([
    landmarkCity ? cachedLandmarks(landmarkCity, content).catch(() => []) : Promise.resolve([]),
    result && result.total === 0
      ? catalogSuggestions(search, content).catch((e) => {
          logUnexpected("stays.explore.suggestions", e);
          return null;
        })
      : Promise.resolve(null),
  ]);
  const stays = (await getTranslations({ locale, namespace: "StayApp.nav" }))("stays");
  return (
    <>
    <PageBreadcrumbs
      locale={locale}
      trail={[
        { name: stays, path: "/stays/intro" },
        { name: t("title"), path: "/stays/explore" },
      ]}
    />
    <ExploreView
      search={search}
      result={result}
      cities={cities.map((c) => ({ slug: c.slug, name: c.name, region: c.region }))}
      cityCounts={cities.map((c) => ({ slug: c.slug, name: c.name, count: c.propertyCount }))}
      amenities={amenities}
      landmarks={landmarks}
      suggestions={suggestions}
      savedIds={saved}
      heading={city ? t("titleIn", { city: city.name }) : t("title")}
    />
    </>
  );
}
