import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getCategories } from "@/features/categories/api/server/get-categories";
import { getCategoryHomepageFlags } from "@/features/categories/db/homepage-display";
import CategoryListTable, {
  CategoryListTableSkeleton,
} from "@/features/categories/components/category-list/category-list-table";
import { CATEGORY_TRANSLATION_KEY } from "@/features/categories/constants";
import { Category } from "@/features/categories/types/category";
import {
  transformPaginatedResultToPagination,
  transformSearchParamsToFilterParams,
} from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { PaginatedResult } from "@/types/network";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: CATEGORY_TRANSLATION_KEY,
  });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const PersonsPage = ({ searchParams }: PageProps) => {
  return (
    <Suspense fallback={<CategoryListTableSkeleton />}>
      <SuspenseBoundary searchParams={searchParams}></SuspenseBoundary>
    </Suspense>
  );
};

const SuspenseBoundary = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const searchParamsData = await searchParams;
  const filterParams: FilterParams =
    transformSearchParamsToFilterParams(searchParamsData);

  const result = await withBaseHeaders(
    async (locale, token) => {
      return getCategories({ locale, token }, filterParams);
    },
    {
      adminRequired: true,
    }
  );

  return (
    <ServerFetchResult<PaginatedResult<Category>> result={result}>
      {(categories) => <CategoryListWithHomepageFlags categories={categories} />}
    </ServerFetchResult>
  );
};

// Merges the homepage display flag (read via direct SQL, since the categories
// API does not expose it) into each list item before rendering the table.
const CategoryListWithHomepageFlags = async ({
  categories,
}: {
  categories: PaginatedResult<Category>;
}) => {
  const flags = await getCategoryHomepageFlags(
    categories.items.map((item) => item.categoryId)
  );
  const items = categories.items.map((item) => ({
    ...item,
    displayInHomePage: flags[item.categoryId] ?? true,
  }));

  return (
    <CategoryListTable
      items={items}
      pagination={transformPaginatedResultToPagination(categories)}
    />
  );
};

export default PersonsPage;
