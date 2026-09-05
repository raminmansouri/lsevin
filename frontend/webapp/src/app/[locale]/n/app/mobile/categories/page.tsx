import { Suspense } from "react";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all active LSevin service categories.",
};

// Truly static: the category tree is the same for every visitor of a locale
// (the `?parent=` deep-link is read on the client). Rebuilt at most hourly, and
// on demand via the `cp-category-groups` cache tag the underlying
// `unstable_cache` is already tagged with.
export const dynamic = "force-static";
export const revalidate = 3600;

export default async function CategoryBrowserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Never let a transient DB hiccup at build time fail the whole build — an
  // empty tree renders fine and the next revalidation fills it in.
  const data = await getCategoryBrowserGroups().catch(() => ({
    groups: [],
    totalCategories: 0,
    totalProviders: 0,
  }));

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
