import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceProviderIdTag } from "../../db/cache";
import { IServiceProviderDetails } from "../../types";

export const getPublicServiceProvider = async (
  request: BaseRequest,
  id: string
): Promise<ApiReturnType<IServiceProviderDetails>> => {
  "use cache: remote";
  cacheTag(getServiceProviderIdTag(id));
  cacheLife("default");

  const response = await readData<IServiceProviderDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/${id}`,
    {
      ...request,
    }
  );

  return response;
};
