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
import { getFavoritesTag } from "../../db/cache";
// import { FavoritesResponse } from "../../types";


export interface FavoritesFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getFavorites = async (
  request: BaseRequest,
  params?: FavoritesFilterParams
): Promise<ApiReturnType<any>> => {
  "use cache: remote";
  console.log('server Favorites called:')

  cacheTag(getFavoritesTag(request?.userId));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<any>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Favorites?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
