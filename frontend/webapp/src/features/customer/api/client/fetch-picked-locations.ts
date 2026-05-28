
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getPicketLocationsTag } from "../../db/cache";
import { ITrendingServiceResponse, PicketLocationsResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface PicketLocationsFilterParams extends FilterParams {
}

const fetchPicketLocations = async (
  params?: PicketLocationsFilterParams,
): Promise<PicketLocationsResponse> => {


  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  const path = `/customer/get-picked-locations?${searchParams.toString()}`

  console.log('use hook path:', path)



  const response = readData(path);

  return response


  // const response = await readData<PicketLocationsResponse>(path);

};





const PicketLocations_CACHE_TAG = "PicketLocations";
const queryKey = () =>
  [PicketLocations_CACHE_TAG] as const;

export const useFetchPicketLocations = (filters?:PicketLocationsFilterParams) => {
  const options = queryOptions<PicketLocationsResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchPicketLocations( filters),
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