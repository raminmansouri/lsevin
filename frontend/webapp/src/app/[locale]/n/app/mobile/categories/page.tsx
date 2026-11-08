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
import { INDEXABLE_CATEGORY_LOCALES } from "@/lib/seo/locale-eligibility";
import { PageFaq } from "@/features/site-content/components/faq-section";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  // Localized brand (السوین on Persian pages), not a hard-coded Latin name.
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))(
    "title"
  );
  return buildPublicMetadata({
    locale,
    path: "/categories",
    title: `${t("allCategories")} | ${brand}`,
    descriptions: [t("cantFindDescription")],
    eligibleLocales: INDEXABLE_CATEGORY_LOCALES,
  });
}

// Rendered per request; the tree itself comes from the `cp-category-groups`
// data cache (300 s), so this stays cheap. Not ISR: the image build has no
// database, so a prerendered copy is an empty tree that would be served as
// fresh for the whole revalidate window after every deploy.
export const dynamic = "force-dynamic";

export default async function CategoryBrowserPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  // ?parent=<id> opens a category's subcategories: show that category's FAQ.
  const rawParent = (await searchParams)?.parent;
  const parentCandidate = Array.isArray(rawParent) ? rawParent[0] : rawParent;
  const parentId =
    parentCandidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(parentCandidate)
      ? parentCandidate
      : null;
  setRequestLocale(locale);
  // A database hiccup shows an empty tree for that one request only: the page
  // is dynamic, so nothing empty is cached, and the data cache rejects failures.
  // Tourism opens the Tours sub-application (C-001); its id is configuration, not code.
  const [t, data, tourismCategoryId] = await Promise.all([
    getTranslations({ locale, namespace: "CategoryBrowser" }),
    getCategoryBrowserGroups(locale).catch(() => ({
      groups: [],
      totalCategories: 0,
      totalProviders: 0,
    })),
    getTourSettings()
      .then((s) => s.tourismCategoryId)
      .catch(() => null),
  ]);

  const pageT = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const pageUrl = absoluteUrl(locale, "/categories");
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
            { name: brand, url: absoluteUrl(locale) },
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
      <PageFaq
        target={parentId ? { scope: "category", entityId: parentId } : { scope: "categories" }}
        locale={locale}
        pageUrl={parentId ? undefined : pageUrl}
      />
    </Suspense>
  );
}
