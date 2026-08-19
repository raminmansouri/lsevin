import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDate, formatDateTime, formatMoney } from "@core/lib/format";
import { addBookingNoteAction, assignBookingAction, updateBookingStatusAction } from "../actions";
import { getModuleSummary, listBookings } from "../repository";

function statusVariant(status?: string | null) {
  if (["Completed", "Confirmed", "Paid", "paid", "captured", "succeeded", "assigned"].includes(status || "")) return "success" as const;
  if (["Cancelled", "failed", "reassigned"].includes(status || "")) return "danger" as const;
  return "warning" as const;
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, bookings] = await Promise.all([getModuleSummary(providerId), listBookings({ providerId, limit: 50 })]);
  const firstBooking = bookings[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Booking Management" description="Provider operational view for bookings: assignment, provider notes, safe status updates, and staff/resource ownership boundaries." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Bookings</div><p className="mt-1 text-2xl font-bold">{bookings.length}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Upcoming/open</div><p className="mt-1 text-2xl font-bold">{summary.upcomingCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Assigned</div><p className="mt-1 text-2xl font-bold">{summary.assignedCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Payment attention</div><p className="mt-1 text-2xl font-bold">{summary.unpaidCount}</p></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader><CardTitle>Provider booking list</CardTitle></CardHeader>
          <CardContent>
            {bookings.length ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Booking</th><th className="p-3">Date/time</th><th className="p-3">Status</th><th className="p-3">Assigned</th><th className="p-3">Total</th></tr></thead>
                  <tbody>{bookings.map((booking) => <tr key={booking.bookingId} className="border-t border-border"><td className="p-3"><div className="font-mono text-xs">{booking.bookingId}</div><div className="text-xs text-muted-foreground">Customer {booking.customerId || "—"}</div></td><td className="p-3"><div>{formatDate(booking.selectedDate)}</div><div className="text-xs text-muted-foreground">{booking.selectedTime || "—"}</div></td><td className="p-3"><Badge variant={statusVariant(booking.bookingStatus)}>{booking.bookingStatus}</Badge><div className="mt-1"><Badge variant={statusVariant(booking.paymentStatus)}>{booking.paymentStatus || "payment unknown"}</Badge></div></td><td className="p-3"><div className="font-mono text-xs">{booking.assignedStaffId || "No staff"}</div><div className="text-xs text-muted-foreground">{booking.assignmentStatus || "unassigned"} · {booking.providerNotesCount} notes</div></td><td className="p-3 font-bold">{formatMoney(booking.totalAmount, booking.currencyCode || "USD")}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No bookings found for this provider.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form action={assignBookingAction} className="space-y-3">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Booking ID"><Input name="bookingId" defaultValue={firstBooking?.bookingId ?? ""} required /></Field>
              <Field label="Staff ID"><Input name="staffId" placeholder="category.staff.id" /></Field>
              <Field label="Resource ID"><Input name="resourceId" placeholder="optional bookable resource" /></Field>
              <Field label="Assignment note"><Textarea name="note" /></Field>
              <Button type="submit" className="w-full">Assign staff/resource</Button>
            </form>

            <form action={updateBookingStatusAction} className="space-y-3 border-t border-border pt-5">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Booking ID"><Input name="bookingId" defaultValue={firstBooking?.bookingId ?? ""} required /></Field>
              <Field label="New status"><Select name="newStatus" defaultValue="Confirmed"><option value="Confirmed">Confirmed</option><option value="InProgress">In progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option><option value="NoShow">No show</option><option value="ProviderReview">Provider review</option></Select></Field>
              <Field label="Provider note"><Textarea name="note" /></Field>
              <Button type="submit" variant="secondary" className="w-full">Update safe status</Button>
            </form>

            <form action={addBookingNoteAction} className="space-y-3 border-t border-border pt-5">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Booking ID"><Input name="bookingId" defaultValue={firstBooking?.bookingId ?? ""} required /></Field>
              <Field label="Visibility"><Select name="visibility" defaultValue="internal"><option value="internal">Internal</option><option value="customer_visible">Customer visible</option></Select></Field>
              <Field label="Note"><Textarea name="note" required /></Field>
              <Button type="submit" variant="secondary" className="w-full">Add note</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
