import "server-only";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceDefinitionsFromDb } from "../../db/service-definition-repository";
import { ServiceDefinition } from "../../types/service-definition";

export const getServiceDefinitions = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinition>>> => {
  // Do not wrap the admin list in Next's remote cache.
  // The DataTable search/pagination state is carried by URL params and must hit
  // Postgres for every distinct request; otherwise search can keep returning the
  // previously cached unfiltered page.
  return getServiceDefinitionsFromDb(request.locale, params);
};
