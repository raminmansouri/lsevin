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

import { ServiceDefinition } from "../../types/service-definition";

// ServiceDefinitionOption interface to match the selector component
export interface ServiceDefinitionOption {
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;
  isActive?: boolean;
}

export const getServiceDefinitionsBySearchClient = async (
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

  return await readData<PaginatedResult<ServiceDefinition>>(
    `/service-definitions/search?${searchParams.toString()}`
  );
};

const SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG = "service-definitions-by-search";
const queryServiceDefinitionsBySearchKey = (search: string, locale: Locale) =>
  [SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useServiceDefinitionsBySearch = (
  search: string,
  locale: Locale
) => {
  const options = infiniteQueryOptions<
    PaginatedResult<ServiceDefinition>,
    IProblem
  >({
    queryKey: queryServiceDefinitionsBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getServiceDefinitionsBySearchClient(search, pageParam as number, locale),
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

  // Flatten the pages and transform to ServiceDefinitionOption format for easier use
  const flatData: ServiceDefinitionOption[] =
    data?.pages.flatMap((page) =>
      page.items.map((serviceDefinition) => ({
        id: serviceDefinition.id,
        name: serviceDefinition.name,
        description: serviceDefinition.description,
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
    // Keep original pages structure for advanced use cases
    pages: data?.pages,
  };
};

export const useServiceDefinitionsBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG],
    });
  };

  return {
    invalidateAllCache,
  };
};
