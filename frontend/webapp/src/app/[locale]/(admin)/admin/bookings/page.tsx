import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getBookings } from "@/features/bookings-admin/server/repository";
import BookingsListTable from "@/features/bookings-admin/components/bookings-list/bookings-list-table";

export default async function AdminBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items = await getBookings(locale);

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Bookings" description="Parent bookings, child bookings, documents, add-ons and payments" /></CardTitle></CardHeader>
      <BookingsListTable items={items} />
    </Card>
  );
}
