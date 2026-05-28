import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
<<<<<<< HEAD
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType } from "@/types/network";
import { getExploreTag } from "../../db/cache";
import { ExploreResponse } from "../../types";

export interface ExploreFilterParams extends FilterParams {
  priceRange?: number[];
  distance?: number;
  minRating?: number;
  verifiedOnly?: boolean | string;
  languages?: string[] | string;
  responseTime?: string;
  currencyCode?: string;
}

function normalizeRange(range?: number[]) {
  const values = Array.isArray(range)
    ? range.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (values.length >= 2) {
    const min = Math.max(0, values[0]);
    const max = Math.max(0, values[1]);
    return min > max ? [max, min] : [min, max];
  }

  if (values.length === 1) {
    return [0, Math.max(0, values[0])];
  }

  return undefined;
}

function normalizeExploreParams(params?: ExploreFilterParams): ExploreFilterParams | undefined {
  if (!params) return undefined;

  return {
    ...params,
    priceRange: normalizeRange(params.priceRange),
    distance: Math.max(0, Number(params.distance) || 0),
    minRating: Math.max(0, Number(params.minRating) || 0),
    currencyCode: params.currencyCode?.trim().toUpperCase() || undefined,
  };
}

export const getExplore = async (
  request: BaseRequest,
  params?: ExploreFilterParams,
): Promise<ApiReturnType<ExploreResponse>> => {
  "use cache: remote";
  console.log("server explore called:");
=======
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
  CUSTOMER_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";
import { getExploreTag } from "../../db/cache";
import { ExploreResponse } from "../../types";


export interface ExploreFilterParams extends FilterParams{
   priceRange: number[],
    distance: number,
    minRating: number,
    verifiedOnly: false,
    languages:string[],
    responseTime: string,
}
 
export const getExplore = async (
  request: BaseRequest,
  params?: ExploreFilterParams
): Promise<ApiReturnType<ExploreResponse>> => {
  "use cache: remote";
  console.log('server explore called:')
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

  cacheTag(getExploreTag());
  cacheLife("default");

  const searchParams = new URLSearchParams();
<<<<<<< HEAD
  const normalizedParams = normalizeExploreParams(params);

  if (normalizedParams) {
    addAllFilterParams(searchParams, normalizedParams);
    addAllParams(searchParams, normalizedParams);
  }
=======
  if (params) {
    addAllFilterParams(searchParams, params);
    addAllParams(searchParams, params);
  }
  
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

  const response = await readData<ExploreResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/Explore?${searchParams.toString()}`,
    {
      ...request,
<<<<<<< HEAD
    },
=======
    }
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  );
  return response;
};
