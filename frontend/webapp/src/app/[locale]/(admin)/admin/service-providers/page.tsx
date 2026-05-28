import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { getAdminServiceProviders } from "@/features/service-providers/db/admin-service-providers.queries";
import {
  ServiceProvidersAdminList,
  ServiceProvidersAdminListSkeleton,
} from "@/features/service-providers/components/admin/service-providers-admin-list";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { providerTypeSearchParamsCache } from "@/features/service-providers/types/filters";
import {
  transformPaginatedResultToPagination,
  transformSearchParamsToFilterParams,
} from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });

  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

interface ServiceProvidersPageProps extends PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

const ServiceProvidersPage = ({ params, searchParams }: ServiceProvidersPageProps) => {
  return (
    <Suspense fallback={<ServiceProvidersAdminListSkeleton />}>
      <SuspenseBoundary params={params} searchParams={searchParams} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) => {
  const [{ locale }, searchParamsData] = await Promise.all([params, searchParams]);
  const filterParams: FilterParams = transformSearchParamsToFilterParams(searchParamsData);
  const { providerTypeIds } = providerTypeSearchParamsCache.parse(searchParamsData);
  const searchText =
    typeof searchParamsData.filters === "string"
      ? searchParamsData.filters
      : typeof searchParamsData.search === "string"
        ? searchParamsData.search
        : typeof searchParamsData.q === "string"
          ? searchParamsData.q
          : typeof searchParamsData.query === "string"
            ? searchParamsData.query
            : undefined;

  const result = await getAdminServiceProviders(locale, {
    ...filterParams,
    filters: searchText ?? filterParams.filters,
    providerTypeIds,
  });

  return (
    <ServerFetchResult result={result}>
      {(serviceProviders) => (
        <ServiceProvidersAdminList
          items={serviceProviders.items}
          pagination={transformPaginatedResultToPagination(serviceProviders)}
        />
      )}
    </ServerFetchResult>
  );
};

export default ServiceProvidersPage;
