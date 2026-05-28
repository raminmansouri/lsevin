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
import { getGetBookingByIdTag } from "../../db/cache";
import { GetBookingByIdResponse } from "../../types";


export interface GetBookingByIdFilterParams extends FilterParams{
   
}
 
export const getGetBookingById = async (
  request: BaseRequest,
  params?: GetBookingByIdFilterParams
): Promise<ApiReturnType<GetBookingByIdResponse>> => {
  "use cache: remote";
  console.log('server GetBookingById called:')

  cacheTag(getGetBookingByIdTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<GetBookingByIdResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/GetBookingById?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
