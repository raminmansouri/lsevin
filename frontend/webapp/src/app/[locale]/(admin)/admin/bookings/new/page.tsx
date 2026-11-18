import { getTranslations } from "next-intl/server";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getBookingAdminLookups } from "@/features/booking-admin-shared/server/lookups";
import { BookingAdminForm } from "@/features/bookings-admin/components/booking-admin-form";

export default async function NewBookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tAdmin = await getTranslations({ locale, namespace: "AdminGenerated" });
  const lookups = await getBookingAdminLookups(locale);
  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={tAdmin("bookingAdminAddBooking")} description={tAdmin("bookingAdminAddBookingDescription")} />
        </CardTitle>
      </CardHeader>
      <BookingAdminForm locale={locale} lookups={lookups} />
    </Card>
  );
}
