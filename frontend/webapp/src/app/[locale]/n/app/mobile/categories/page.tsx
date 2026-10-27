import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { getTourSettings } from "@/features/tours/server/platform/settings";


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
  // The exception is `next build`: the image build has no database, so failing
  // here fails the whole deploy. Bake the empty tree; the first request after
  // the revalidate window regenerates it (same rule as the home page rails).
  const data = await getCategoryBrowserGroups(locale).catch((error) => {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error;
    return { groups: [], totalCategories: 0, totalProviders: 0 };
  });

  // Tourism opens the Tours sub-application (C-001); its id is configuration, not code.
  const tourismCategoryId = await getTourSettings()
    .then((s) => s.tourismCategoryId)
    .catch(() => null);

  return (
    <Suspense fallback={null}>
      <CategoryBrowserClient
        categoryGroups={data.groups}
        totalCategories={data.totalCategories}
        totalProviders={data.totalProviders}
        tourismCategoryId={tourismCategoryId}
      />
      <SponsoredPlacementSlot locale={locale} placement="categories" />
    </Suspense>
  );
}
