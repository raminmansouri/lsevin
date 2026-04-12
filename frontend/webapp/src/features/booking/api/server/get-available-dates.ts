/* server/get-available-dates.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

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
  cacheTag("booking-getAvailableDates");
  cacheLife("default");        // ← falls back to 24 h

  const response = await readData<GetAvailableDatesResponse>(
    "/booking/getAvailableDates",
    { ...request }
  );
  return response;
};
