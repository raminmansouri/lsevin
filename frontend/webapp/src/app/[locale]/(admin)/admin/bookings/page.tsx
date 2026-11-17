import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page/page-header";
import { getBookings } from "@/features/bookings-admin/server/repository";
import BookingsListTable from "@/features/bookings-admin/components/bookings-list/bookings-list-table";

export default async function AdminBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tAdmin = await getTranslations({ locale, namespace: "AdminGenerated" });
  const items = await getBookings(locale);

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle><PageHeader title={tAdmin("bookings")} description={tAdmin("parentBookingsChildBookingsDocumentsAddOnsAndPayments")} /></CardTitle>
        <Button asChild>
          <Link href="/admin/bookings/new" data-testid="admin-add-booking">
            <Plus className="me-1 h-4 w-4" />
            {tAdmin("bookingAdminAddBooking")}
          </Link>
        </Button>
      </CardHeader>
      <BookingsListTable items={items} />
    </Card>
  );
}
