import { Metadata } from "next";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all active LSevin service categories.",
};

// export const revalidate = 300;

function firstParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

export default async function CategoryBrowserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [data, resolvedSearchParams] = await Promise.all([
    getCategoryBrowserGroups(),
    searchParams,
  ]);

  return (
    <CategoryBrowserClient
      categoryGroups={data.groups}
      totalCategories={data.totalCategories}
      totalProviders={data.totalProviders}
      // Home-page cards link straight to a node so the shelf and this screen are
      // the same tree seen from two places, rather than two separate entry points.
      initialParentId={firstParam(resolvedSearchParams.parent)}
    />
  );
}
