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
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceProviderIdTag } from "../../db/cache";
import { ServiceProviderDetails } from "../../types";

export const getServiceProviderById = async (
  request: BaseRequest,
  id: string
): Promise<ApiReturnType<ServiceProviderDetails>> => {
  "use cache: remote";
  cacheTag(getServiceProviderIdTag(id));
  cacheLife("default");

  return readData<ServiceProviderDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${id}`,
    { ...request }
  );
};
