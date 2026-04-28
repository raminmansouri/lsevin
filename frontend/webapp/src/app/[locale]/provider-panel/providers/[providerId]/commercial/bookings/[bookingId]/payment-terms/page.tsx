import { notFound } from 'next/navigation';
import { BookingPaymentTermsCard } from '@/features/commercial/components/admin/booking-payment-terms-card';
import { getProviderBookingPaymentTerms } from '@/features/provider-commercial/server/repository';

export default async function ProviderBookingPaymentTermsPage({ params }: { params: Promise<{ providerId: string; bookingId: string }> }) {
  const { providerId, bookingId } = await params;
  const terms = await getProviderBookingPaymentTerms(providerId, bookingId);
  if (!terms) notFound();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Booking payment terms</h1><p className="text-sm text-muted-foreground">Provider-facing view of reservation due-now and balance-due-later terms.</p></div>
      <BookingPaymentTermsCard terms={terms} />
    </div>
  );
}
