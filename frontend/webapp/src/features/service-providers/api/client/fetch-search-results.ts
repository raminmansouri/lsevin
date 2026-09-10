import { addAllFilterParams } from "@/lib/filter-params";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, FilterParams } from "@/types/filter";
import { IProblem } from "@/types/error";
import {
  keepPreviousData,
  QueryClient,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import axios, { AxiosRequestConfig } from "axios";

import { SearchResultsResponse } from "../../types";

interface SearchResultsFilterParams extends FilterParams {
  q?: string;
  categoryId?: string;
  providerTypeId?: string;
  country?: string;
  city?: string;
}

const fetchSearchResults = async (
  params?: SearchResultsFilterParams
): Promise<SearchResultsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    addAllFilterParams(searchParams, params);

    const term = params.q || params.filters;
    if (term) searchParams.set("q", term);
    if (params.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params.providerTypeId) searchParams.set("providerTypeId", params.providerTypeId);
    if (params.country) searchParams.set("country", params.country);
    if (params.city) searchParams.set("city", params.city);
  }

  const path = `/customer/search-results?${searchParams.toString()}`;

  const httpService = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const options: AxiosRequestConfig = {
    method: "GET",
  };

  const response = await httpService(path, options);
  return response.data as SearchResultsResponse;
};

const SEARCH_RESULTS_CACHE_TAG = "search-results";
const queryKey = (term: string) => [SEARCH_RESULTS_CACHE_TAG, term] as const;

export const searchResultsQueryOptions = (term: string) => {
  const normalizedTerm = term.trim();

  return queryOptions<SearchResultsResponse, IProblem>({
    queryKey: queryKey(normalizedTerm),
    queryFn: () =>
      fetchSearchResults({
        q: normalizedTerm,
        filters: normalizedTerm,
        startDate: "",
        endDate: "",
        pageNumber: DEFAULT_PAGE_NUMBER,
        pageSize: DEFAULT_PAGE_SIZE,
        sortOrder: "",
      }),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Switching terms used to blank the list back to `undefined`, which is what
    // painted the "no results" screen over every in-flight search. Holding the
    // previous answer keeps something on screen until the new one lands.
    placeholderData: keepPreviousData,
  });
};

/** Warm the cache for a term the visitor has typed but not submitted yet, so
 *  the results screen renders from cache instead of opening its own round trip
 *  after it mounts. */
export const prefetchSearchResults = (queryClient: QueryClient, term: string) => {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) return Promise.resolve();

  return queryClient.prefetchQuery(searchResultsQueryOptions(normalizedTerm));
};

export const useFetchSearchResults = (term: string) => {
  const { data, error, isFetching, isPending, refetch } = useQuery(
    searchResultsQueryOptions(term)
  );

  return {
    data,
    error,
    isFetching,
    isPending,
    refetch,
  };
};
