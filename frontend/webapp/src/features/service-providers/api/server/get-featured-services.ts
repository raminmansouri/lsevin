import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getFeaturedServicesTag, getServiceProviderIdTag } from "../../db/cache";
import { IFeaturedServiceResponse } from "../../types";

export const getFeaturedServices = async (
  request: BaseRequest
): Promise<ApiReturnType<IFeaturedServiceResponse>> => {
  "use cache: remote";
  cacheTag(getFeaturedServicesTag());
  cacheLife("default");

  const response = await readData<IFeaturedServiceResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/featured-services`,
    {
      ...request,
    }
  );

  return response;
};
