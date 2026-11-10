import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { categoryBrowserHref } from "@/features/categories/utils/category-href";
import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import type {
  CategoryBrowserCategory,
  CategoryBrowserGroup,
} from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";
import { PageFaq } from "@/features/site-content/components/faq-section";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";
import { DesktopCategoryBrowser } from "@/features/web-desktop/categories/DesktopCategoryBrowser";
import { DesktopSponsoredSection } from "@/features/web-desktop/home/DesktopSponsoredSection";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { seoOrigin } from "@/lib/seo/origin";

export type CategoryBrowserData = {
  groups: CategoryBrowserGroup[];
  totalCategories: number;
  totalProviders: number;
};

/**
 * The tree (from the `cp-category-groups` data cache) and the Tourism root.
 * A database hiccup shows an empty tree for that one request only: the pages
 * are dynamic, so nothing empty is cached, and the data cache rejects failures.
 * Tourism opens the Tours sub-application (C-001); its id is configuration.
 */
export async function loadCategoryBrowser(locale: string) {
  const [data, tourismCategoryId] = await Promise.all([
    getCategoryBrowserGroups(locale).catch((): CategoryBrowserData => ({
      groups: [],
      totalCategories: 0,
      totalProviders: 0,
    })),
    getTourSettings()
      .then((settings) => settings.tourismCategoryId)
      .catch(() => null),
  ]);
  return { data, tourismCategoryId };
}

/** The category's ancestors from the root down, ending with the category itself. */
export function categoryTrail(category: CategoryBrowserCategory, groups: CategoryBrowserGroup[]) {
  const byId = new Map(groups.flatMap((group) => group.categories).map((item) => [item.id, item]));
  const trail: CategoryBrowserCategory[] = [];
  let node: CategoryBrowserCategory | undefined = category;
  for (let depth = 0; node && depth < 20; depth += 1) {
    trail.unshift(node);
    node = node.parentId ? byId.get(node.parentId) : undefined;
  }
  return trail;
}

/**
 * The category browser, at the root (/categories) or opened on one category's
 * subcategories (/categories/<slug>).
 */
export async function CategoryBrowserScreen({
  locale,
  data,
  tourismCategoryId,
  parent,
}: {
  locale: string;
  data: CategoryBrowserData;
  tourismCategoryId: string | null;
  parent: CategoryBrowserCategory | null;
}) {
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const rootUrl = absoluteUrl(locale, "/categories");
  const pageUrl = parent ? absoluteUrl(locale, categoryBrowserHref(parent)) : rootUrl;
  // The names this page lists: the top level, or the category's subcategories.
  const listed = data.groups
    .flatMap((group) => group.categories)
    .filter((category) => (parent ? category.parentId === parent.id : !category.parentId) && category.name)
    .slice(0, 50);
  const trail = parent ? categoryTrail(parent, data.groups) : [];

  return (
    <Suspense fallback={null}>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: parent?.name || t("allCategories"),
            ...(parent?.description ? { description: parent.description } : {}),
            inLanguage: locale,
            isPartOf: { "@id": `${seoOrigin()}/#website` },
            ...(listed.length
              ? {
                  mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: listed.length,
                    itemListElement: listed.map((category, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      name: category.name,
                      url: absoluteUrl(locale, categoryBrowserHref(category)),
                    })),
                  },
                }
              : {}),
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: t("allCategories"), url: rootUrl },
            ...trail.map((node) => ({ name: node.name, url: absoluteUrl(locale, categoryBrowserHref(node)) })),
          ])
        )}
      />
      <div className="xl:hidden">
        <CategoryBrowserClient
          categoryGroups={data.groups}
          totalCategories={data.totalCategories}
          totalProviders={data.totalProviders}
          tourismCategoryId={tourismCategoryId}
          parentId={parent?.id ?? null}
        />
        <SponsoredPlacementSlot locale={locale} placement="categories" />
      </div>
      <DesktopCategoryBrowser
        categoryGroups={data.groups}
        totalCategories={data.totalCategories}
        totalProviders={data.totalProviders}
        tourismCategoryId={tourismCategoryId}
        parentId={parent?.id ?? null}
      />
      <div className="lsd hidden pb-14 xl:block">
        <DesktopSponsoredSection locale={locale} placement="categories" />
      </div>
      <PageFaq
        target={parent ? { scope: "category", entityId: parent.id } : { scope: "categories" }}
        locale={locale}
        pageUrl={pageUrl}
      />
    </Suspense>
  );
}
