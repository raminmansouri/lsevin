"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/features/booking-admin-shared/server/db";

const schema = z.object({
  childBookingId: z.guid(),
  parentBookingId: z.guid(),
  status: z.string().min(1),
  adminNote: z.string().optional().nullable(),
});

export async function reviewChildBookingAction(input: unknown) {
  const values = schema.parse(input);

  await db`
    update booking.booking_child_bookings
    set status = ${values.status},
        metadata = jsonb_set(
          jsonb_set(coalesce(metadata, '{}'::jsonb), '{adminNote}', to_jsonb(${values.adminNote ?? ''}::text), true),
          '{reviewedAt}',
          to_jsonb(now()::text),
          true
        ),
        last_modified_date = now()
    where id = ${values.childBookingId}
  `;

  revalidatePath(`/admin/bookings/${values.parentBookingId}/update`);
  return { success: true };
}
