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
import { getSampleTag } from "../../db/cache";
import { SampleResponse } from "../../types";


export interface SampleFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getSample = async (
  request: BaseRequest,
  params?: SampleFilterParams
): Promise<ApiReturnType<SampleResponse>> => {
  "use cache: remote";
  console.log('server Sample called:')

  cacheTag(getSampleTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<SampleResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Sample?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
