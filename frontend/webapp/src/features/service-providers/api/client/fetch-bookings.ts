<<<<<<< HEAD
import { getMyBookingsAction } from "@/booking/actions/get-my-bookings";
import type { BookingsResponse } from "../../types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { IProblem } from "@/types/error";
import type { FilterParams } from "@/types/filter";

interface BookingsFilterParams extends FilterParams {
  status?: "upcoming" | "past" | "cancelled";
}

const EMPTY_BOOKINGS: BookingsResponse = {
  upcomingBookings: [],
  pastBookings: [],
  cancelledBookings: [],
};

const fetchBookings = async (
  filters?: BookingsFilterParams
): Promise<BookingsResponse> => {
  const result = await getMyBookingsAction({
    status: filters?.status,
  });

  if (result?.error) {
    throw result.error;
  }

  return result?.data ?? EMPTY_BOOKINGS;
};

const BOOKING_LIST_QUERY_KEY = "my-bookings";
const queryKey = (filters?: BookingsFilterParams) =>
  [BOOKING_LIST_QUERY_KEY, filters?.status ?? "all"] as const;

export const useFetchBookings = (filters?: BookingsFilterParams) => {
  const options = queryOptions<BookingsResponse, IProblem>({
    queryKey: queryKey(filters),
    queryFn: () => fetchBookings(filters),
    enabled: true,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
=======

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


  const path = `/customer/bookings?${searchParams.toString()}`

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
