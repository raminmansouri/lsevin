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

import {
  getServiceProviderCommentsTag,
  getUserCommentsTag,
} from "../../db/cache";
import { IServiceProviderComment } from "../../types";

export const getCommentsByServiceProvider = async (
  request: BaseRequest,
  serviceProviderId: string,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<IServiceProviderComment>>> => {
  "use cache: remote";
  cacheTag(getServiceProviderCommentsTag(serviceProviderId));
  cacheTag(getUserCommentsTag(request.userId ?? ""));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  const response = await readData<PaginatedResult<IServiceProviderComment>>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/${serviceProviderId}/comments?${searchParams.toString()}`,
    {
      ...request,
    }
  );

  return response;
};
