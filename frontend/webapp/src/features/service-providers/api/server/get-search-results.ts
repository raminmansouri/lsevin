import "server-only";

import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getSearchResults as getSearchResultsFromDatabase } from "../../server/search.repository";
import { SearchResultsResponse } from "../../types";

export const getSearchResults = async (
  _request: BaseRequest,
  params?: {
    filters?: string;
    locale?: string;
    pageSize?: number;
    categoryId?: string;
    providerTypeId?: string;
    country?: string;
    city?: string;
  }
): Promise<ApiReturnType<SearchResultsResponse>> => {
  const data = await getSearchResultsFromDatabase({
    term: params?.filters,
    locale: params?.locale,
    limit: params?.pageSize,
    categoryId: params?.categoryId,
    providerTypeId: params?.providerTypeId,
    country: params?.country,
    city: params?.city,
  });

  return { data, error: undefined } as ApiReturnType<SearchResultsResponse>;
};
