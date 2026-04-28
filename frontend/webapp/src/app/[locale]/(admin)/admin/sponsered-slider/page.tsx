import { Suspense } from "react";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSponseredSlider } from "@/features/sponsered-slider/api/server/get-sponsered-slider";
import SponseredSliderListTable, { SponseredSliderListTableSkeleton } from "@/features/sponsered-slider/components/sponsered-slider-list/sponsered-slider-list-table";
import type { SponseredSliderItem } from "@/features/sponsered-slider/types";
import { transformPaginatedResultToPagination, transformSearchParamsToFilterParams } from "@/lib/filter-params";
import type { FilterParams } from "@/types/filter";
import type { PaginatedResult } from "@/types/network";
import type { PageProps } from "@/types/next";

export const metadata: Metadata = {
  title: "Sponsored Slider",
  description: "Manage image, GIF, and video banners displayed on the home page.",
};

const SponseredSliderPage = ({ searchParams, params }: PageProps) => {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Sponsored home slider" description="Manage the media.sponsered_slider records used for home page banners, videos, GIFs, and image campaigns." />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Suspense fallback={<SponseredSliderListTableSkeleton />}>
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
  const result = await getSponseredSlider({ locale: routeParams.locale }, filterParams);

  return (
    <ServerFetchResult<PaginatedResult<SponseredSliderItem>> result={result}>
      {(items) => (
        <SponseredSliderListTable
          items={items.items}
          pagination={transformPaginatedResultToPagination(items)}
        />
      )}
    </ServerFetchResult>
  );
};

export default SponseredSliderPage;
