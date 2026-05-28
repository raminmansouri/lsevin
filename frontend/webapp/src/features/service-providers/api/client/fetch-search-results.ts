<<<<<<< HEAD
import { addAllFilterParams } from "@/lib/filter-params";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, FilterParams } from "@/types/filter";
import { IProblem } from "@/types/error";
import { queryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosRequestConfig } from "axios";

import { SearchResultsResponse } from "../../types";

interface SearchResultsFilterParams extends FilterParams {
  q?: string;
  categoryId?: string;
  providerTypeId?: string;
  country?: string;
  city?: string;
=======

import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getSearchResultsTag } from "../../db/cache";
import { ITrendingServiceResponse, SearchResultsResponse, TrustedProvider } from "../../types";
import { addAllFilterParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";


interface SearchResultsFilterParams extends FilterParams {
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}

const fetchSearchResults = async (
  params?: SearchResultsFilterParams
<<<<<<< HEAD
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
=======

): Promise<SearchResultsResponse> => {

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);

    // if (params.providerTypeIds && params.providerTypeIds.length > 0) {
    //   params.providerTypeIds.forEach((id) => {
    //     searchParams.append("ProviderTypeIds", id);
    //   });
    // }
  }


  const path = `/customer/search-results`

  console.log('use hook path:', path)


>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

  const httpService = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const options: AxiosRequestConfig = {
    method: "GET",
  };
<<<<<<< HEAD

  const response = await httpService(path, options);
  return response.data as SearchResultsResponse;
};

const SEARCH_RESULTS_CACHE_TAG = "search-results";
const queryKey = (term: string) => [SEARCH_RESULTS_CACHE_TAG, term] as const;

export const useFetchSearchResults = (term: string) => {
  const normalizedTerm = term.trim();

  const options = queryOptions<SearchResultsResponse, IProblem>({
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
  });

  const { data, error, isFetching, refetch } = useQuery(options);

=======
  const response = await httpService(path, options);

  return response.data as SearchResultsResponse;


  // const response = await readData<SearchResultsResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "search-results";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchSearchResults = () => {
  const options = queryOptions<SearchResultsResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchSearchResults(),
    enabled: true, // Only run when serviceDefinitionId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data, error, isFetching, refetch } = useQuery(options);
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  return {
    data,
    error,
    isFetching,
    refetch,
  };
<<<<<<< HEAD
};
=======
};
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
