import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MapScreen, requestedView } from "@/app/[locale]/n/app/mobile/map-discovery/map-screen";
import { getNearbyPageData, parseNearbyFilters } from "@/app/[locale]/n/app/mobile/map-discovery/nearby.data";
import { categoryBrowserHref, categoryProvidersHref, isTourismCategory, TOURS_HOME_PATH } from "@/features/categories/utils/category-href";
import { mapHref } from "@/lib/routes/filter-paths";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { INDEXABLE_CATEGORY_LOCALES } from "@/lib/seo/locale-eligibility";
import { otherFilters, resolveListingParams, resolvedSlugs } from "@/lib/seo/listing-params";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { resolvePublicEntity } from "@/lib/seo/public-slugs";

import { categoryTrail, loadCategoryBrowser } from "../../category-browser-screen";

// The businesses in a category and everything beneath it: /fa/categories/hotel/providers.
// It is the map screen opened on the list (?view=map opens the map); the other
// map filters are query values and make the page noindex (facet-headers.ts).
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadCategory(locale: string, slug: string) {
  const ref = await resolvePublicEntity("category", slug);
  if (!ref) notFound();
  const { data, tourismCategoryId } = await loadCategoryBrowser(locale);
  const all = data.groups.flatMap((group) => group.categories);
  const category = all.find((item) => item.id === ref.id);
  if (!category) notFound();
  return { ref, category, all, groups: data.groups, tourismCategoryId };
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale, slug } = await params;
  const { ref, category } = await loadCategory(locale, slug);
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  return buildPublicMetadata({
    locale,
    path: categoryProvidersHref(ref),
    title: `${t("providersIn", { name: category.name })} | ${brand}`,
    descriptions: [category.description, t("cantFindDescription")],
    eligibleLocales: INDEXABLE_CATEGORY_LOCALES,
  });
}

export default async function CategoryProvidersPage({ params, searchParams }: PageProps) {
  const [{ locale, slug }, raw] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const { ref, category, all, groups, tourismCategoryId } = await loadCategory(locale, slug);
  const initialView = requestedView(raw.view, "list");

  // Tourism and its subtree open the Tours app (C-001).
  if (isTourismCategory(ref.id, (id) => all.find((item) => item.id === id)?.parentId, tourismCategoryId)) {
    redirect(`/${locale}${TOURS_HOME_PATH}`);
  }

  // The category is the path. A type on top of it, or an old id parameter, moves
  // to the canonical map address; an id or a previous slug moves to the slug.
  const listing = await resolveListingParams({ ...raw, category: ref.slug ?? ref.id });
  if (
    listing.stale ||
    listing.providerTypeId ||
    raw.category !== undefined ||
    (ref.slug && slug !== ref.slug)
  ) {
    permanentRedirect(
      `/${locale}${mapHref(listing, resolvedSlugs(listing), otherFilters(raw, ["view"]), initialView)}`
    );
  }

  const filters = parseNearbyFilters(listing.params);
  const data = await getNearbyPageData({ locale, filters });
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const pageUrl = absoluteUrl(locale, categoryProvidersHref(ref));
  const name = t("providersIn", { name: category.name });

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name,
            ...(category.description ? { description: category.description } : {}),
            inLanguage: locale,
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: t("allCategories"), url: absoluteUrl(locale, "/categories") },
            ...categoryTrail(category, groups).map((node) => ({
              name: node.name,
              url: absoluteUrl(locale, node.childCount > 0 ? categoryBrowserHref(node) : categoryProvidersHref(node)),
            })),
          ])
        )}
      />
      <MapScreen
        locale={locale}
        filters={filters}
        data={data}
        initialView={initialView}
        providerTypeSlug={null}
        pageUrl={pageUrl}
      />
    </>
  );
}
