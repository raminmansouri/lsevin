import { notFound } from 'next/navigation';
import { BookingFinancialBreakdown } from '@/features/commercial/components/admin/booking-financial-breakdown';
import { ProviderRefundRequestForm } from '@/features/provider-commercial/components/provider-refund-request-form';
import { getProviderBookingFinancial } from '@/features/provider-commercial/server/repository';
import { getTranslations } from "next-intl/server";
export default async function ProviderBookingFinancialPage({ params }: {
    params: Promise<{
        providerId: string;
        bookingId: string;
    }>;
}) {
    const tBooking = await getTranslations("Booking");
    const { providerId, bookingId } = await params;
    const data = await getProviderBookingFinancial(providerId, bookingId);
    if (!data)
        notFound();
    const paymentId = data.refundRequests.find((x: any) => x.payment_id)?.payment_id ?? null;
    return (<div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">{tBooking("bookingFinancials")}</h1><p className="text-sm text-muted-foreground">{tBooking("providerOnlyViewOfChargeLinesLedgerRowsAnd")}</p></div>
      <BookingFinancialBreakdown data={data}/>
      <ProviderRefundRequestForm providerId={providerId} bookingId={bookingId} paymentId={paymentId} chargeLines={data.chargeLines}/>
    </div>);
}
