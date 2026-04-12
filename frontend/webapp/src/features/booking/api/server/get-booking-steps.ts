/* server/get-booking-steps.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

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
export const getBookingSteps = async (
  request: BaseRequest
): Promise<ApiReturnType<GetBookingStepsResponse>> => {
  cacheTag("booking-getBookingSteps");
  cacheLife("default"); // 24 h

  const response = await readData<GetBookingStepsResponse>(
    "/booking/getBookingSteps",
    { ...request }
  );
  return response;
};
