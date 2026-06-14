/* client/fetch-available-timeslots.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

export interface TimeSlot {
  time: string;      // e.g. '10:00 AM'
  available: boolean;
}

export interface GetAvailableTimeslotsResponse {
  timeSlots: TimeSlot[];
}

/* ------------------------------------------- */
export const getAvailableTimeslotsClient = async (
     selectedDate,
      providerId,
      serviceId,
      specialistId,
  locale: Locale
): Promise<GetAvailableTimeslotsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale);
  searchParams.set("selectedDate", selectedDate ?? '');
  searchParams.set("providerId", providerId ?? '');
  searchParams.set("serviceId", serviceId ?? '');
  searchParams.set("specialistId", specialistId ?? '');
  return await readData<GetAvailableTimeslotsResponse>(
    `/booking/get-available-timeslots?${searchParams.toString()}`
  );
};

/* ------------------------------------------- */
const tag = "booking-getAvailableTimeslots";
const queryAvailableTimeslotsKey = (selectedDate: unknown, providerId: unknown, serviceId: unknown, specialistId: unknown, locale: Locale) => [tag, locale, selectedDate ?? null, providerId ?? null, serviceId ?? null, specialistId ?? null] as const;

export const useGetAvailableTimeslots = ( selectedDate,
      providerId,
      serviceId,
      specialistId,locale: Locale) => {
  const options = queryOptions<GetAvailableTimeslotsResponse, IProblem>({
    queryKey: queryAvailableTimeslotsKey(selectedDate, providerId, serviceId, specialistId, locale),
    queryFn: () => getAvailableTimeslotsClient( selectedDate,
      providerId,
      serviceId,
      specialistId,locale),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return { data, error, isFetching, refetch };
};
