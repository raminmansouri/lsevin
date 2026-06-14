import { getTranslations } from "next-intl/server";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getBookingAdminLookups } from "@/features/booking-admin-shared/server/lookups";
import { BookingForm } from "@/features/bookings-admin/components/booking-form";

export default async function AddBookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tAdmin = await getTranslations({ locale, namespace: "AdminGenerated" });
  const lookups = await getBookingAdminLookups(locale);
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={tAdmin("createBooking")} /></CardTitle></CardHeader>
      <BookingForm locale={locale} lookups={lookups} />
    </Card>
  );
}
