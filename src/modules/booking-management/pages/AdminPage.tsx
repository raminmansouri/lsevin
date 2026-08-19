import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime, formatMoney } from "@core/lib/format";
import { adminBookingStatusAction } from "../actions";
import { getModuleSummary, listBookings } from "../repository";

function statusVariant(status?: string | null) {
  if (["Completed", "Confirmed", "paid", "captured", "succeeded"].includes(status || "")) return "success" as const;
  if (["Cancelled", "failed"].includes(status || "")) return "danger" as const;
  return "warning" as const;
}

export async function AdminPage() {
  const [summary, bookings] = await Promise.all([getModuleSummary(), listBookings({ limit: 100 })]);
  const firstBooking = bookings[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Booking Operations" description="Admin oversight for provider booking operations, status safety, payment consistency, and auditability." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Bookings loaded</div><p className="mt-1 text-2xl font-bold">{bookings.length}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Open/upcoming</div><p className="mt-1 text-2xl font-bold">{summary.upcomingCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Assigned</div><p className="mt-1 text-2xl font-bold">{summary.assignedCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Payment attention</div><p className="mt-1 text-2xl font-bold">{summary.unpaidCount}</p></CardContent></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>Latest bookings</CardTitle></CardHeader>
          <CardContent>{bookings.length ? <div className="overflow-hidden rounded-lg border border-border"><table className="w-full text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Booking</th><th className="p-3">Provider</th><th className="p-3">Created</th><th className="p-3">Status</th><th className="p-3">Total</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.bookingId} className="border-t border-border"><td className="p-3 font-mono text-xs">{booking.bookingId}</td><td className="p-3 font-mono text-xs">{booking.serviceProviderId || "—"}</td><td className="p-3">{formatDateTime(booking.createdAt)}</td><td className="p-3"><Badge variant={statusVariant(booking.bookingStatus)}>{booking.bookingStatus}</Badge></td><td className="p-3 font-bold">{formatMoney(booking.totalAmount, booking.currencyCode || "USD")}</td></tr>)}</tbody></table></div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No bookings detected.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Admin status action</CardTitle></CardHeader>
          <CardContent>
            <form action={adminBookingStatusAction} className="space-y-3">
              <Field label="Booking ID"><Input name="bookingId" defaultValue={firstBooking?.bookingId ?? ""} required /></Field>
              <Field label="Provider ID"><Input name="providerId" defaultValue={firstBooking?.serviceProviderId ?? ""} required /></Field>
              <Field label="New status"><Select name="newStatus" defaultValue="ProviderReview"><option value="ProviderReview">Provider review</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></Select></Field>
              <Field label="Audit note"><Textarea name="note" /></Field>
              <Button type="submit" className="w-full">Apply audited status</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
