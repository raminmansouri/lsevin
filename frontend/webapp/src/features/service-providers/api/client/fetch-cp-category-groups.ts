
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getCpCategoryGroupsTag } from "../../db/cache";
import { ITrendingServiceResponse, CpCategoryGroupsResponse, TrustedProvider } from "../../types";
import { addAllFilterParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface CpCategoryGroupsFilterParams extends FilterParams {
}

const fetchCpCategoryGroups = async (
  params?: CpCategoryGroupsFilterParams,
  filters?: any

): Promise<CpCategoryGroupsResponse> => {

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    if (filters && Object.entries(filters).length > 0) {
      Object.keys(filters).forEach((key) => {
        searchParams.append(key, filters[key]);
      });
    }
  }


  const path = `/customer/cp-category-groups?${searchParams.toString()}`

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

  return response.data as CpCategoryGroupsResponse;


  // const response = await readData<CpCategoryGroupsResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "explore";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchCpCategoryGroups = (filters?: any) => {
  const options = queryOptions<CpCategoryGroupsResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchCpCategoryGroups(undefined, filters),
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