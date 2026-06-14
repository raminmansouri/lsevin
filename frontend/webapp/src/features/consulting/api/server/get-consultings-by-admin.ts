import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { addAllFilterParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getConsultingGlobalTag } from "../../db/cache";
import { IConsulting } from "../../types";

export const getConsultingsByAdmin = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<IConsulting>>> => {
  "use cache: remote";
  cacheTag(getConsultingGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }
  const response = await readData<PaginatedResult<IConsulting>>(
    `${CUSTOMER_MODULE_BASE_PATH}/consulting?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
