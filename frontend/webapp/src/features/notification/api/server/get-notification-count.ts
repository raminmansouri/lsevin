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
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { NotificationCountResponse } from "@/features/provider-types/types/provider-type";
import { getNotificationCountTag, getProviderTypeIdTag } from "@/features/provider-types/db/cache";

export const getNotificationCount = async (
  request: BaseRequest
): Promise<ApiReturnType<NotificationCountResponse>> => {
  "use cache: remote";
  // cacheTag(getNotificationCountTag());
  // cacheLife("default");

  const response = await readData<NotificationCountResponse>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/GetNotificationCount?PageNumber=1&PageSize=2`,
    {
      ...request,
    }
  );

  console.log('response:',response)
  return response;
};
