"use client";

import { useQuery, queryOptions } from "@tanstack/react-query";
import axios from "axios";
import { getSession } from "next-auth/react";

import {
  EMPTY_NOTIFICATION_COUNT,
  type NotificationCountResponse,
} from "@/features/notification/types/notification-count";
import type { IProblem } from "@/types/error";

export const getNotificationCountClient = async (
  locale: string,
  token?: string | null,
): Promise<NotificationCountResponse> => {
  const response = await axios.get<NotificationCountResponse>(
    "/api/customer/get-notification-count",
    {
      headers: {
        "Content-Type": "application/json",
        "x-lsevin-locale": locale || "fa",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      withCredentials: true,
      validateStatus: (status) => status < 500,
    },
  );

  if (response.status >= 400) return EMPTY_NOTIFICATION_COUNT;

  return {
    ...EMPTY_NOTIFICATION_COUNT,
    ...(response.data ?? {}),
    count: Number(response.data?.count ?? response.data?.unreadCount ?? 0),
    unreadCount: Number(response.data?.unreadCount ?? response.data?.count ?? 0),
    totalCount: Number(response.data?.totalCount ?? 0),
    bookingCount: Number(response.data?.bookingCount ?? response.data?.byType?.booking ?? 0),
    offerCount: Number(response.data?.offerCount ?? response.data?.byType?.offer ?? 0),
    systemCount: Number(response.data?.systemCount ?? response.data?.byType?.system ?? 0),
    byType: {
      booking: Number(response.data?.byType?.booking ?? response.data?.bookingCount ?? 0),
      offer: Number(response.data?.byType?.offer ?? response.data?.offerCount ?? 0),
      system: Number(response.data?.byType?.system ?? response.data?.systemCount ?? 0),
    },
  };
};

const NOTIFICATION_COUNT_CACHE_TAG = "notification-count";
const queryNotificationCountKey = (locale: string) =>
  [NOTIFICATION_COUNT_CACHE_TAG, locale || "fa"] as const;

export const useNotificationCount = (locale: string) => {
  const options = queryOptions<NotificationCountResponse, IProblem>({
    queryKey: queryNotificationCountKey(locale),
    queryFn: async () => {
      const session = await getSession();
      const token = session?.user?.accessToken ?? null;
      return getNotificationCountClient(locale, token);
    },
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return {
    data: data ?? EMPTY_NOTIFICATION_COUNT,
    error,
    isFetching,
    refetch,
  };
};
