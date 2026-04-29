
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getSearchResultsTag } from "../../db/cache";
import { ITrendingServiceResponse, SearchResultsResponse, TrustedProvider } from "../../types";
import { addAllFilterParams } from "@/lib/filter-params";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { insert } from "@/lib/admin/db-crud";
import sql from "@/config/database/db";
import { getSession } from "next-auth/react";


interface SearchResultsFilterParams extends FilterParams {
}

const fetchSearchResults = async (
  params?: SearchResultsFilterParams

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

  var session = await getSession();
  var userId = session.user?.id;

/* 

  if (params?.filters) {
    insert(sql, {
      schema: 'search',
      table: 'user_search_history'
    }, {
      'id': null,
      'user_id': userId,
      'term': params?.filters,
      'created_at': 'created_at',
      'category_id': 'category_id',
      'normalized_term': params?.filters?.trim()
    })
  } */

  const path = `/customer/search-results?${searchParams.toString()}`

  console.log('use hook path:', path)



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


  // const response = await readData<SearchResultsResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "search-results";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchSearchResults = (term: string) => {
  const options = queryOptions<SearchResultsResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchSearchResults({
      filters: term,
      startDate: "",
      endDate: "",
      pageNumber: DEFAULT_PAGE_NUMBER,
      pageSize: DEFAULT_PAGE_SIZE,
      sortOrder: ""
    }),
    enabled: true, // Only run when serviceDefinitionId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return {
    data,
    error,
    isFetching,
    refetch,
  };
};