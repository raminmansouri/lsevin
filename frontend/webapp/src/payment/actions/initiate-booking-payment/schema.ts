import * as z from "zod/v4";

export const InitiateBookingPaymentSchema = z.object({
  bookingId: z.uuid("Booking id is invalid."),
  gateway: z.enum(["zarinpal"]).default("zarinpal"),
});
