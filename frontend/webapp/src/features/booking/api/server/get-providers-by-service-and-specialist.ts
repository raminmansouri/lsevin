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
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { GetBookingGetProvidersByServiceAndSpecialistResponse } from "@/features/service-providers/types";
import { getBookingIdTag } from "../../db/cache";

export const getProvidersByServiceAndSpecialist = async (
  request: BaseRequest,
  params?: any
): Promise<ApiReturnType<GetBookingGetProvidersByServiceAndSpecialistResponse>> => {
  // "use cache: remote";
  // cacheTag(getBookingIdTag('getProvidersByServiceAndSpecialist'));
  // cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllParams(searchParams, params,true);
  }
  const response = await readData<GetBookingGetProvidersByServiceAndSpecialistResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetBookingGetProvidersByServiceAndSpecialist?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
