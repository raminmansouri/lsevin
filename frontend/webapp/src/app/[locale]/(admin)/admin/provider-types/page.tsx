import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getProviderTypes } from "@/features/provider-types/api/server/get-provider-types";
import ProviderTypeListTable, {
  ProviderTypeListTableSkeleton,
} from "@/features/provider-types/components/provider-type-list/provider-type-list-table";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "@/features/provider-types/constants";
import { ProviderTypeFiltered } from "@/features/provider-types/types/provider-type";
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
    namespace: PROVIDER_TYPE_TRANSLATION_KEY,
  });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const ProviderTypesPage = ({ searchParams }: PageProps) => {
  return (
    <Suspense fallback={<ProviderTypeListTableSkeleton />}>
      <SuspenseBoundary searchParams={searchParams} />
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
      return getProviderTypes({ locale, token }, filterParams);
    },
    {
      adminRequired: true,
    }
  );

  return (
    <ServerFetchResult<PaginatedResult<ProviderTypeFiltered>> result={result}>
      {(providerTypes) => {
        return (
          <ProviderTypeListTable
            items={providerTypes.items}
            pagination={transformPaginatedResultToPagination(providerTypes)}
          />
        );
      }}
    </ServerFetchResult>
  );
};

export default ProviderTypesPage;
