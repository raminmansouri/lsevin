import type { z } from "zod/v4";
import type {
  GetBookingAvailableDatesSchema,
  GetBookingAvailableTimeSlotsSchema,
  GetBookingDateRangeAvailabilitySchema,
} from "./schema";

export type AvailableDatesInput = z.infer<typeof GetBookingAvailableDatesSchema>;
export type TimeSlotsInput = z.infer<typeof GetBookingAvailableTimeSlotsSchema>;
export type DateRangeAvailabilityInput = z.infer<typeof GetBookingDateRangeAvailabilitySchema>;

export type AvailableDatesReturn = {
  data?: { dates: Array<{ date: string; day: string; available: boolean; displayDate: string }> };
  error?: { title: string; status: number; detail?: string };
  payload?: AvailableDatesInput;
};

export type TimeSlotsReturn = {
  data?: { timeSlots: Array<{ time: string; endTime: string; label: string; endLabel: string; available: boolean; remainingCapacity?: number }> };
  error?: { title: string; status: number; detail?: string };
  payload?: TimeSlotsInput;
};

export type DateRangeAvailabilityReturn = {
  data?: { available: boolean; startDate: string; endDate: string; requestedUnits: number; remainingCapacity: number; unavailableDates: string[]; message?: string };
  error?: { title: string; status: number; detail?: string };
  payload?: DateRangeAvailabilityInput;
};
