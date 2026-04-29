import { queryOptions, useQuery } from "@tanstack/react-query";

import { getSearchHistoryAction } from "../../actions/search";
import { SearchHistoryResponse } from "../../types";
import { IProblem } from "@/types/error";

const SEARCH_HISTORY_CACHE_TAG = "search-history";

const queryKey = (locale?: string) => [SEARCH_HISTORY_CACHE_TAG, locale ?? "default"] as const;

export const useGetServiceHistory = (locale?: string) => {
  const options = queryOptions<SearchHistoryResponse, IProblem>({
    queryKey: queryKey(locale),
    queryFn: () => getSearchHistoryAction(locale),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return {
    data,
    error,
    isFetching,
    refetch,
  };
};
