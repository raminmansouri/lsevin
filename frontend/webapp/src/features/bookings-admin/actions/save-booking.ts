"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/booking-admin-shared/server/db";
import { BookingFormSchema } from "../schemas";

export async function saveBookingAction(input: unknown) {
  const values = BookingFormSchema.parse(input);

  if (values.bookingId) {
    await db`
      update booking.bookings
      set provider_id = ${values.providerId},
          service_id = ${values.serviceId},
          specialist_id = ${values.specialistId ?? null},
          user_id = ${values.userId ?? null},
          selected_date = ${values.selectedDate ?? null},
          selected_time = ${values.selectedTime ?? null},
          selected_time_from = ${values.selectedTimeFrom ?? null},
          selected_time_to = ${values.selectedTimeTo ?? null},
          payment_method = ${values.paymentMethod},
          booking_status = ${values.bookingStatus},
          payment_status = ${values.paymentStatus ?? null},
          currency_code = ${values.currencyCode ?? 'USD'},
          total_amount = ${values.totalAmount ?? null},
          paid_amount = ${values.paidAmount ?? 0},
          provider_notes = ${values.providerNotes ?? null},
          provider_updated_at = now(),
          booking_ui_mode = ${values.bookingUiMode ?? 'default_slot'},
          adults = ${values.adults ?? null},
          children = ${values.children ?? null},
          infants = ${values.infants ?? null},
          rooms = ${values.rooms ?? null},
          last_modified_date = now()
      where id = ${values.bookingId}
    `;
  } else {
    await db`
      insert into booking.bookings (
        id, provider_id, service_id, specialist_id, user_id,
        selected_date, selected_time, selected_time_from, selected_time_to,
        payment_method, add_ons, upload_files, additional_services,
        payment_status, booking_status, currency_code, total_amount, paid_amount,
        provider_notes, provider_updated_at, booking_ui_mode, adults, children, infants, rooms, metadata
      ) values (
        public.uuid_generate_v4(),
        ${values.providerId},
        ${values.serviceId},
        ${values.specialistId ?? null},
        ${values.userId ?? null},
        ${values.selectedDate ?? null},
        ${values.selectedTime ?? null},
        ${values.selectedTimeFrom ?? null},
        ${values.selectedTimeTo ?? null},
        ${values.paymentMethod},
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        ${values.paymentStatus ?? 'Pending'},
        ${values.bookingStatus},
        ${values.currencyCode ?? 'USD'},
        ${values.totalAmount ?? 0},
        ${values.paidAmount ?? 0},
        ${values.providerNotes ?? null},
        now(),
        ${values.bookingUiMode ?? 'default_slot'},
        ${values.adults ?? null},
        ${values.children ?? null},
        ${values.infants ?? null},
        ${values.rooms ?? null},
        '{}'::jsonb
      )
    `;
  }

  revalidatePath('/admin/bookings');
  return { success: true };
}
