import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceProviders } from "@/features/service-providers/api/server/get-service-providers";
import ServiceProvidersListTable, {
  ServiceProvidersListTableSkeleton,
} from "@/features/service-providers/components/service-providers-list/service-providers-list-table";
import { ServiceProvider } from "@/features/service-providers/types";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { providerTypeSearchParamsCache } from "@/features/service-providers/types/filters";
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
    namespace: TRANSLATION_KEY,
  });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const ServiceProvidersPage = ({ searchParams }: PageProps) => {
  return (
    <Suspense fallback={<ServiceProvidersListTableSkeleton />}>
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

  const { providerTypeIds } =
    providerTypeSearchParamsCache.parse(searchParamsData);

  const result = await withBaseHeaders(
    async (locale, token) => {
      return getServiceProviders(
        { locale, token },
        {
          ...filterParams,
          providerTypeIds,
        }
      );
    },
    {
      adminRequired: true,
    }
  );

  return (
    <ServerFetchResult<PaginatedResult<ServiceProvider>> result={result}>
      {(serviceProviders) => {
        return (
          <ServiceProvidersListTable
            items={serviceProviders.items}
            pagination={transformPaginatedResultToPagination(serviceProviders)}
          />
        );
      }}
    </ServerFetchResult>
  );
};

export default ServiceProvidersPage;
