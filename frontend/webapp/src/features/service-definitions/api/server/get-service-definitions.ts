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

import { getServiceDefinitionGlobalTag } from "../../db/cache";
import { ServiceDefinition } from "../../types/service-definition";

export const getServiceDefinitions = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinition>>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  const response = await readData<PaginatedResult<ServiceDefinition>>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
