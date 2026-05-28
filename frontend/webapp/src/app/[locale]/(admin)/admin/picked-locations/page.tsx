import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import {
  PickedLocationAdminList,
  PickedLocationAdminListSkeleton,
} from "@/features/picked-locations/components/picked-location-list";
import { getPickedLocationsFromDb } from "@/features/picked-locations/db/picked-location-repository";
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
      title: t("pickedLocations"),
      description: t("pickedLocations"),
    };
  } catch {
    return {
      title: "Picked locations",
      description: "Manage picked locations",
    };
  }
}

interface PickedLocationsPageProps extends PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

const PickedLocationsPage = ({ params, searchParams }: PickedLocationsPageProps) => {
  return (
    <Suspense fallback={<PickedLocationAdminListSkeleton />}>
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
  const searchText =
    firstString((searchParamsData as Record<string, unknown>).filters) ??
    firstString((searchParamsData as Record<string, unknown>).search) ??
    firstString((searchParamsData as Record<string, unknown>).q) ??
    firstString((searchParamsData as Record<string, unknown>).query);

  const result = await getPickedLocationsFromDb(locale, {
    ...filterParams,
    filters: searchText ?? filterParams.filters,
  });

  return (
    <ServerFetchResult result={result}>
      {(pickedLocations) => (
        <PickedLocationAdminList
          items={pickedLocations.items}
          pagination={transformPaginatedResultToPagination(pickedLocations)}
        />
      )}
    </ServerFetchResult>
  );
};

export default PickedLocationsPage;
