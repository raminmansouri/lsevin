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

import { getServiceProviderGlobalTag } from "../../db/cache";
import { ServiceProvider } from "../../types";

interface ServiceProviderFilterParams extends FilterParams {
  providerTypeIds?: string[];
}

export const getServiceProviders = async (
  request: BaseRequest,
  params?: ServiceProviderFilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceProvider>>> => {
  "use cache: remote";
  cacheTag(getServiceProviderGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);

    if (params.providerTypeIds && params.providerTypeIds.length > 0) {
      params.providerTypeIds.forEach((id) => {
        searchParams.append("ProviderTypeIds", id);
      });
    }
  }

  return readData<PaginatedResult<ServiceProvider>>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers?${searchParams.toString()}`,
    { ...request }
  );
};
