import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getBookingAdminLookups } from "@/features/booking-admin-shared/server/lookups";
import { BookingDetailCard } from "@/features/bookings-admin/components/booking-detail-card";
import { BookingForm } from "@/features/bookings-admin/components/booking-form";
import { getBookingById } from "@/features/bookings-admin/server/repository";

export default async function UpdateBookingPage({ params }: { params: Promise<{ locale: string; bookingId: string }> }) {
  const { locale, bookingId } = await params;
  const tAdmin = await getTranslations({ locale, namespace: "AdminGenerated" });
  const [booking, lookups] = await Promise.all([
    getBookingById(bookingId, locale),
    getBookingAdminLookups(locale),
  ]);
  if (!booking) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={tAdmin("updateBookingId", { id: booking.id })} /></CardTitle></CardHeader>
        <BookingForm booking={booking} locale={locale} lookups={lookups} />
      </Card>
      <BookingDetailCard booking={booking} />
    </div>
  );
}
