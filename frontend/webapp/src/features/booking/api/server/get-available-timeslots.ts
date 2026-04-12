/* server/get-available-timeslots.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

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
  cacheTag("booking-getAvailableTimeslots");
  cacheLife("default");
  const response = await readData<GetAvailableTimeslotsResponse>(
    "/booking/getAvailableTimeslots",
    { ...request }
  );
  return response;
};
