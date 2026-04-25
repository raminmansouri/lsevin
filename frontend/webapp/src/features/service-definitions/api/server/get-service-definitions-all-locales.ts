import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceDefinitionAllLocalesGlobalTag } from "../../db/cache";
import { getServiceDefinitionsAllLocalesFromDb } from "../../db/service-definition-repository";
import { ServiceDefinitionWithAllLocales } from "../../types/service-definition";

export const getServiceDefinitionsAllLocales = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinitionWithAllLocales>>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionAllLocalesGlobalTag());
  cacheLife("default");

  return getServiceDefinitionsAllLocalesFromDb(request.locale, params);
};
