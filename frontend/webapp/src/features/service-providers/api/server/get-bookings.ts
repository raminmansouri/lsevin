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
import { getBookingsTag } from "../../db/cache";
import { BookingsResponse } from "../../types";


export interface BookingsFilterParams extends FilterParams{
   
}
 
export const getBookings = async (
  request: BaseRequest,
  params?: BookingsFilterParams
): Promise<ApiReturnType<BookingsResponse>> => {
  "use cache: remote";
  console.log('server Bookings called:')

  cacheTag(getBookingsTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<BookingsResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Bookings?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
