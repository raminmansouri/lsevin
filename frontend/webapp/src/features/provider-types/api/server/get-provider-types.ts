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

import { getProviderTypeGlobalTag } from "../../db/cache";
import { ProviderTypeFiltered } from "../../types/provider-type";

export const getProviderTypes = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ProviderTypeFiltered>>> => {
  "use cache: remote";
  cacheTag(getProviderTypeGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  const response = await readData<PaginatedResult<ProviderTypeFiltered>>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/provider-types?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
