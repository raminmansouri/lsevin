
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
import { UploadFilesResponse } from "@/app/[locale]/n/app/mobile/booking/components/UploadFiles/UploadFiles";


interface FetchUploadFilesFilterParams extends FilterParams {
}

const fetchUploadFiles = async (
  providerId,
        serviceId,
        specialistId,
      locale
): Promise<UploadFilesResponse> => {


  const searchParams = new URLSearchParams();
  if (providerId) {
    searchParams.set("providerId", providerId);
  }
  if (serviceId) {
    searchParams.set("serviceId", serviceId);
  }
  if (specialistId) {
    searchParams.set("specialistId", specialistId);
  }

  searchParams.set("Locale", locale);
  const path = `/booking/get-upload-files?${searchParams.toString()}`

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

  return response.data as UploadFilesResponse;


  // const response = await readData<FetchUploadFilesResponse>(path);

};





const FetchUploadFiles_CACHE_TAG = "FetchUploadFiles";
const queryKey = () =>
  [FetchUploadFiles_CACHE_TAG] as const;

export const useFetchUploadFiles = ( providerId,
        serviceId,
        specialistId,
      locale) => {
  const options = queryOptions<UploadFilesResponse, IProblem>({
    queryKey: queryKey(),
    queryFn: () => fetchUploadFiles
    (  providerId,
        serviceId,
        specialistId,
      locale),
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