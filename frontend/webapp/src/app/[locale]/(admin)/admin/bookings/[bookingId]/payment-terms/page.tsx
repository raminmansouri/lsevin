import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getAdminBookingPaymentTerms } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingPaymentTermsCard } from '@/features/commercial/components/admin/booking-payment-terms-card';

export default async function BookingPaymentTermsPage({ params }: { params: Promise<{ locale: string; bookingId: string }>; }) {
  const { locale, bookingId } = await params;
  const tBooking = await getTranslations({ locale, namespace: 'Booking' });
  if (!bookingId) notFound();
  const terms = await getAdminBookingPaymentTerms(bookingId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tBooking('bookingPaymentTerms')}</h1>
        <p className="text-sm text-muted-foreground">{tBooking('reviewCustomerRequiredPayReserveBalanceDueLater')}</p>
      </div>
      <BookingPaymentTermsCard terms={terms} />
    </div>
  );
}
