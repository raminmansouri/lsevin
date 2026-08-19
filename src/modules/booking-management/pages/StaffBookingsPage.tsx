import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDate, formatDateTime } from "@core/lib/format";
import { addStaffBookingNoteAction } from "../actions";
import { listBookings } from "../repository";

export async function StaffBookingsPage({ params }: { params: Record<string, string> }) {
  const user = await requireCurrentUser();
  const staffId = params.staffId;
  await requireStaffProfilePermission(user.id, staffId, "viewOwnBookings");
  const bookings = await listBookings({ staffId, limit: 50 });
  const firstBooking = bookings[0];
  return (
    <div className="space-y-6">
      <PageHeader title="My Assigned Bookings" description="Staff-scoped operational view. Staff can see only bookings assigned to their approved profile claim." />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card><CardHeader><CardTitle>Assigned bookings</CardTitle></CardHeader><CardContent>{bookings.length ? <div className="space-y-3">{bookings.map((booking) => <div key={booking.bookingId} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between gap-3"><div className="font-mono text-xs">{booking.bookingId}</div><Badge>{booking.bookingStatus}</Badge></div><div className="mt-2 text-muted-foreground">{formatDate(booking.selectedDate)} · {booking.selectedTime || "—"} · {formatDateTime(booking.createdAt)}</div></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No assigned bookings yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Add internal service note</CardTitle></CardHeader><CardContent><form action={addStaffBookingNoteAction} className="space-y-3"><input type="hidden" name="staffId" value={staffId} /><Field label="Booking ID"><Input name="bookingId" defaultValue={firstBooking?.bookingId ?? ""} required /></Field><Field label="Provider ID"><Input name="providerId" defaultValue={firstBooking?.serviceProviderId ?? ""} required /></Field><Field label="Note"><Textarea name="note" required /></Field><Button type="submit" className="w-full">Add note</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
