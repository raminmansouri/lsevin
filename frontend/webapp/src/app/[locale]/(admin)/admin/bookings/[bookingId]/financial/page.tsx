import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getAdminBookingFinancialBreakdown } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingFinancialBreakdown } from '@/features/commercial/components/admin/booking-financial-breakdown';

export default async function BookingFinancialPage({ params }: { params: Promise<{ locale: string; bookingId: string }> }) {
  const { locale, bookingId } = await params;
  const tBooking = await getTranslations({ locale, namespace: 'Booking' });
  const data = await getAdminBookingFinancialBreakdown(bookingId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tBooking('bookingFinancials')}</h1>
        <p className="text-sm text-muted-foreground">{tBooking('commercialSnapshotFrozenChargeLinesProviderLedgerAndRefundHistoryForThisBooking')}</p>
      </div>
      <BookingFinancialBreakdown data={data} />
    </div>
  );
}
