import "server-only";

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
};
