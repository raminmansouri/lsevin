import 'server-only';

import sql from '@/config/database/db';
import { buildBookingChargeLinesForBooking, persistChargeLinesAndLedgers } from '@/features/commercial/lib/server/compensation-engine';

export async function applyCommercialSnapshotAfterCheckout(input: {
  bookingId: string;
  paymentId?: string | null;
  actorUserId?: string | null;
}) {
  const chargeLines = await buildBookingChargeLinesForBooking(input.bookingId);
  const persisted = await persistChargeLinesAndLedgers(input.bookingId, chargeLines);

  if (input.paymentId) {
    await sql`
      update booking.payments
         set gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${
           {
             commercialSnapshot: {
               appliedAt: new Date().toISOString(),
               chargeLineCount: persisted.chargeLineCount,
               bookingId: input.bookingId,
             },
           } as any
         }
       where id = ${input.paymentId}
    `;
  }

  return persisted;
}
