import { queryOptions, useQuery } from "@tanstack/react-query";

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, FilterParams } from "@/types/filter";
import { IProblem } from "@/types/error";

import { getSearchResultsAction } from "../../actions/search";
import { SearchResultsResponse } from "../../types";

interface SearchResultsFilterParams extends FilterParams {
  filters?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  locale?: string;
  categoryId?: string;
  providerTypeId?: string;
  country?: string;
  city?: string;
}

const SEARCH_RESULTS_CACHE_TAG = "search-results";

const queryKey = (params: SearchResultsFilterParams) =>
  [
    SEARCH_RESULTS_CACHE_TAG,
    params.filters ?? "",
    params.locale ?? "",
    params.categoryId ?? "",
    params.providerTypeId ?? "",
    params.country ?? "",
    params.city ?? "",
    params.pageNumber ?? DEFAULT_PAGE_NUMBER,
    params.pageSize ?? DEFAULT_PAGE_SIZE,
  ] as const;

export const useFetchSearchResults = (term: string, params?: Omit<SearchResultsFilterParams, "filters">) => {
  const normalizedParams: SearchResultsFilterParams = {
    filters: term,
    startDate: "",
    endDate: "",
    pageNumber: DEFAULT_PAGE_NUMBER,
    pageSize: DEFAULT_PAGE_SIZE,
    sortOrder: "",
    ...params,
  };

  const options = queryOptions<SearchResultsResponse, IProblem>({
    queryKey: queryKey(normalizedParams),
    queryFn: () =>
      getSearchResultsAction({
        term: normalizedParams.filters,
        locale: normalizedParams.locale,
        limit: normalizedParams.pageSize || DEFAULT_PAGE_SIZE,
        categoryId: normalizedParams.categoryId,
        providerTypeId: normalizedParams.providerTypeId,
        country: normalizedParams.country,
        city: normalizedParams.city,
      }),
    enabled: normalizedParams.filters !== undefined,
    staleTime: 2 * 60 * 1000,
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
