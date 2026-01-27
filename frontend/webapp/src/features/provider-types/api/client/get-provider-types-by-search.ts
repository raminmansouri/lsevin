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

import { ProviderTypeFiltered } from "../../types/provider-type";

// ProviderTypeOption interface to match the selector component
export interface ProviderTypeOption {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export const getProviderTypesBySearchClient = async (
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

  return await readData<PaginatedResult<ProviderTypeFiltered>>(
    `/provider-types/search?${searchParams.toString()}`
  );
};

const PROVIDER_TYPES_BY_SEARCH_CACHE_TAG = "provider-types-by-search";
const queryProviderTypesBySearchKey = (search: string, locale: Locale) =>
  [PROVIDER_TYPES_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useProviderTypesBySearch = (search: string, locale: Locale) => {
  const options = infiniteQueryOptions<
    PaginatedResult<ProviderTypeFiltered>,
    IProblem
  >({
    queryKey: queryProviderTypesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getProviderTypesBySearchClient(search, pageParam as number, locale),
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

  // Flatten the pages and transform to ProviderTypeOption format for easier use
  const flatData: ProviderTypeOption[] =
    data?.pages.flatMap((page) =>
      page.items.map((providerType) => ({
        id: providerType.id,
        name: providerType.name,
        description: providerType.description,
        isActive: providerType.isActive,
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

export const useProviderTypesBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [PROVIDER_TYPES_BY_SEARCH_CACHE_TAG],
    });
  };

  return {
    invalidateAllCache,
  };
};
