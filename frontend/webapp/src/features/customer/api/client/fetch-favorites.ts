
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getFavoritesTag } from "../../db/cache";
import { ITrendingServiceResponse, FavoritesResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface FavoritesFilterParams extends FilterParams {
}

const fetchFavorites = async (
  params?: FavoritesFilterParams,
  filters?: {
    priceRange: number[];
    distance: number;
    minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant";
  }

): Promise<FavoritesResponse> => {


  console.log('fetch Favorites:',filters)
  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/Favorites?${searchParams.toString()}`

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

  return response.data as FavoritesResponse;


  // const response = await readData<FavoritesResponse>(path);

};





const Favorites_CACHE_TAG = "Favorites";
const queryKey = () =>
  [Favorites_CACHE_TAG] as const;

export const useFetchFavorites = (filters: { priceRange: number[]; distance: number; minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant"; }) => {
  const options = queryOptions<FavoritesResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchFavorites(undefined, filters),
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