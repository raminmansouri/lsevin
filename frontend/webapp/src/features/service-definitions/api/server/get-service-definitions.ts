import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceDefinitionGlobalTag } from "../../db/cache";
import { getServiceDefinitionsFromDb } from "../../db/service-definition-repository";
import { ServiceDefinition } from "../../types/service-definition";

export const getServiceDefinitions = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinition>>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionGlobalTag());
  cacheLife("default");

  return getServiceDefinitionsFromDb(request.locale, params);
};
