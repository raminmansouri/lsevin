import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceProviderRequestServiceProviderTag } from "../../db/cache";
import { IServiceProviderRequest } from "../../types";

export const getMyServiceProviderRequests = async (
  request: BaseRequest,
  serviceProviderId: string
): Promise<ApiReturnType<IServiceProviderRequest[]>> => {
  "use cache: remote";
  cacheTag(getServiceProviderRequestServiceProviderTag(serviceProviderId));
  cacheLife("default");

  const response = await readData<IServiceProviderRequest[]>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/${serviceProviderId}/requests`,
    {
      ...request,
    }
  );
  return response;
};
