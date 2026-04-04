
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getBookingsTag } from "../../db/cache";
import { ITrendingServiceResponse, BookingsResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface BookingsFilterParams extends FilterParams {
}

const fetchBookings = async (
  params?: BookingsFilterParams,
  filters?: {
  }

): Promise<BookingsResponse> => {


  console.log('fetch Bookings:',filters)
  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/Bookings?${searchParams.toString()}`

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

  return response.data as BookingsResponse;


  // const response = await readData<BookingsResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "Bookings";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchBookings = (filters:any) => {
  const options = queryOptions<BookingsResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchBookings(undefined, filters),
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