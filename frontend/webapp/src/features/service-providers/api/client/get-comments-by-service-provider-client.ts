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

import { IServiceProviderComment } from "../../types";

export const getCommentsByServiceProviderClient = async (
  serviceProviderId: string,
  page: number,
  locale: Locale
) => {
  const searchParams = new URLSearchParams();
  searchParams.set("PageNumber", (page || DEFAULT_PAGE_NUMBER).toString());
  searchParams.set("PageSize", DEFAULT_PAGE_SIZE.toString());
  searchParams.set("Locale", locale);

  return await readData<PaginatedResult<IServiceProviderComment>>(
    `/service-providers/${serviceProviderId}/comments?${searchParams.toString()}`
  );
};

const COMMENTS_CACHE_TAG = "service-provider-comments";
const queryCommentsKey = (serviceProviderId: string, locale: Locale) =>
  [COMMENTS_CACHE_TAG, serviceProviderId, locale] as const;

export const useCommentsByServiceProvider = (
  serviceProviderId: string,
  locale: Locale
) => {
  const options = infiniteQueryOptions<
    PaginatedResult<IServiceProviderComment>,
    IProblem
  >({
    queryKey: queryCommentsKey(serviceProviderId, locale),
    queryFn: ({ pageParam }) =>
      getCommentsByServiceProviderClient(
        serviceProviderId,
        pageParam as number,
        locale
      ),
    initialPageParam: DEFAULT_PAGE_NUMBER,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const hasNextPage = currentPage < lastPage.totalPages;
      return hasNextPage ? currentPage + 1 : undefined;
    },
    enabled: !!serviceProviderId,
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
  const flatData: IServiceProviderComment[] =
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

export const useCommentsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [COMMENTS_CACHE_TAG],
    });
  };

  const invalidateProviderCache = (serviceProviderId: string) => {
    queryClient.invalidateQueries({
      queryKey: [COMMENTS_CACHE_TAG, serviceProviderId],
    });
  };

  return {
    invalidateAllCache,
    invalidateProviderCache,
  };
};
