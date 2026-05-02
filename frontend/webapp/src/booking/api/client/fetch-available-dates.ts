/* client/fetch-available-dates.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

export interface AvailableDate {
  date: string;   // e.g. '2026-03-15'
  day: string;    // e.g. 'Mon'
  available: boolean;
}

export interface GetAvailableDatesResponse {
  dates: AvailableDate[];
}

/* ------------------------------------------- */
export const getAvailableDatesClient = async (
 providerId,
      serviceId,
      specialistId, locale: Locale
): Promise<GetAvailableDatesResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale ?? '');
  searchParams.set("providerId", providerId ?? '');
  searchParams.set("serviceId", serviceId ?? '');
  searchParams.set("specialistId", specialistId ?? '');
  
  return await readData<GetAvailableDatesResponse>(
    `/booking/get-available-dates?${searchParams.toString()}`
  );
};

/* ------------------------------------------- */
const tag = "booking-getAvailableDates";
const queryAvailableDatesKey = (providerId: unknown, serviceId: unknown, specialistId: unknown, locale: Locale) => [tag, locale, providerId ?? null, serviceId ?? null, specialistId ?? null] as const;

export const useGetAvailableDates = (providerId,
      serviceId,
      specialistId,
      locale: Locale) => {
  const options = queryOptions<GetAvailableDatesResponse, IProblem>({
    queryKey: queryAvailableDatesKey(providerId, serviceId, specialistId, locale),
    queryFn: () => getAvailableDatesClient(providerId,
      serviceId,
      specialistId,locale),
    staleTime: 1000 * 60 * 5,  // 5 min
    gcTime: 1000 * 60 * 60,    // 1 h
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return { data, error, isFetching, refetch };
};
