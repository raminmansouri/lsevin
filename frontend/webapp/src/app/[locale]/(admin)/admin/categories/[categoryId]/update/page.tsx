import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getCategoryById } from "@/features/categories/api/server/get-category-by-id";
import {
  CategoryForm,
  CategoryFormSkeleton,
} from "@/features/categories/components/category-form";
import { CATEGORY_TRANSLATION_KEY } from "@/features/categories/constants";
import { CategoryDetails } from "@/features/categories/types/category";
import { PageParams, PageProps } from "@/types/next";

interface UpdateCategoryPageProps extends PageParams {
  categoryId: string;
}

export async function generateMetadata(
  props: PageProps<UpdateCategoryPageProps>
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: CATEGORY_TRANSLATION_KEY,
  });

  return {
    title: t("update.page.title"),
    description: t("update.page.description"),
  };
}

const UpdateCategoryPage = async ({
  params,
}: PageProps<UpdateCategoryPageProps>) => {
  return (
    <Suspense fallback={<UpdateCategoryPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdateCategoryPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between">
        <CardTitle>
          <Skeleton className="h-10 w-32" />
        </CardTitle>
      </CardHeader>
      <CategoryFormSkeleton />
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; categoryId: string }>;
}) => {
  const { categoryId } = await params;

  const result = await withBaseHeaders((locale, token) => {
    return getCategoryById(categoryId, { locale, token });
  });

  return (
    <LocaleBoundary
      params={params}
      tanslationNameSpace={CATEGORY_TRANSLATION_KEY}
    >
      {(t) => (
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title={t("update.title")} />
            </CardTitle>
          </CardHeader>
          <ServerFetchResult<CategoryDetails> singleData result={result}>
            {(category) => <CategoryForm category={category} />}
          </ServerFetchResult>
        </Card>
      )}
    </LocaleBoundary>
  );
};

export default UpdateCategoryPage;
