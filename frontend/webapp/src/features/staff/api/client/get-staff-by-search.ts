import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useLocale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { Staff } from "../../types";

// StaffOption interface to match the selector component
export interface StaffOption {
  id: string;
  name: string;
  title?: string;
  biography?: string;
  profileImageUrl?: string;
  isActive?: boolean;
}

export const getStaffBySearchClient = async (search: string, page: number, locale?: string) => {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("Search", search);
    searchParams.set("q", search);
  }
  if (locale) {
    searchParams.set("Locale", locale);
  }
  searchParams.set("PageNumber", (page || DEFAULT_PAGE_NUMBER).toString());
  searchParams.set("PageSize", DEFAULT_PAGE_SIZE.toString());

  return await readData<PaginatedResult<Staff>>(
    `/staff/search?${searchParams.toString()}`
  );
};

const STAFF_BY_SEARCH_CACHE_TAG = "staff-by-search";
const queryStaffBySearchKey = (search: string, locale: string) =>
  [STAFF_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useStaffBySearch = (search: string) => {
  const locale = useLocale();
  const options = infiniteQueryOptions<PaginatedResult<Staff>, IProblem>({
    queryKey: queryStaffBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getStaffBySearchClient(search, pageParam as number, locale),
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

  // Flatten the pages and transform to StaffOption format for easier use
  const flatData: StaffOption[] =
    data?.pages.flatMap((page) =>
      page.items.map((staff) => ({
        id: staff.id,
        name: staff.name,
        title: staff.title,
        biography: staff.biography,
        profileImageUrl: staff.profileImageUrl,
        isActive: staff.isActive,
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

export const useStaffBySearchCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [STAFF_BY_SEARCH_CACHE_TAG],
    });
  };

  return {
    invalidateAllCache,
  };
};
