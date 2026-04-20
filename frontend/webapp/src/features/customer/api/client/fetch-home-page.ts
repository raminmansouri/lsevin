
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


export interface GetHomePageResponse {
  categories: Category[];
  quickSearches: string[];
}

export interface Category {
  id: number;
  label: string;
  path: string;
  image: string;
  gradient: string;
}

interface GetHomePageFilterParams extends FilterParams {
}

const fetchGetHomePage = async (
  params?: GetHomePageFilterParams,
  filters?: {
    priceRange: number[];
    distance: number;
    minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant";
  }

): Promise<GetHomePageResponse> => {


  console.log('fetch GetHomePage:',filters)
  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/GetHomePage?${searchParams.toString()}`

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

  return response.data as GetHomePageResponse;


  // const response = await readData<GetHomePageResponse>(path);

};





const GetHomePage_CACHE_TAG = "GetHomePage";
const queryKey = () =>
  [GetHomePage_CACHE_TAG] as const;

export const useFetchGetHomePage = (filters: any) => {
  const options = queryOptions<GetHomePageResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchGetHomePage(undefined, filters),
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