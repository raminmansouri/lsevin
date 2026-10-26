import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  return buildPublicMetadata({
    locale,
    path: "/n/app/mobile/categories",
    title: `${t("allCategories")} | LSevin`,
    descriptions: [t("cantFindDescription")],
  });
}

// Truly static: the category tree is the same for every visitor of a locale
// (the `?parent=` deep-link is read on the client). Rebuilt at most hourly, and
// on demand via the `cp-category-groups` cache tag the underlying
// `unstable_cache` is already tagged with.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function CategoryBrowserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Reject transient failures so ISR retains the last successful tree. Never
  // publish an empty catalog as a successful render during a database outage.
  const data = await getCategoryBrowserGroups(locale);

  return (
    <Suspense fallback={null}>
      <CategoryBrowserClient
        categoryGroups={data.groups}
        totalCategories={data.totalCategories}
        totalProviders={data.totalProviders}
      />
      <SponsoredPlacementSlot locale={locale} placement="categories" />
    </Suspense>
  );
}
