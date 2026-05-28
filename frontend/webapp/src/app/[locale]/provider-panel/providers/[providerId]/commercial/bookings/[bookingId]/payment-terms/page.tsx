import { notFound } from 'next/navigation';
import { BookingPaymentTermsCard } from '@/features/commercial/components/admin/booking-payment-terms-card';
import { getProviderBookingPaymentTerms } from '@/features/provider-commercial/server/repository';
import { getTranslations } from "next-intl/server";
export default async function ProviderBookingPaymentTermsPage({ params }: {
    params: Promise<{
        providerId: string;
        bookingId: string;
    }>;
}) {
    const tBooking = await getTranslations("Booking");
    const { providerId, bookingId } = await params;
    const terms = await getProviderBookingPaymentTerms(providerId, bookingId);
    if (!terms)
        notFound();
    return (<div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">{tBooking("bookingPaymentTerms")}</h1><p className="text-sm text-muted-foreground">{tBooking("providerFacingViewOfReservationDueNowAndBalance")}</p></div>
      <BookingPaymentTermsCard terms={terms}/>
    </div>);
}
