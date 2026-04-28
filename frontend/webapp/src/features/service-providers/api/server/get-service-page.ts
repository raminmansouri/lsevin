import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getServicePageDataTag } from "../../db/cache";
import {
  GetServicePageByIdParams,
  GetServicePageByIdResponse,
} from "../../types/service-page.types";
import { getServicePageByIdFromDb } from "../../server/service-page.repository";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

export const GET_SERVICE_PAGE_TAG = "booking-get-service-page-by-id";

export function getServicePageByIdTag(id: string) {
  return `${GET_SERVICE_PAGE_TAG}:${id}`;
}

export async function getServicePageById(
  request: BaseRequest,
  params: GetServicePageByIdParams
): Promise<ApiReturnType<GetServicePageByIdResponse>> {
  "use cache: remote";
  cacheTag(getServicePageDataTag(params.serviceId));
  cacheLife("default");

  const locale =
    (request as any)?.locale ||
    (request as any)?.headers?.["x-locale"] ||
    (request as any)?.headers?.["accept-language"] ||
    "en-US";

  const data = await getServicePageByIdFromDb({
    serviceId: params.serviceId,
    locale,
  });

  if (!data) {
    return {
      data: undefined,
      error: {
        title: "Service was not found.",
        status: 404,
        detail: "No active service/provider service matched the requested id.",
      },
    } as ApiReturnType<GetServicePageByIdResponse>;
  }

  return { data, error: undefined } as ApiReturnType<GetServicePageByIdResponse>;
}
