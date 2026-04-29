import "server-only";

import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getSearchHistory as getSearchHistoryFromDatabase } from "../../server/search.repository";
import { SearchHistoryResponse } from "../../types";

export const getSearchHistory = async (
  _request: BaseRequest,
  params?: { locale?: string }
): Promise<ApiReturnType<SearchHistoryResponse>> => {
  const data = await getSearchHistoryFromDatabase(params?.locale);

  return { data, error: undefined } as ApiReturnType<SearchHistoryResponse>;
};
