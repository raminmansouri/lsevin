
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getSearchHistoryTag } from "../../db/cache";
import { ITrendingServiceResponse, SearchHistoryResponse, TrustedProvider } from "../../types";
import { addAllFilterParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";


interface SearchHistoryFilterParams extends FilterParams {
}

const fetchSearchHistory = async (
  params?: SearchHistoryFilterParams

): Promise<SearchHistoryResponse> => {

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);

    // if (params.providerTypeIds && params.providerTypeIds.length > 0) {
    //   params.providerTypeIds.forEach((id) => {
    //     searchParams.append("ProviderTypeIds", id);
    //   });
    // }
  }


  const path = `/customer/get-search-history`

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

  return response.data as SearchHistoryResponse;


  // const response = await readData<SearchHistoryResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "search-history";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useGetServiceHistory = () => {
  const options = queryOptions<SearchHistoryResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchSearchHistory(),
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