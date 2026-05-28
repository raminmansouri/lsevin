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
import { GetHomePageResponse } from "../client/fetch-home-page";
import { getHomePageTag } from "../../db/cache";


export interface GetHomePageFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getGetHomePage = async (
  request: BaseRequest,
  params?: GetHomePageFilterParams
): Promise<ApiReturnType<GetHomePageResponse>> => {
  "use cache: remote";
  console.log('server GetHomePage called:')

  cacheTag(getHomePageTag('home'));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<GetHomePageResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/GetHomePage?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
