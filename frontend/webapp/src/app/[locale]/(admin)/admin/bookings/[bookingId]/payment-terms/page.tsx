import { notFound } from 'next/navigation';

import { getAdminBookingPaymentTerms } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingPaymentTermsCard } from '@/features/commercial/components/admin/booking-payment-terms-card';

export default async function BookingPaymentTermsPage({ params }: { params: Promise<{ bookingId: string }>; }) {
  const { bookingId } = await params;
  if (!bookingId) notFound();
  const terms = await getAdminBookingPaymentTerms(bookingId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking payment terms</h1>
        <p className="text-sm text-muted-foreground">Review how much the customer was required to pay to reserve this booking and what balance remains due later.</p>
      </div>
      <BookingPaymentTermsCard terms={terms} />
    </div>
  );
}
