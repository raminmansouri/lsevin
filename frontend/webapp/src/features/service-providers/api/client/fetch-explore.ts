<<<<<<< HEAD
import { ExploreResponse } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";

interface ExploreFilterParams extends FilterParams {}

type ExploreClientFilters = {
  priceRange: number[];
  distance: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: "any" | "fast" | "instant";
  currencyCode?: string | null;
};

function normalizeRange(range?: number[]) {
  const values = Array.isArray(range)
    ? range.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (values.length >= 2) {
    const min = Math.max(0, values[0]);
    const max = Math.max(0, values[1]);
    return min > max ? [max, min] : [min, max];
  }

  if (values.length === 1) {
    return [0, Math.max(0, values[0])];
  }

  return [0, 0];
}

function normalizeFilters(filters?: ExploreClientFilters): ExploreClientFilters | undefined {
  if (!filters) return undefined;

  return {
    ...filters,
    priceRange: normalizeRange(filters.priceRange),
    distance: Math.max(0, Number(filters.distance) || 0),
    minRating: Math.max(0, Number(filters.minRating) || 0),
    languages: Array.isArray(filters.languages) ? filters.languages.filter(Boolean) : [],
    responseTime: filters.responseTime || "any",
    currencyCode: filters.currencyCode?.trim().toUpperCase() || null,
  };
=======

import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getExploreTag } from "../../db/cache";
import { ITrendingServiceResponse, ExploreResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface ExploreFilterParams extends FilterParams {
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}

const fetchExplore = async (
  params?: ExploreFilterParams,
<<<<<<< HEAD
  filters?: ExploreClientFilters,
): Promise<ExploreResponse> => {
  const searchParams = new URLSearchParams();
  const normalizedFilters = normalizeFilters(filters);

=======
  filters?: {
    priceRange: number[];
    distance: number;
    minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant";
  }

): Promise<ExploreResponse> => {


  console.log('fetch explore:',filters)
  const searchParams = new URLSearchParams();
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  if (params) {
    addAllFilterParams(searchParams, params);
  }

<<<<<<< HEAD
  if (normalizedFilters) {
    addAllParams(searchParams, normalizedFilters);
  }

  const path = `/customer/explore?${searchParams.toString()}`;
=======
  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/explore?${searchParams.toString()}`

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
  const response = await httpService(path, options);

  return response.data as ExploreResponse;
<<<<<<< HEAD
};

const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "explore";
const queryKey = (filters?: ExploreClientFilters) =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG, normalizeFilters(filters)] as const;

export const useFetchExplore = (filters: ExploreClientFilters) => {
  const options = queryOptions<ExploreResponse, IProblem>({
    queryKey: queryKey(filters),
    queryFn: () => fetchExplore(undefined, filters),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
=======


  // const response = await readData<ExploreResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "explore";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchExplore = (filters: { priceRange: number[]; distance: number; minRating: number; verifiedOnly: boolean; languages: string[]; responseTime: "any" | "fast" | "instant"; }) => {
  const options = queryOptions<ExploreResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchExplore(undefined, filters),
    enabled: true, // Only run when serviceDefinitionId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  });

  const { data, error, isFetching, refetch } = useQuery(options);
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
