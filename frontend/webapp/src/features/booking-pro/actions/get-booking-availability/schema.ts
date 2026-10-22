import * as z from "zod/v4";

// GUID, not RFC UUID: many catalog ids in production lack RFC version/variant bits.
const NullableUuid = z.guid().nullish().or(z.literal(""));

export const GetBookingAvailableDatesSchema = z.object({
  providerId: NullableUuid.optional(),
  serviceId: NullableUuid.optional(),
  specialistId: NullableUuid.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  calendar: z.enum(["gregorian", "jalali"]).optional(),
});

export const GetBookingAvailableTimeSlotsSchema = z.object({
  selectedDate: z.string().min(1),
  providerId: NullableUuid.optional(),
  serviceId: NullableUuid.optional(),
  specialistId: NullableUuid.optional(),
});

export const GetBookingDateRangeAvailabilitySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  providerId: NullableUuid.optional(),
  serviceId: NullableUuid.optional(),
  requestedUnits: z.coerce.number().int().positive().optional(),
});
