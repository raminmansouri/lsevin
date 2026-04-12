/* client/fetch-booking-steps.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

/* ------------------------------------------------------------------ */
export interface BookingStep {
  num: number;
  label: string;
  components: string[];
}

export interface GetBookingStepsResponse {
  steps: BookingStep[];
}

/* ------------------------------------------------------------------ */
export const getBookingStepsClient = async (
  locale: Locale
): Promise<GetBookingStepsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale);
  return await readData<GetBookingStepsResponse>(
    `/booking/getBookingSteps?${searchParams.toString()}`
  );
};

/* ------------------------------------------------------------------ */
const tag = "booking-getBookingSteps";
const queryBookingStepsKey = (locale: Locale) => [tag, locale] as const;

export const useGetBookingSteps = (locale: Locale) => {
  const options = queryOptions<GetBookingStepsResponse, IProblem>({
    queryKey: queryBookingStepsKey(locale),
    queryFn: () => getBookingStepsClient(locale),
    staleTime: 1000 * 60 * 5,   // 5 min
    gcTime: 1000 * 60 * 60,     // 1 h
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return { data, error, isFetching, refetch };
};
