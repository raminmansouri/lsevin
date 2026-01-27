import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import type { AttributeFilterValue } from "@/features/home/types";
import { getProviderTypeIdTag } from "@/features/provider-types/db/cache";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { addAllFilterParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceProviderIdTag } from "../../db/cache";
import type { IServiceProvider } from "../../types";

interface ServiceProvidersByTypeParams extends FilterParams {
  countryCode?: string;
  cityCode?: string;
  attributeFilters?: AttributeFilterValue[];
}

export const getServiceProvidersByType = async (
  request: BaseRequest,
  providerTypeId: string,
  params?: ServiceProvidersByTypeParams
): Promise<ApiReturnType<PaginatedResult<IServiceProvider>>> => {
  "use cache: remote";
  cacheTag(getProviderTypeIdTag(providerTypeId));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  searchParams.append("ProviderTypeId", providerTypeId);

  if (params) {
    addAllFilterParams(searchParams, params);

    if (params.countryCode) {
      searchParams.append("CountryCode", params.countryCode);
    }
    if (params.cityCode) {
      searchParams.append("CityCode", params.cityCode);
    }
    if (params.attributeFilters && params.attributeFilters.length > 0) {
      // Send in format: guid:value for each filter
      // Multiple params with same name: ?attributeFilters=guid:value&attributeFilters=guid:value
      params.attributeFilters.forEach((filter) => {
        searchParams.append(
          "AttributeFilters",
          `${filter.attributeDefinitionId}:${filter.value}`
        );
      });
    }
  }

  const response = await readData<PaginatedResult<IServiceProvider>>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/by-provider-type/${providerTypeId}?${searchParams.toString()}`,
    { ...request }
  );
  if (response.data) {
    response.data.items.forEach((item) => {
      cacheTag(getServiceProviderIdTag(item.id));
    });
  }

  return response;
};
