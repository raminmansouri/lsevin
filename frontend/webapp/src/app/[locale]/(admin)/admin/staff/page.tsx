import { Suspense } from "react";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaff } from "@/features/staff/api/server/get-staff";
import StaffListTable, { StaffListTableSkeleton } from "@/features/staff/components/staff-list/staff-list-table";
import type { Staff } from "@/features/staff/types";
import { transformPaginatedResultToPagination, transformSearchParamsToFilterParams } from "@/lib/filter-params";
import type { FilterParams } from "@/types/filter";
import type { PaginatedResult } from "@/types/network";
import type { PageProps } from "@/types/next";

export const metadata: Metadata = {
  title: "Staff",
  description: "Manage staff, specialists, service assignments, availability, credentials, and media.",
};

const StaffPage = ({ searchParams, params }: PageProps) => {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Staff management" description="Manage specialists, provider assignments, services, availability, achievements, and gallery content." />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Suspense fallback={<StaffListTableSkeleton />}>
          <SuspenseBoundary searchParams={searchParams} params={params} />
        </Suspense>
      </CardContent>
    </Card>
  );
};

const SuspenseBoundary = async ({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) => {
  const [searchParamsData, routeParams] = await Promise.all([searchParams, params]);
  const filterParams: FilterParams = transformSearchParamsToFilterParams(searchParamsData);
  const result = await getStaff({ locale: routeParams.locale }, filterParams);

  return (
    <ServerFetchResult<PaginatedResult<Staff>> result={result}>
      {(staff) => (
        <StaffListTable
          items={staff.items}
          pagination={transformPaginatedResultToPagination(staff)}
        />
      )}
    </ServerFetchResult>
  );
};

export default StaffPage;
