import { z } from "zod/v4";

export const BookingFormSchema = z.object({
  bookingId: z.guid().optional(),
  providerId: z.guid(),
  serviceId: z.guid(),
  specialistId: z.guid().optional().nullable(),
  userId: z.guid().optional().nullable(),
  selectedDate: z.string().optional().nullable(),
  selectedTime: z.string().optional().nullable(),
  selectedTimeFrom: z.string().optional().nullable(),
  selectedTimeTo: z.string().optional().nullable(),
  paymentMethod: z.string().min(1),
  bookingStatus: z.string().min(1),
  paymentStatus: z.string().optional().nullable(),
  currencyCode: z.string().optional().nullable(),
  totalAmount: z.coerce.number().optional().nullable(),
  paidAmount: z.coerce.number().optional().nullable(),
  providerNotes: z.string().optional().nullable(),
  bookingUiMode: z.enum(["default_slot", "date_range", "custom_form"]).optional().nullable(),
  adults: z.coerce.number().int().min(0).optional().nullable(),
  children: z.coerce.number().int().min(0).optional().nullable(),
  infants: z.coerce.number().int().min(0).optional().nullable(),
  rooms: z.coerce.number().int().min(0).optional().nullable(),
});

export type BookingFormInput = z.infer<typeof BookingFormSchema>;
