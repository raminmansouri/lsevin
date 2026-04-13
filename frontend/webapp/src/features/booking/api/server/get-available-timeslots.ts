/* server/get-available-timeslots.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface GetAvailableTimeslotsResponse {
  slots: TimeSlot[];
}

export const getAvailableTimeslots = async (
  request: BaseRequest
): Promise<ApiReturnType<GetAvailableTimeslotsResponse>> => {
  "use cache"
  cacheTag("booking-GetBookingAvailableTimes");
  cacheLife("default");
  const searchParams = new URLSearchParams();
  searchParams.set("Locale", request.locale);
  //  searchParams.set("providerId", request. providerId ?? '');
  //  searchParams.set("serviceId",  request.serviceId ?? '');
  //  searchParams.set("specialistId",  request.specialistId ?? '');

  const response = await readData<GetAvailableTimeslotsResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetBookingAvailableTimes?${searchParams.toString()}`,
    { ...request }
  ); 
  return response;
};
