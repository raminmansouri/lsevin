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
import { addAllFilterParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";
import { getSearchHistoryTag } from "../../db/cache";
import { SearchHistoryResponse } from "../../types";


export const getSearchHistory = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<SearchHistoryResponse>> => {
  "use cache: remote";
  console.log('server get-search-history called:')

  cacheTag(getSearchHistoryTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }
  

  const response = await readData<SearchHistoryResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/GetSearchHistory?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
