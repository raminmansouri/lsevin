import { notFound } from 'next/navigation';

import { getAdminBookingFinancialBreakdown } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingFinancialBreakdown } from '@/features/commercial/components/admin/booking-financial-breakdown';

export default async function BookingFinancialPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const data = await getAdminBookingFinancialBreakdown(bookingId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking financials</h1>
        <p className="text-sm text-muted-foreground">Commercial snapshot, frozen charge lines, provider ledger, and refund history for this booking.</p>
      </div>
      <BookingFinancialBreakdown data={data} />
    </div>
  );
}
