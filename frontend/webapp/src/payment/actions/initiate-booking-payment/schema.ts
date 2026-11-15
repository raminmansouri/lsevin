import * as z from "zod/v4";
import { PAYMENT_GATEWAY_CODES } from "@/payment/gateways";

export const InitiateBookingPaymentSchema = z.object({
  bookingId: z.uuid("Booking id is invalid."),
  // Optional on purpose: the server derives the gateway from the customer's
  // region. Defaulting to "zarinpal" here would make every caller that omits it
  // look like an Iranian request and get rejected for a non-Iranian customer.
  // When it is sent, the server still rejects a mismatch rather than trusting it.
  gateway: z.enum(PAYMENT_GATEWAY_CODES).optional(),
});
