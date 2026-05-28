/* server/get-booking-steps.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { Locale } from "next-intl";

/* ------------------------------------------------------------------ */
export interface BookingStep {
  num: number;
  label: string;
  components: string[];
}

export interface GetBookingStepsResponse {
  steps: BookingStep[];
}

export interface IGetBookingStepsRequest extends BaseRequest {
providerId,
      serviceId,
      specialistId,
  locale: Locale
}
/* ------------------------------------------------------------------ */
export const getBookingSteps = async (
  request: IGetBookingStepsRequest
): Promise<ApiReturnType<GetBookingStepsResponse>> => {
  "use cache"
  cacheTag("booking-getBookingSteps");
  cacheLife("default"); // 24 h

    const searchParams = new URLSearchParams();
  searchParams.set("Locale", request.locale);
   searchParams.set("providerId", request. providerId ?? '');
   searchParams.set("serviceId",  request.serviceId ?? '');
   searchParams.set("specialistId",  request.specialistId ?? '');
  
  const response = await readData<GetBookingStepsResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/getBookingSteps?${searchParams.toString()}`,
    { ...request }
  );
  return response;
};
