import { z } from "zod/v4";

/** Values booking.bookings.booking_status actually holds. */
export const BOOKING_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "Rejected"] as const;
/** Values booking.bookings.payment_status actually holds. */
export const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded", "Cancelled", "NotRequired"] as const;

const optionalGuid = z.preprocess((value) => (value === "" ? null : value), z.guid().optional().nullable());
const optionalText = z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable());
const isoDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
);
const clockTime = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
);
const money = z.coerce.number().min(0).max(1_000_000_000_000).optional().nullable();
const count = z.coerce.number().int().min(0).max(10_000).optional().nullable();

export const BookingFormSchema = z
  .object({
    bookingId: z.guid().optional(),
    providerId: z.guid(),
    serviceId: z.guid(),
    specialistId: optionalGuid,
    userId: optionalGuid,
    selectedDate: isoDate,
    /** Stay check-in/out; stored in metadata (the table's *_date_from/_to columns are times). */
    selectedDateFrom: isoDate,
    selectedDateTo: isoDate,
    selectedTime: clockTime,
    selectedTimeFrom: clockTime,
    selectedTimeTo: clockTime,
    paymentMethod: z.string().min(1),
    bookingStatus: z.enum(BOOKING_STATUSES),
    // The UI offers PAYMENT_STATUSES; a legacy value already on the row (e.g. "Confirmed")
    // is kept selectable so an unrelated edit never rewrites it silently.
    paymentStatus: z.string().trim().min(1).max(50).optional().nullable(),
    currencyCode: z.string().trim().min(1).max(10).optional().nullable(),
    totalAmount: money,
    paidAmount: money,
    providerNotes: optionalText,
    adminNotes: optionalText,
    bookingUiMode: z.enum(["default_slot", "date_range", "custom_form"]).optional().nullable(),
    adults: count,
    children: count,
    infants: count,
    rooms: count,
  })
  .refine(
    (values) => !values.selectedTimeFrom || !values.selectedTimeTo || values.selectedTimeFrom < values.selectedTimeTo,
    { path: ["selectedTimeTo"], message: "END_BEFORE_START" },
  )
  .refine(
    (values) => !values.selectedDateFrom || !values.selectedDateTo || values.selectedDateFrom < values.selectedDateTo,
    { path: ["selectedDateTo"], message: "CHECKOUT_BEFORE_CHECKIN" },
  );

export type BookingFormInput = z.input<typeof BookingFormSchema>;
export type BookingFormValuesParsed = z.output<typeof BookingFormSchema>;

const addonBase = {
  parentBookingId: z.guid(),
  price: z.coerce.number().min(0).max(1_000_000_000_000),
  currencyCode: z.string().trim().min(1).max(10),
  status: z.enum(BOOKING_STATUSES).default("Confirmed"),
  note: optionalText,
};

export const HotelStayAddonSchema = z
  .object({
    ...addonBase,
    providerId: z.guid(),
    serviceId: optionalGuid,
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rooms: z.coerce.number().int().min(1).max(1000).default(1),
    adults: count,
    children: count,
  })
  .refine((values) => values.checkIn < values.checkOut, { path: ["checkOut"], message: "CHECKOUT_BEFORE_CHECKIN" });

export const TransferAddonSchema = z.object({
  ...addonBase,
  routeId: z.guid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: clockTime,
  passengers: z.coerce.number().int().min(1).max(1000).default(1),
});

export const RemoveChildBookingSchema = z.object({
  parentBookingId: z.guid(),
  childBookingId: z.guid(),
});

export type HotelStayAddonInput = z.input<typeof HotelStayAddonSchema>;
export type TransferAddonInput = z.input<typeof TransferAddonSchema>;
