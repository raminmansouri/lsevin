import "server-only";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import {
  AdminServiceProviderFilterParams,
  AdminServiceProviderListItem,
  getAdminServiceProviders,
} from "../../db/admin-service-providers.queries";

interface ServiceProviderFilterParams extends FilterParams {
  providerTypeIds?: string[];
}

export const getServiceProviders = async (
  request: BaseRequest,
  params?: ServiceProviderFilterParams
): Promise<ApiReturnType<PaginatedResult<AdminServiceProviderListItem>>> => {
  return getAdminServiceProviders(request.locale || "fa", params as AdminServiceProviderFilterParams);
};
