/* client/fetch-booking-steps.ts */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { StepDefinitions } from "@/app/[locale]/n/app/mobile/booking/components/types/BookingTypes";

/* ------------------------------------------------------------------ */
export interface BookingStep {
  num: number;
  label: string;
  components: string[];
}

export interface GetBookingStepsResponse {
  steps: BookingStep[];
}

 const steps = [
    {
      num: 1, label: 'Doctor & Date', components: [
        StepDefinitions.ChooseYourService,
        StepDefinitions.SelectDate,
        StepDefinitions.SelectTime,
      ]
    },
    {
      num: 2, label: 'Add-ons', components: [
        StepDefinitions.AddOns

      ]
    },
    {
      num: 3, label: 'Medical Files', components: [
        StepDefinitions.UploadFiles
      ]
    },
    {
      num: 4, label: 'Review & Pay', components: [
        StepDefinitions.ReviewPay
      ]
    },
  ];
/* ------------------------------------------------------------------ */
export const getBookingStepsClient = async (
    providerId,
      serviceId,
      specialistId,
  locale: Locale
): Promise<GetBookingStepsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", locale);
   searchParams.set("providerId", providerId ?? '');
   searchParams.set("serviceId", serviceId ?? '');
   searchParams.set("specialistId", specialistId ?? '');
  
  return await readData<GetBookingStepsResponse>(
    `/booking/get-booking-steps?${searchParams.toString()}`
  );
};

/* ------------------------------------------------------------------ */
const tag = "booking-getBookingSteps";
const queryBookingStepsKey = (locale: Locale) => [tag, locale] as const;

export const useGetBookingSteps = (providerId,
      serviceId,
      specialistId,
      locale: Locale) => {
  const options = queryOptions<GetBookingStepsResponse, IProblem>({
    queryKey: queryBookingStepsKey(locale),
    queryFn: () => getBookingStepsClient(providerId,
      serviceId,
      specialistId,locale),
    staleTime: 1000 * 60 * 5,   // 5 min
    gcTime: 1000 * 60 * 60,     // 1 h
  });

  const { data, error, isFetching, refetch } = useQuery(options);

  return { data, error, isFetching, refetch };
};
