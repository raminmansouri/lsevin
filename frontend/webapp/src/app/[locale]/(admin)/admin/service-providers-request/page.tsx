import React, { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceProviderRequestsByAdmin } from "@/features/service-providers/api/server/get-service-provider-requests-by-admin";
import RequestsTable, {
  RequestsDataTableSkeleton,
} from "@/features/service-providers/components/requests/requests-table";
import { IServiceProviderRequestAdmin } from "@/features/service-providers/types";
import { REQUESTS_TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import {
  transformPaginatedResultToPagination,
  transformSearchParamsToFilterParams,
} from "@/lib/filter-params";
import { FilterParams, SearchParams } from "@/types/filter";
import { PaginatedResult } from "@/types/network";
import { LocalePageProps, SearchComponentProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: REQUESTS_TRANSLATION_KEY,
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

const AdminServiceProviderRequestsPage = ({
  params,
  searchParams,
}: SearchComponentProps) => {
  return (
    <Suspense fallback={<RequestsDataTableSkeleton />}>
      <LocaleBoundary
        params={params}
        tanslationNameSpace={REQUESTS_TRANSLATION_KEY}
      >
        {(t) => (
          <div>
            <PageHeader title={t("title")} />
            <Suspense fallback={<RequestsDataTableSkeleton />}>
              <SuspenseBoundary searchParams={searchParams} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
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

  const result = await withBaseHeaders((locale, token) =>
    getServiceProviderRequestsByAdmin({ locale, token }, filterParams)
  );

  return (
    <ServerFetchResult<PaginatedResult<IServiceProviderRequestAdmin>>
      result={result}
    >
      {(data) => (
        <RequestsTable
          items={data.items}
          pagination={transformPaginatedResultToPagination(data)}
        />
      )}
    </ServerFetchResult>
  );
};

export default AdminServiceProviderRequestsPage;
