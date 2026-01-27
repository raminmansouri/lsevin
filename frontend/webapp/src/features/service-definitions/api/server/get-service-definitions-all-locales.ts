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

import { getServiceDefinitionAllLocalesGlobalTag } from "../../db/cache";
import { ServiceDefinitionWithAllLocales } from "../../types/service-definition";

export const getServiceDefinitionsAllLocales = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinitionWithAllLocales>>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionAllLocalesGlobalTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }

  const response = await readData<
    PaginatedResult<ServiceDefinitionWithAllLocales>
  >(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/all-locales?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
