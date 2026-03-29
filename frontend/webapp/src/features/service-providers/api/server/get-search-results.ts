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
import { getSearchResultsTag } from "../../db/cache";
import { SearchResultsResponse } from "../../types";


export const getSearchResults = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<SearchResultsResponse>> => {
  "use cache: remote";
  console.log('server get-search-res called:')

  cacheTag(getSearchResultsTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
  if (params) {
    addAllFilterParams(searchParams, params);
  }
  

  const response = await readData<SearchResultsResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/GetSearchResults?${searchParams.toString()}`,
    {
      ...request,
    }
  );
  return response;
};
