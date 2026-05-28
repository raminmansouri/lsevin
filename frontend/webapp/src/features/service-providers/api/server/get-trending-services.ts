import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getTrendingServicesTag, getServiceProviderIdTag } from "../../db/cache";
import { ITrendingServiceResponse } from "../../types";

export const getTrendingServices = async (
  request: BaseRequest
): Promise<ApiReturnType<ITrendingServiceResponse>> => {
  "use cache: remote";
  cacheTag(getTrendingServicesTag());
  cacheLife("default");

  const response = await readData<ITrendingServiceResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/trending-services`,
    {
      ...request,
    }
  );

  return response;
};
