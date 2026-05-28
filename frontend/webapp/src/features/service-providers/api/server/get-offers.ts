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
import { getOffersTag } from "../../db/cache";
import { OffersResponse } from "../../types";


export interface OffersFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getOffers = async (
  request: BaseRequest,
  params?: OffersFilterParams
): Promise<ApiReturnType<OffersResponse>> => {
  "use cache: remote";
  console.log('server Offers called:')

  cacheTag(getOffersTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<OffersResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Offers?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
