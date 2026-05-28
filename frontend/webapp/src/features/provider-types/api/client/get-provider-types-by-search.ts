
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { ProviderTypeFiltered } from "../../types/provider-type";

export interface ProviderTypeOption {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  imagePreviewUrl?: string;
}

export const getProviderTypesBySearchClient = async (
  search: string,
  page: number,
  locale: Locale
) => {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set("Search", search);
  searchParams.set("PageNumber", (page || DEFAULT_PAGE_NUMBER).toString());
  searchParams.set("PageSize", DEFAULT_PAGE_SIZE.toString());
  searchParams.set("Locale", locale);

  const response = await fetch(`/api/admin/provider-types/search?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) throw (await response.json()) as IProblem;
  return (await response.json()) as PaginatedResult<ProviderTypeFiltered>;
};

const PROVIDER_TYPES_BY_SEARCH_CACHE_TAG = "provider-types-by-search";
const queryProviderTypesBySearchKey = (search: string, locale: Locale) =>
  [PROVIDER_TYPES_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useProviderTypesBySearch = (search: string, locale: Locale) => {
  const options = infiniteQueryOptions<PaginatedResult<ProviderTypeFiltered>, IProblem>({
    queryKey: queryProviderTypesBySearchKey(search, locale),
    queryFn: ({ pageParam }) => getProviderTypesBySearchClient(search, pageParam as number, locale),
    initialPageParam: DEFAULT_PAGE_NUMBER,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const hasNextPage = currentPage < lastPage.totalPages;
      return hasNextPage ? currentPage + 1 : undefined;
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  const query = useInfiniteQuery(options);

  const flatData: ProviderTypeOption[] =
    query.data?.pages.flatMap((page) =>
      page.items.map((providerType) => ({
        id: providerType.id,
        name: providerType.name,
        description: providerType.description,
        isActive: providerType.isActive,
        imagePreviewUrl: providerType.imagePreviewUrl,
      }))
    ) ?? [];

  return {
    data: flatData,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    pages: query.data?.pages,
  };
};

export const useProviderTypesBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [PROVIDER_TYPES_BY_SEARCH_CACHE_TAG] });
  };

  return { invalidateAllCache };
};
