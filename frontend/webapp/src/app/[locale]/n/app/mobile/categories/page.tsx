import { Metadata } from "next";

import { getCategoryBrowserGroups } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all active LSevin service categories.",
};

// export const revalidate = 300;

export default async function CategoryBrowserPage() {
  const categoryGroups = await getCategoryBrowserGroups();

  return <CategoryBrowserClient categoryGroups={categoryGroups} />;
}
