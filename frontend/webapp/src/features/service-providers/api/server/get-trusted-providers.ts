import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getTrustedProvidersTag, getServiceProviderIdTag } from "../../db/cache";
import { ITrendingServiceResponse, TrustedProvider } from "../../types";
import { addAllFilterParams } from "@/lib/filter-params";
import { FilterParams } from "@/types/filter";


interface TrustedProvidersFilterParams extends FilterParams {
  providerTypeIds?: string[];
}

export const getTrustedProviders = async (
  request: BaseRequest,
  params?: TrustedProvidersFilterParams

): Promise<ApiReturnType<PaginatedResult<TrustedProvider>>> => {
  "use cache: remote";
  cacheTag(getTrustedProvidersTag());
  cacheLife("default");

   const searchParams = new URLSearchParams();
    if (params) {
      addAllFilterParams(searchParams, params);
  
      // if (params.providerTypeIds && params.providerTypeIds.length > 0) {
      //   params.providerTypeIds.forEach((id) => {
      //     searchParams.append("ProviderTypeIds", id);
      //   });
      // }
    }

  const response = await readData<PaginatedResult<TrustedProvider>>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/trusted-providers?${searchParams.toString()}`,
    {
      ...request,
    }
  );

  return response;
};
