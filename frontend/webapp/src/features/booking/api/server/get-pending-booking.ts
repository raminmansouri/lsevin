/* server/get-pending-booking.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

/* ------------------------------------------------------------------ */
/*  Types – reuse those from the client so the shape is 100 % aligned */
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
  addOns: any[];
  uploadFiles: any[];
  additionalServices: any[];
}

export interface GetPendingBookingResponse {
  pendingBooking: PendingBookingData;
}

/* ------------------------------------------------------------------ */
/*  The actual resolver that talks to your backend API               */
/* ------------------------------------------------------------------ */
export const getPendingBooking = async (
  request: BaseRequest
): Promise<ApiReturnType<GetPendingBookingResponse>> => {
  // optional cache – a pending booking is unlikely to change very often
  cacheTag("booking-getPendingBooking");
  cacheLife("default"); // 24 h

  const response = await readData<GetPendingBookingResponse>(
    "/booking/getPendingBooking",
    { ...request }
  );
  return response;
};
