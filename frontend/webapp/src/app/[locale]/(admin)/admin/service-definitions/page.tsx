import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import ServiceDefinitionListTable, {
  ServiceDefinitionListTableSkeleton,
} from "@/features/service-definitions/components/service-definition-list/service-definition-list-table";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "@/features/service-definitions/constants";
import { ServiceDefinition } from "@/features/service-definitions/types/service-definition";
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
    namespace: SERVICE_DEFINITION_TRANSLATION_KEY,
  });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const ServiceDefinitionsPage = ({ searchParams }: PageProps) => {
  return (
    <Suspense fallback={<ServiceDefinitionListTableSkeleton />}>
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
      return getServiceDefinitions({ locale, token }, filterParams);
    },
    {
      adminRequired: true,
    }
  );

  return (
    <ServerFetchResult<PaginatedResult<ServiceDefinition>> result={result}>
      {(serviceDefinitions) => {
        return (
          <ServiceDefinitionListTable
            items={serviceDefinitions.items}
            pagination={transformPaginatedResultToPagination(
              serviceDefinitions
            )}
          />
        );
      }}
    </ServerFetchResult>
  );
};

export default ServiceDefinitionsPage;
