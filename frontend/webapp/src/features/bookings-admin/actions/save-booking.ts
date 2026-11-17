"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/booking-admin-shared/server/db";
import { notifyBookingStatusChanged } from "@/features/notification/server/booking-notifications";
import { BookingFormSchema } from "../schemas";
import { AdminActionError, requireBookingAdmin, runAdminAction, type AdminActionResult } from "./action-result";

/**
 * Admin create/update of a booking. Deliberately skips availability, capacity and
 * pricing checks: an admin may book any customer with any provider at any time for any
 * price. What it still enforces is referential sanity (the service belongs to the
 * provider) and the database's own constraints.
 */
export async function saveBookingAction(input: unknown): Promise<AdminActionResult<{ bookingId: string }>> {
  return runAdminAction("saveBookingAction", async () => {
    const admin = await requireBookingAdmin();
    const values = BookingFormSchema.parse(input);

    const [service] = await db<{ providerId: string }[]>`
      select service_provider_id::text as "providerId"
      from category.provider_services
      where id = ${values.serviceId}
      limit 1
    `;
    if (!service || service.providerId !== values.providerId) {
      throw new AdminActionError("VALIDATION", "SERVICE_NOT_OF_PROVIDER");
    }

    const stayPatch: Record<string, string> = {};
    if (values.selectedDateFrom) stayPatch.selectedDateFrom = values.selectedDateFrom;
    if (values.selectedDateTo) stayPatch.selectedDateTo = values.selectedDateTo;
    const adminPatch = {
      ...stayPatch,
      adminNotes: values.adminNotes ?? "",
      lastAdminEditBy: admin.userId,
      lastAdminEditAt: new Date().toISOString(),
    };

    if (values.bookingId) {
      const bookingId = values.bookingId;
      const result = await db.begin(async (tx) => {
        const [before] = await tx<{ bookingStatus: string | null }[]>`
          select booking_status as "bookingStatus" from booking.bookings where id = ${bookingId} limit 1 for update
        `;
        if (!before) throw new AdminActionError("NOT_FOUND");

        await tx`
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
              currency_code = ${values.currencyCode ?? "USD"},
              total_amount = ${values.totalAmount ?? null},
              paid_amount = ${values.paidAmount ?? 0},
              provider_notes = ${values.providerNotes ?? null},
              provider_updated_at = now(),
              booking_ui_mode = ${values.bookingUiMode ?? "default_slot"},
              adults = ${values.adults ?? null},
              children = ${values.children ?? null},
              infants = ${values.infants ?? null},
              rooms = ${values.rooms ?? null},
              metadata = coalesce(metadata, '{}'::jsonb) || ${tx.json(adminPatch as unknown as Record<string, never>)},
              last_modified_date = now()
          where id = ${bookingId}
        `;
        return before;
      });

      // Never allowed to fail the save itself -- same posture as every other
      // fire-and-forget notifier in this codebase (notifyBookingCreated etc.).
      if (result.bookingStatus !== values.bookingStatus && values.userId) {
        notifyBookingStatusChanged({
          bookingId,
          customerUserId: values.userId,
          newStatus: values.bookingStatus,
        }).catch((error) => console.error("saveBookingAction: status-change notification failed", error));
      }

      revalidatePath("/admin/bookings");
      revalidatePath(`/admin/bookings/${bookingId}/update`);
      return { bookingId };
    }

    const createMetadata = {
      ...adminPatch,
      createdByAdmin: true,
      createdByAdminUserId: admin.userId,
      createdByAdminAt: new Date().toISOString(),
    };

    const [created] = await db<{ id: string }[]>`
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
        ${values.paymentStatus ?? "Pending"},
        ${values.bookingStatus},
        ${values.currencyCode ?? "USD"},
        ${values.totalAmount ?? 0},
        ${values.paidAmount ?? 0},
        ${values.providerNotes ?? null},
        now(),
        ${values.bookingUiMode ?? "default_slot"},
        ${values.adults ?? null},
        ${values.children ?? null},
        ${values.infants ?? null},
        ${values.rooms ?? null},
        ${db.json(createMetadata as unknown as Record<string, never>)}
      )
      returning id::text as id
    `;

    revalidatePath("/admin/bookings");
    return { bookingId: created.id };
  });
}
