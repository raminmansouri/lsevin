<<<<<<< HEAD
import { getMyBookingByIdAction } from "@/booking/actions/get-my-booking-by-id";
import type { GetBookingByIdResponse } from "../../types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { IProblem } from "@/types/error";
import type { FilterParams } from "@/types/filter";

interface GetBookingByIdFilterParams extends FilterParams {
  id?: string;
}

const fetchGetBookingById = async (
  filters?: GetBookingByIdFilterParams
): Promise<GetBookingByIdResponse> => {
  const id = String(filters?.id || "").trim();
  if (!id) {
    const problem: IProblem = {
      title: "Booking id is required",
      status: 400,
      detail: "The booking detail page requires a booking id.",
    };
    throw problem;
  }

  const result = await getMyBookingByIdAction({ id });

  if (result?.error) {
    throw result.error;
  }

  if (!result?.data) {
    const problem: IProblem = {
      title: "Booking not found",
      status: 404,
      detail: "This booking does not exist or does not belong to your account.",
    };
    throw problem;
  }

  return result.data;
};

const BOOKING_DETAIL_QUERY_KEY = "my-booking-detail";
const queryKey = (id?: string) => [BOOKING_DETAIL_QUERY_KEY, id ?? ""] as const;

export const useFetchGetBookingById = (filters?: GetBookingByIdFilterParams) => {
  const id = String(filters?.id || "").trim();

  const options = queryOptions<GetBookingByIdResponse, IProblem>({
    queryKey: queryKey(id),
    queryFn: () => fetchGetBookingById({ id }),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
=======

import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag, getGetBookingByIdTag } from "../../db/cache";
import { ITrendingServiceResponse, GetBookingByIdResponse, TrustedProvider } from "../../types";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";
import { readData } from "@/config/http/http-service.client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { IProblem } from "@/types/error";
import axios, { AxiosRequestConfig } from "axios";
import { object } from "zod";


interface GetBookingByIdFilterParams extends FilterParams {
}

const fetchGetBookingById = async (
  params?: GetBookingByIdFilterParams,
  filters?: {
  }

): Promise<GetBookingByIdResponse> => {


  console.log('fetch GetBookingById:',filters)
  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  if(filters){
    addAllParams(searchParams,filters)
  }


  const path = `/customer/getBookingById?${searchParams.toString()}`

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

  return response.data as GetBookingByIdResponse;


  // const response = await readData<GetBookingByIdResponse>(path);

};





const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "GetBookingById";
const queryKey = () =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG] as const;

export const useFetchGetBookingById = (filters:any) => {
  const options = queryOptions<GetBookingByIdResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchGetBookingById(undefined, filters),
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
