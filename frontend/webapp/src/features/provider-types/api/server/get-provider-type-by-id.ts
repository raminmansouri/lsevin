import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getProviderTypeIdTag } from "../../db/cache";
import { ProviderType } from "../../types/provider-type";

export const getProviderTypeById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<ProviderType>> => {
  "use cache: remote";
  cacheTag(getProviderTypeIdTag(id));
  cacheLife("default");

  const response = await readData<ProviderType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/provider-types/${id}`,
    {
      ...request,
    }
  );
  return response;
};
