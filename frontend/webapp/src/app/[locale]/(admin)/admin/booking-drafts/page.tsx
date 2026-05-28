import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { getBookingDrafts } from "@/features/booking-drafts-admin/server/repository";

export default async function BookingDraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items = await getBookingDrafts(locale);

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Booking drafts" description="Continue, inspect or repair pending user draft flows" /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <a key={item.id} href={`/admin/booking-drafts/${item.id}/update`} className="block rounded-md border p-4 hover:bg-muted/40">
            <div className="font-medium">{item.customerName || 'Unknown customer'} · {item.providerName || 'No provider'}</div>
            <div className="text-sm text-muted-foreground">{item.serviceName || 'No service'} · step {item.currentStep} · {item.status}</div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
