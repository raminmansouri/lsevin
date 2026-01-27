import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getProviderTypeGlobalTag } from "../../db/cache";
import { PublicProviderType } from "../../types/provider-type";

export const getPublicProviderTypes = async (
  request: BaseRequest
): Promise<ApiReturnType<PublicProviderType[]>> => {
  "use cache: remote";
  cacheTag(getProviderTypeGlobalTag());
  cacheLife("default");

  const response = await readData<PublicProviderType[]>(
    `${CATEGORY_MODULE_BASE_PATH}/provider-types`,
    {
      ...request,
    }
  );
  return response;
};
