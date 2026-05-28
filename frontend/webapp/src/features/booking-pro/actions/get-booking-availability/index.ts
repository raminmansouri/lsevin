"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import {
  getBookingAvailableDatesFromDb,
  getBookingAvailableTimeSlotsFromDb,
  getBookingDateRangeAvailabilityFromDb,
} from "@/features/booking-pro/server/booking-availability.repository";

import {
  GetBookingAvailableDatesSchema,
  GetBookingAvailableTimeSlotsSchema,
  GetBookingDateRangeAvailabilitySchema,
} from "./schema";
import type {
  AvailableDatesInput,
  AvailableDatesReturn,
  DateRangeAvailabilityInput,
  DateRangeAvailabilityReturn,
  TimeSlotsInput,
  TimeSlotsReturn,
} from "./types";

const datesHandler = async (
  input: AvailableDatesInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<AvailableDatesReturn> => {
  try {
    const data = await getBookingAvailableDatesFromDb({ ...input, locale });
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to load available dates", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

const timeSlotsHandler = async (
  input: TimeSlotsInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<TimeSlotsReturn> => {
  try {
    const data = await getBookingAvailableTimeSlotsFromDb({ ...input, locale });
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to load available times", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

const dateRangeHandler = async (
  input: DateRangeAvailabilityInput,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
): Promise<DateRangeAvailabilityReturn> => {
  try {
    const data = await getBookingDateRangeAvailabilityFromDb(input);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to check date range availability", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

export const getBookingAvailableDatesAction = createAuthenticatedSafeAction(GetBookingAvailableDatesSchema, datesHandler, { adminRequired: false });
export const getBookingAvailableTimeSlotsAction = createAuthenticatedSafeAction(GetBookingAvailableTimeSlotsSchema, timeSlotsHandler, { adminRequired: false });
export const getBookingDateRangeAvailabilityAction = createAuthenticatedSafeAction(GetBookingDateRangeAvailabilitySchema, dateRangeHandler, { adminRequired: false });
