import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getProviderTypeIdTag } from "../../db/cache";
import { ProviderTypeAttributesResponse } from "../../types/provider-type";

export const getProviderTypeAttributes = async (
  request: BaseRequest,
  providerTypeId: string
): Promise<ApiReturnType<ProviderTypeAttributesResponse>> => {
  "use cache: remote";
  cacheTag(getProviderTypeIdTag(providerTypeId));
  cacheLife("default");

  return readData<ProviderTypeAttributesResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/provider-types/${providerTypeId}/attributes`,
    { ...request }
  );
};
