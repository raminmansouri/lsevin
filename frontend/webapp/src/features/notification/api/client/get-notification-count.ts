<<<<<<< HEAD
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
        "x-lsevin-locale": locale || "en",
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
  [NOTIFICATION_COUNT_CACHE_TAG, locale || "en"] as const;

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
=======

// ──────────────────────────────────────────────────────────────────────
//  src/lib/api/notifications.client.ts
// ──────────────────────────────────────────────────────────────────────
import { readData } from "@/config/http/http-service.client";
import { NotificationCountResponse, ProviderTypeResponse } from "@/features/provider-types/types/provider-type";
import { ADMIN_BASE_PATH, CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { LocaleHeaderTypes } from "@/types/common";
import { IProblem } from "@/types/error";
import { ApiReturnType } from "@/types/network";
import { queryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosHeaders, AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import { getLocaleHeader } from "@/i18n/navigation";
import { getSession } from "next-auth/react";

export const getNotificationCountClient = async (
  locale: LocaleHeaderTypes,
  token: string
): Promise<NotificationCountResponse> => {

  console.log('getNotificationCountClient')


  const path = `/customer/get-notification-count`

  console.log('use hook path:', path)

  const httpService = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const options: AxiosRequestConfig = {
    method: "GET",
  };
  const response = await
   httpService(path, options);


  return response.data ;
};



const PROVIDER_TYPE_DETAILS_CACHE_TAG = "notification-count";
const queryProviderTypeDetailsKey = () =>
  [PROVIDER_TYPE_DETAILS_CACHE_TAG] as const;

export const useNotificationCount = (locale) => {
  const options = queryOptions<NotificationCountResponse, IProblem>({
    queryKey: queryProviderTypeDetailsKey(),
    queryFn: async () => {
          const session = await getSession();   // { token, userId, locale }
          // const locale = await getLocaleHeader() ;
          
          const token = session?.user?.accessToken ?? "";
           var resp=await getNotificationCountClient( locale,token);
           return resp
      },
    staleTime: 30 * 1000, // 30 sec
    gcTime: 30 * 1000, // 30 sec
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return {
    data,
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    error,
    isFetching,
    refetch,
  };
<<<<<<< HEAD
};
=======
};
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
