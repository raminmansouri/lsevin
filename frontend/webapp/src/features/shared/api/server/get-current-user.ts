import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { ICurrentUser } from "@/features/shared/types/user";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getUserIdTag } from "../../db/cache";

export const getCurrentUser = async (
  request: BaseRequest
): Promise<ApiReturnType<ICurrentUser>> => {
  "use cache: remote";
  cacheLife("default");
  const response = await readData<ICurrentUser>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/current`,
    {
      ...request,
    }
  );
  const { data } = response;
  if (data) {
    cacheTag(getUserIdTag(data.customerId));
  }
  return response;
};
