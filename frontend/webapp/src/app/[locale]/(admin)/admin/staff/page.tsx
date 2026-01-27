import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getStaff } from "@/features/staff/api/server/get-staff";
import StaffListTable, {
  StaffListTableSkeleton,
} from "@/features/staff/components/staff-list/staff-list-table";
import { STAFF_TRANSLATION_KEY } from "@/features/staff/constants";
import { Staff } from "@/features/staff/types";
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
    namespace: STAFF_TRANSLATION_KEY,
  });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const StaffPage = ({ searchParams }: PageProps) => {
  return (
    <Suspense fallback={<StaffListTableSkeleton />}>
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
      return getStaff({ locale, token }, filterParams);
    },
    {
      adminRequired: true,
    }
  );

  return (
    <ServerFetchResult<PaginatedResult<Staff>> result={result}>
      {(staff) => {
        return (
          <StaffListTable
            items={staff.items}
            pagination={transformPaginatedResultToPagination(staff)}
          />
        );
      }}
    </ServerFetchResult>
  );
};

export default StaffPage;
