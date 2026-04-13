/* server/get-available-dates.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";

export interface AvailableDate {
  date: string;
  day: string;
  available: boolean;
}

export interface GetAvailableDatesResponse {
  dates: AvailableDate[];
}

/* ------------------------------------------- */
export const getAvailableDates = async (
  request: BaseRequest
): Promise<ApiReturnType<GetAvailableDatesResponse>> => {
  "use cache"
  cacheTag("booking-getAvailableDates");
  cacheLife("default");        // ← falls back to 24 h

   const searchParams = new URLSearchParams();
  searchParams.set("Locale", request.locale);
  //  searchParams.set("providerId", request. providerId ?? '');
  //  searchParams.set("serviceId",  request.serviceId ?? '');
  //  searchParams.set("specialistId",  request.specialistId ?? '');
  
  const response = await readData<GetAvailableDatesResponse>(
        `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetBookingAvailableDates?${searchParams.toString()}`,
    { ...request }
  );
  return response;
};
