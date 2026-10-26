import * as z from "zod/v4";

// GUID, not RFC UUID: many catalog ids in production lack RFC version/variant bits.
const NullableUuid = z.guid().nullish().or(z.literal(""));

export const ResolveBookingEntrySchema = z.object({
  providerId: NullableUuid.optional(),
  serviceId: NullableUuid.optional(),
  specialistId: NullableUuid.optional(),
});
