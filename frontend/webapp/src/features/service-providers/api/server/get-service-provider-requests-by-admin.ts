import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { addAllFilterParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceProviderRequestGlobalTag } from "../../db/cache";
import { IServiceProviderRequestAdmin } from "../../types";

export const getServiceProviderRequestsByAdmin = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<IServiceProviderRequestAdmin>>> => {
  "use cache: remote";
  cacheTag(getServiceProviderRequestGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }
  const response = await readData<
    PaginatedResult<IServiceProviderRequestAdmin>
  >(
    `${CATEGORY_MODULE_BASE_PATH}/admin/service-providers/requests?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
