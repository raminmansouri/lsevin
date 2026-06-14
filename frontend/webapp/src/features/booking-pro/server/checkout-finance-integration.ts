import 'server-only';

import sql from '@/config/database/db';
import { applyCommercialSnapshotAfterCheckout } from './commercial-integration';
import { materializeBookingPaymentTermsFromDraft } from './payment-policy-integration';

/**
 * Call this immediately after draft -> booking checkout succeeds and payment row is created.
 * It freezes both commercial compensation and booking-payment collection terms on the final booking.
 */
export async function applyFinanceSnapshotsAfterCheckout(input: {
  draftId: string;
  bookingId: string;
  paymentId?: string | null;
}) {
  const [terms, commercial] = await Promise.all([
    materializeBookingPaymentTermsFromDraft({ draftId: input.draftId, bookingId: input.bookingId }),
    applyCommercialSnapshotAfterCheckout({ bookingId: input.bookingId, paymentId: input.paymentId ?? null }),
  ]);

  await sql`
    update booking.bookings
       set additional_services = coalesce(additional_services, '[]'::jsonb)
     where id = ${input.bookingId}
  `;

  return {
    paymentTermsId: terms?.id ?? null,
    commercialSnapshot: commercial,
  };
}
