import * as z from "zod/v4";

const NullableUuid = z.string().uuid().nullish().or(z.literal(""));

export const ResolveBookingEntrySchema = z.object({
  providerId: NullableUuid.optional(),
  serviceId: NullableUuid.optional(),
  specialistId: NullableUuid.optional(),
});
