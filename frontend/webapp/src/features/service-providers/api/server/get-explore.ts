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
import { getExploreTag } from "../../db/cache";
import { ExploreResponse } from "../../types";


export interface ExploreFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getExplore = async (
  request: BaseRequest,
  params?: ExploreFilterParams
): Promise<ApiReturnType<ExploreResponse>> => {
  "use cache: remote";
  console.log('server explore called:')

  cacheTag(getExploreTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<ExploreResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Explore?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
