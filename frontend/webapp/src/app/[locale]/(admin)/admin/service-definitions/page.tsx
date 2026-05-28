import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import {
  ServiceDefinitionsAdminList,
  ServiceDefinitionsAdminListSkeleton,
} from "@/features/service-definitions/components/admin/service-definitions-admin-list";
import {
  getAdminServiceDefinitionCategoryOptions,
  getAdminServiceDefinitions,
} from "@/features/service-definitions/db/admin-service-definitions.queries";
import {
  transformPaginatedResultToPagination,
  transformSearchParamsToFilterParams,
} from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">,
): Promise<Metadata> {
  const { locale } = await props.params;

  try {
    const t = await getTranslations({ locale, namespace: "AdminGenerated" });
    return {
      title: t("serviceDefinitions"),
      description: t("serviceDefinitions"),
    };
  } catch {
    return {
      title: "Service definitions",
      description: "Manage service definitions",
    };
  }
}

interface ServiceDefinitionsPageProps extends PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

const ServiceDefinitionsPage = ({ params, searchParams }: ServiceDefinitionsPageProps) => {
  return (
    <Suspense fallback={<ServiceDefinitionsAdminListSkeleton />}>
      <SuspenseBoundary params={params} searchParams={searchParams} />
    </Suspense>
  );
};

const firstString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
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
  const categoryId = firstString((searchParamsData as Record<string, unknown>).categoryId);
  const searchText =
    firstString((searchParamsData as Record<string, unknown>).filters) ??
    firstString((searchParamsData as Record<string, unknown>).search) ??
    firstString((searchParamsData as Record<string, unknown>).q) ??
    firstString((searchParamsData as Record<string, unknown>).query);

  const [result, categoriesResult] = await Promise.all([
    getAdminServiceDefinitions(locale, {
      ...filterParams,
      filters: searchText ?? filterParams.filters,
      categoryId,
    }),
    getAdminServiceDefinitionCategoryOptions(locale),
  ]);

  return (
    <ServerFetchResult result={result}>
      {(serviceDefinitions) => (
        <ServiceDefinitionsAdminList
          items={serviceDefinitions.items}
          pagination={transformPaginatedResultToPagination(serviceDefinitions)}
          categories={categoriesResult.data ?? []}
        />
      )}
    </ServerFetchResult>
  );
};

export default ServiceDefinitionsPage;
