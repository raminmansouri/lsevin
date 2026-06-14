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
import { getGetUploadFilesTag } from "../../db/cache";
import { UploadFilesResponse } from "@/app/[locale]/n/app/mobile/booking/components/UploadFiles/UploadFiles";


export interface GetUploadFilesFilterParams extends FilterParams{
  providerId,
      serviceId,
      specialistId
}
 
export const getGetUploadFiles = async (
  request: BaseRequest,
  params?: GetUploadFilesFilterParams
): Promise<ApiReturnType<UploadFilesResponse>> => {
  "use cache: remote";
  console.log('server GetUploadFiles called:')

  cacheTag(getGetUploadFilesTag(params?.providerId,
   params?. serviceId,
    params?.specialistId));
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    // addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  

  const response = await readData<UploadFilesResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetUploadFiles?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
