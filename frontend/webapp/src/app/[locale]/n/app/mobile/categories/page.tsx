import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { seoOrigin } from "@/lib/seo/origin";
import { getTourSettings } from "@/features/tours/server/platform/settings";

import { DesktopCategoryBrowser } from "@/features/web-desktop/categories/DesktopCategoryBrowser";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  // Localized brand (السوین on Persian pages), not a hard-coded Latin name.
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  return buildPublicMetadata({
    locale,
    path: "/n/app/mobile/categories",
    title: `${t("allCategories")} | ${brand}`,
    descriptions: [t("cantFindDescription")],
  });
}

// Rendered per request; the tree itself comes from the `cp-category-groups`
// data cache (300 s), so this stays cheap. Not ISR: the image build has no
// database, so a prerendered copy is an empty tree that would be served as
// fresh for the whole revalidate window after every deploy.
export const dynamic = "force-dynamic";

export default async function CategoryBrowserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // A database hiccup shows an empty tree for that one request only: the page
  // is dynamic, so nothing empty is cached, and the data cache rejects failures.
  const data = await getCategoryBrowserGroups(locale).catch(() => ({
    groups: [],
    totalCategories: 0,
    totalProviders: 0,
  }));

  // Tourism opens the Tours sub-application (C-001); its id is configuration, not code.
  const tourismCategoryId = await getTourSettings()
    .then((s) => s.tourismCategoryId)
    .catch(() => null);

  const pageT = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const pageUrl = absoluteUrl(locale, "/n/app/mobile/categories");
  // Top-level names only: the facts this page shows, no counts or claims.
  const topCategories = data.groups
    .flatMap((group) => group.categories)
    .filter((category) => !category.parentId && category.name)
    .slice(0, 50);

  return (
    <Suspense fallback={null}>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: pageT("allCategories"),
            inLanguage: locale,
            isPartOf: { "@id": `${seoOrigin()}/#website` },
            ...(topCategories.length
              ? {
                  mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: topCategories.length,
                    itemListElement: topCategories.map((category, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      name: category.name,
                    })),
                  },
                }
              : {}),
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
            { name: pageT("allCategories"), url: pageUrl },
          ])
        )}
      />
      <div className="xl:hidden">
        <CategoryBrowserClient
          categoryGroups={data.groups}
          totalCategories={data.totalCategories}
          totalProviders={data.totalProviders}
          tourismCategoryId={tourismCategoryId}
        />
        <SponsoredPlacementSlot locale={locale} placement="categories" />
      </div>
      <DesktopCategoryBrowser
        categoryGroups={data.groups}
        totalCategories={data.totalCategories}
        totalProviders={data.totalProviders}
        tourismCategoryId={tourismCategoryId}
      />
      <div className="lsd hidden pb-14 xl:block">
        <DesktopSponsoredSection locale={locale} placement="categories" />
      </div>
    </Suspense>
  );
}
