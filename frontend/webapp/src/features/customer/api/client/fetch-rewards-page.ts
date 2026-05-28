
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getGetRewardsPageTag } from "../../db/cache";
import { ITrendingServiceResponse, GetRewardsPageResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface GetRewardsPageFilterParams extends FilterParams {
}

const fetchGetRewardsPage = async (
  params?: GetRewardsPageFilterParams,
  filters?: {
    priceRange: number[];
    distance: number;
    minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant";
  }

): Promise<GetRewardsPageResponse> => {


  console.log('fetch GetRewardsPage:',filters)
  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/GetRewardsPage?${searchParams.toString()}`

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

  return response.data as GetRewardsPageResponse;


  // const response = await readData<GetRewardsPageResponse>(path);

};





const GetRewardsPage_CACHE_TAG = "GetRewardsPage";
const queryKey = () =>
  [GetRewardsPage_CACHE_TAG] as const;

export const useFetchGetRewardsPage = (filters: { priceRange: number[]; distance: number; minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant"; }) => {
  const options = queryOptions<GetRewardsPageResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchGetRewardsPage(undefined, filters),
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