import "server-only";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceDefinitionsAllLocalesFromDb } from "../../db/service-definition-repository";
import { ServiceDefinitionWithAllLocales } from "../../types/service-definition";

export const getServiceDefinitionsAllLocales = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinitionWithAllLocales>>> => {
  // This endpoint is used by searchable selectors and must not be cached across
  // search terms.
  return getServiceDefinitionsAllLocalesFromDb(request.locale, params);
};
