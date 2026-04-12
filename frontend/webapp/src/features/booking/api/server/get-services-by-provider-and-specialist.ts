import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { addAllFilterParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { GetBookingGetProvidersByServiceAndSpecialistResponse, GetBookingGetServicesByProviderAndSpecialistResponse } from "@/features/service-providers/types";
import { getBookingIdTag } from "../../db/cache";



export const getServicesByProviderAndSpecialist = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<GetBookingGetServicesByProviderAndSpecialistResponse>> => {
  "use cache: remote";
  cacheTag(getBookingIdTag('getServicesByProviderAndSpecialist'));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }
  const response = await readData<GetBookingGetServicesByProviderAndSpecialistResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetBookingGetServicesByProviderAndSpecialist?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
