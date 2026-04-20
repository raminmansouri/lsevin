import "server-only";
/* ----------------------------------------------------
 * The actual server side implementation that talks
 * ---------------------------------------------------- */
import type { NextRequest } from 'next/server';

import {
    unstable_cacheLife as cacheLife,
    unstable_cacheTag as cacheTag,
  } from "next/cache";

import { getServicePageDataTag, getServiceProviderGlobalTag } from '../../db/cache';
import { GetServicePageByIdParams, GetServicePageByIdResponse } from "../../types/service-page.types";
import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH, CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { SearchResultsResponse } from "../../types";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

export const GET_SERVICE_PAGE_TAG = 'booking-get-service-page-by-id';   // tag used in the query key

export function getServicePageByIdTag(id: string) {
  return `${GET_SERVICE_PAGE_TAG}:${id}`;   // e.g. booking-get-service-page-by-id:123
}

/* ----------------------------------------------------
 * Helper that returns a single service page.
 * ---------------------------------------------------- */
export async function getServicePageById(
    request: BaseRequest,
    params: GetServicePageByIdParams,
): Promise<ApiReturnType<GetServicePageByIdResponse>> {
    "use cache: remote";
    cacheTag(getServicePageDataTag(params.serviceId));
    cacheLife("default");

  const { serviceId } = params;
  const tag = getServicePageByIdTag(serviceId);

  const searchParams = new URLSearchParams();
 

  const response = await readData<GetServicePageByIdResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/GetServicePageById/${serviceId}`,
    {
      ...request,
    }
  );

  return response;
}

