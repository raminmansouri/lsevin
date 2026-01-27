import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceProviderGlobalTag } from "../../db/cache";
import { IServiceProvidersGroupedResponse } from "../../types";

interface PublicServiceProviderParams {
  countryCode?: string;
  cityCode?: string;
  filters?: string;
}

export const getPublicServiceProviders = async (
  request: BaseRequest,
  params?: PublicServiceProviderParams
): Promise<ApiReturnType<IServiceProvidersGroupedResponse>> => {
  "use cache: remote";
  cacheTag(getServiceProviderGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params?.countryCode) {
    searchParams.append("countryCode", params.countryCode);
  }
  if (params?.cityCode) {
    searchParams.append("cityCode", params.cityCode);
  }
  if (params?.filters) {
    searchParams.append("filters", params.filters);
  }

  const response = await readData<IServiceProvidersGroupedResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
