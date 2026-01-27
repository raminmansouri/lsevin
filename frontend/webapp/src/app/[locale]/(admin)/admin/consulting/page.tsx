import React, { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getConsultingsByAdmin } from "@/features/consulting/api/server/get-consultings-by-admin";
import ConsultingTable, {
  ConsultingDataTableSkeleton,
} from "@/features/consulting/components/consulting-table";
import { IConsulting } from "@/features/consulting/types";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
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
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  return {
    title: t("page.adminTitle"),
    description: t("page.adminDescription"),
  };
}

const AdminConsultingPage = ({
  params,
  searchParams,
}: SearchComponentProps) => {
  return (
    <Suspense fallback={<ConsultingDataTableSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {(t) => (
          <div>
            <PageHeader title={t("page.adminTitle")} />
            <Suspense fallback={<ConsultingDataTableSkeleton />}>
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

  const consultings = await withBaseHeaders((locale, token) =>
    getConsultingsByAdmin({ locale, token }, filterParams)
  );

  return (
    <ServerFetchResult<PaginatedResult<IConsulting>> result={consultings}>
      {(consultings) => (
        <ConsultingTable
          items={consultings.items}
          pagination={transformPaginatedResultToPagination(consultings)}
        />
      )}
    </ServerFetchResult>
  );
};

export default AdminConsultingPage;
