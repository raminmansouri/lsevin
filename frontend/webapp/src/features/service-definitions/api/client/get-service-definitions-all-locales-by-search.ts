import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import {
  ServiceDefinitionOptionWithAllLocales,
  ServiceDefinitionWithAllLocales,
} from "../../types/service-definition";

// Re-export types for convenience
export type { ServiceDefinitionOptionWithAllLocales };

export const getServiceDefinitionsAllLocalesBySearchClient = async (
  search: string,
  page: number,
  locale: Locale
) => {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("Search", search);
  }
  searchParams.set("PageNumber", (page || DEFAULT_PAGE_NUMBER).toString());
  searchParams.set("PageSize", DEFAULT_PAGE_SIZE.toString());
  searchParams.set("Locale", locale);

  return await readData<PaginatedResult<ServiceDefinitionWithAllLocales>>(
    `/service-definitions/search-all?${searchParams.toString()}`
  );
};

const SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG =
  "service-definitions-all-locales-by-search";

const queryServiceDefinitionsAllLocalesBySearchKey = (
  search: string,
  locale: Locale
) =>
  [
    SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG,
    search,
    locale,
  ] as const;

export const useServiceDefinitionsAllLocalesBySearch = (
  search: string,
  locale: Locale
) => {
  const options = infiniteQueryOptions<
    PaginatedResult<ServiceDefinitionWithAllLocales>,
    IProblem
  >({
    queryKey: queryServiceDefinitionsAllLocalesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getServiceDefinitionsAllLocalesBySearchClient(
        search,
        pageParam as number,
        locale
      ),
    initialPageParam: DEFAULT_PAGE_NUMBER,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const hasNextPage = currentPage < lastPage.totalPages;
      return hasNextPage ? currentPage + 1 : undefined;
    },
    enabled: true,
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

  // Transform to ServiceDefinitionOptionWithAllLocales format
  // Keep LocalizedContentResponse structure intact
  const flatData: ServiceDefinitionOptionWithAllLocales[] =
    data?.pages.flatMap((page) =>
      page.items.map((serviceDefinition) => ({
        id: serviceDefinition.id,
        name: serviceDefinition.name, // LocalizedContentResponse
        description: serviceDefinition.description, // LocalizedContentResponse
        categoryName: serviceDefinition.categoryName,
        price: serviceDefinition.basePrice,
        currency: serviceDefinition.currency,
        durationMinutes: serviceDefinition.durationMinutes,
        isActive: serviceDefinition.isActive,
      }))
    ) ?? [];

  return {
    data: flatData,
    error,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pages: data?.pages,
  };
};

export const useServiceDefinitionsAllLocalesBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG],
    });
  };

  return {
    invalidateAllCache,
  };
};
