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

import { getServiceDefinitionIdTag } from "../../db/cache";
import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<ServiceDefinitionDetails>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionIdTag(id));
  cacheLife("default");

  const response = await readData<ServiceDefinitionDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${id}`,
    {
      ...request,
    }
  );
  return response;
};
