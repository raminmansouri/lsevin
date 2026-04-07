
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
    error,
    isFetching,
    refetch,
  };
};