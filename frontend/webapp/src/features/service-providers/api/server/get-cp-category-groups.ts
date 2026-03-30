import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
  CUSTOMER_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";
import { getCpCategoryGroupsTag } from "../../db/cache";
import { CpCategoryGroupsResponse } from "../../types";


export interface CpCategoryGroupsFilterParams extends FilterParams{
  
}
 
export const getCpCategoryGroups = async (
  request: BaseRequest,
  params?: CpCategoryGroupsFilterParams
): Promise<ApiReturnType<CpCategoryGroupsResponse>> => {
  "use cache: remote";
  console.log('server getCpCategoryGroups called:')

  cacheTag(getCpCategoryGroupsTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<CpCategoryGroupsResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/CpCategoryGroups?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
