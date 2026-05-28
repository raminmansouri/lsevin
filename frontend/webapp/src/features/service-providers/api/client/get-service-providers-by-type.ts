"use client";

import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import type { AttributeFilterValue } from "@/features/home/types";
import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import type { IServiceProvider } from "../../types";

export const getServiceProvidersByTypeClient = async (
  providerTypeId: string,
  search: string,
  page: number,
  locale: Locale,
  countryCode?: string,
  cityCode?: string,
  attributeFilters?: AttributeFilterValue[],
  options?: { pageSize?: number; forMap?: boolean }
) => {
  const searchParams = new URLSearchParams({
    ProviderTypeId: providerTypeId,
    PageNumber: (page || DEFAULT_PAGE_NUMBER).toString(),
    PageSize: String(options?.pageSize || DEFAULT_PAGE_SIZE),
    Locale: locale,
  });

  if (search) searchParams.set("Search", search);
  if (countryCode) searchParams.set("CountryCode", countryCode);
  if (cityCode) searchParams.set("CityCode", cityCode);
  if (attributeFilters && attributeFilters.length > 0) {
    searchParams.set("AttributeFilters", JSON.stringify(attributeFilters));
  }
  if (options?.forMap) searchParams.set("ForMap", "true");

  return await readData<PaginatedResult<IServiceProvider>>(
    `/service-providers/by-type?${searchParams.toString()}`
  );
};

const SERVICE_PROVIDERS_BY_TYPE_CACHE_TAG = "service-providers-by-type";
const queryServiceProvidersByTypeKey = (
  providerTypeId: string,
  search: string,
  countryCode: string | undefined,
  cityCode: string | undefined,
  attributeFilters: AttributeFilterValue[] | undefined,
  locale: Locale
) =>
  [
    SERVICE_PROVIDERS_BY_TYPE_CACHE_TAG,
    providerTypeId,
    search,
    countryCode,
    cityCode,
    attributeFilters,
    locale,
  ] as const;

export const useServiceProvidersByType = (
  providerTypeId: string,
  search: string,
  countryCode?: string,
  cityCode?: string,
  attributeFilters?: AttributeFilterValue[],
  locale?: Locale
) => {
  const options = infiniteQueryOptions<
    PaginatedResult<IServiceProvider>,
    IProblem
  >({
    queryKey: queryServiceProvidersByTypeKey(
      providerTypeId,
      search,
      countryCode,
      cityCode,
      attributeFilters,
      locale || "en"
    ),
    queryFn: ({ pageParam }) =>
      getServiceProvidersByTypeClient(
        providerTypeId,
        search,
        pageParam as number,
        locale || "en",
        countryCode,
        cityCode,
        attributeFilters
      ),
    initialPageParam: DEFAULT_PAGE_NUMBER,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const hasNextPage = currentPage < lastPage.totalPages;
      return hasNextPage ? currentPage + 1 : undefined;
    },
    enabled: !!providerTypeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const {
    data,
    error,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(options);

  // Flatten pages for easier consumption
  const flatData: IServiceProvider[] =
    data?.pages.flatMap((page) => page.items) ?? [];

  return {
    data: flatData,
    error,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Keep original pages structure for advanced use cases
    pages: data?.pages,
  };
};

export const useServiceProvidersByTypeCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_PROVIDERS_BY_TYPE_CACHE_TAG],
    });
  };

  const invalidateProviderTypeCache = (providerTypeId: string) => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_PROVIDERS_BY_TYPE_CACHE_TAG, providerTypeId],
    });
  };

  return {
    invalidateAllCache,
    invalidateProviderTypeCache,
  };
};
