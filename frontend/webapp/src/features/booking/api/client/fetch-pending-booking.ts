/* client/fetch-pending-booking.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

/* ------------------------------------------------------------------ */
/*  Types that reflect the data returned from the server               */
/* ------------------------------------------------------------------ */
export interface PendingBookingData {
  providerId: string;
  serviceId: string;
  specialistId: string;
  selectedDate: string;
  selectedDateFrom: string;
  selectedDateTo: string;
  selectedTime: string;
  selectedTimeFrom: string;
  selectedTimeTo: string;
  addOns: any[];            // you can replace `any` with a concrete type
  uploadFiles: any[];       // ditto
  additionalServices: any[];
}

export interface GetPendingBookingResponse {
  pendingBooking: PendingBookingData;
}

/* ------------------------------------------------------------------ */
/*  Client‑side wrapper that talks to the API route                    */
/* ------------------------------------------------------------------ */
export const getPendingBookingClient = async (
  locale: Locale
): Promise<GetPendingBookingResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale);

  return await readData<GetPendingBookingResponse>(
    `/booking/getPendingBooking?${searchParams.toString()}`
  );
};

/* ------------------------------------------------------------------ */
/*  React‑Query helpers – optional, but makes the hook trivial        */
/* ------------------------------------------------------------------ */
const tag = "booking-getPendingBooking";
const queryPendingBookingKey = (locale: Locale) => [tag, locale] as const;

export const useGetPendingBooking = (locale: Locale) => {
  const options = queryOptions<GetPendingBookingResponse, IProblem>({
    queryKey: queryPendingBookingKey(locale),
    queryFn: () => getPendingBookingClient(locale),
    staleTime: 1000 * 60 * 2,   // 2 min
    gcTime: 1000 * 60 * 30,     // 30 min
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return { data, error, isFetching, refetch };
};
