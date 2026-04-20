import {ProviderPageDataResponse} from "@/features/service-providers/types/provider-page-types.ts";
import { addAllFilterParams } from "@/lib/filter-params";
import { IProblem } from "@/types/error";
import { queryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosRequestConfig } from "axios";

/**
 * Replace the URL with whatever backend you use.
 * This stub just returns a static payload; in production you would
 * call your real API (`/api/providers/${id}?lang=${locale}` etc.).
 */




const FetchProviderPageData = async (
    providerId: string,
    locale: string,
  
  ): Promise<ProviderPageDataResponse> => {
  
    const searchParams = new URLSearchParams();
  
    searchParams.set('id',providerId)
    const path = `/service-providers/get-provider-page-data?${searchParams.toString()}`
  
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
  
    return response.data as ProviderPageDataResponse;
  
  
    // const response = await readData<SearchHistoryResponse>(path);
  
  };
  
  
  
  
  
  const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "provider-page-history";
  const queryKey = (providerId,locale) =>
    [SERVICE_DEFINITION_DETAILS_CACHE_TAG,providerId,locale] as const;
  
  export const useFetchProviderPageData = (providerId,locale) => {
    const options = queryOptions<ProviderPageDataResponse, IProblem>({
      queryKey: queryKey(providerId,locale),
      queryFn: () => FetchProviderPageData(providerId,locale),
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
