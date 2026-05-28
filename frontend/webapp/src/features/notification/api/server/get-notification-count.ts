import "server-only";

<<<<<<< HEAD
import { getNotificationUnreadCountByCustomerId } from "@/features/notification/db/notification-count.queries";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import type { NotificationCountResponse } from "@/features/notification/types/notification-count";
import { EMPTY_NOTIFICATION_COUNT } from "@/features/notification/types/notification-count";
import type { BaseRequest } from "@/types/common";
import type { ApiReturnType } from "@/types/network";

type CountRequest = BaseRequest & {
  token?: string | null;
  accessToken?: string | null;
  locale?: string | null;
};

export const getNotificationCount = async (
  request: CountRequest,
): Promise<ApiReturnType<NotificationCountResponse>> => {
  try {
    const customerId = await resolveCurrentNotificationCustomerId({
      accessToken: request.token || request.accessToken || null,
      locale: request.locale || null,
    });

    if (!customerId) {
      return { data: EMPTY_NOTIFICATION_COUNT, error: undefined } as ApiReturnType<NotificationCountResponse>;
    }

    const data = await getNotificationUnreadCountByCustomerId(customerId);
    return { data, error: undefined } as ApiReturnType<NotificationCountResponse>;
  } catch (error) {
    console.error("Failed to load notification count", error);
    return { data: EMPTY_NOTIFICATION_COUNT, error: undefined } as ApiReturnType<NotificationCountResponse>;
  }
=======
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
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
};
