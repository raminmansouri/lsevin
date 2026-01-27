import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { CategoryOption } from "@/components/selectors/category-selector";
import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { Category } from "../../types/category";

export const getCategoriesBySearchClient = async (
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

  return await readData<PaginatedResult<Category>>(
    `/categories/search?${searchParams.toString()}`
  );
};

const CATEGORIES_BY_SEARCH_CACHE_TAG = "categories-by-search";
const queryCategoriesBySearchKey = (search: string, locale: Locale) =>
  [CATEGORIES_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useCategoriesBySearch = (search: string, locale: Locale) => {
  const options = infiniteQueryOptions<PaginatedResult<Category>, IProblem>({
    queryKey: queryCategoriesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getCategoriesBySearchClient(search, pageParam as number, locale),
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

  // Flatten the pages and transform to CategoryOption format for easier use
  const flatData: CategoryOption[] =
    data?.pages.flatMap((page) =>
      page.items.map((category) => ({
        categoryId: category.categoryId,
        name: category.name,
        parentName: category.parentName,
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

export const useCategoriesBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [CATEGORIES_BY_SEARCH_CACHE_TAG],
    });
  };

  return {
    invalidateAllCache,
  };
};
