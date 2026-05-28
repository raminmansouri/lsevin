"use client";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateProviderBookingAction } from "@/features/provider-portal/actions";
import { updateBookingProviderSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { BookingRow, ProviderWorkspace } from "../types";
import { useTranslations } from "next-intl";
type FormValues = z.infer<typeof updateBookingProviderSchema>;
export function BookingsManager({ workspace, bookings }: {
    workspace: ProviderWorkspace;
    bookings: BookingRow[];
}) {
    const tBooking = useTranslations("Booking");
    const [editing, setEditing] = useState<BookingRow | null>(null);
    return (<div className="space-y-6">
      {editing ? (<BookingUpdateForm providerId={workspace.provider.id} booking={editing} onDone={() => setEditing(null)}/>) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5"/>{tBooking("bookings")}</CardTitle>
          <CardDescription>{tBooking("mainBookingsAndChildBookingsAssignedToThisProvider")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.length ? bookings.map((booking) => (<div key={`${booking.bookingSource}-${booking.id}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{booking.serviceName}</h3>
                    <Badge variant="outline">{booking.bookingSource}</Badge>
                    <Badge>{booking.status}</Badge>
                    {booking.paymentStatus ? <Badge variant="secondary">{booking.paymentStatus}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.selectedDate || "-"} {booking.selectedTime ? `· ${booking.selectedTime}` : ""}
                    {booking.specialistName ? ` · ${booking.specialistName}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{tBooking("customer2")}{booking.customerName || "-"} {booking.customerEmail ? `(${booking.customerEmail})` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{tBooking("total2")}{booking.currencyCode || ""} {booking.totalAmount.toLocaleString()}
                  </p>
                  {booking.providerNotes ? <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{booking.providerNotes}</p> : null}
                </div>
                {workspace.permissions.manageBookings ? (<Button variant="outline" size="sm" onClick={() => setEditing(booking)}>
                    <Edit className="mr-2 h-4 w-4"/>{tBooking("update")}</Button>) : null}
              </div>
            </div>)) : (<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">{tBooking("noBookingsYet")}</div>)}
        </CardContent>
      </Card>
    </div>);
}
function BookingUpdateForm({ providerId, booking, onDone }: {
    providerId: string;
    booking: BookingRow;
    onDone: () => void;
}) {
    const tBooking = useTranslations("Booking");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const form = useForm<FormValues>({
        resolver: zodResolver(updateBookingProviderSchema),
        defaultValues: {
            providerId,
            bookingId: booking.id,
            bookingSource: booking.bookingSource,
            providerNotes: booking.providerNotes || "",
            status: booking.status as any,
        },
    });
    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const response = await updateProviderBookingAction(values);
            if (!response.ok) {
                toast.error(response.error || "Booking could not be updated.");
                return;
            }
            toast.success(tBooking("bookingUpdated"));
            onDone();
            router.refresh();
        });
    };
    return (<Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{tBooking("updateBooking")}</CardTitle>
        <CardDescription>{booking.serviceName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <input type="hidden" {...form.register("providerId")}/>
          <input type="hidden" {...form.register("bookingId")}/>
          <input type="hidden" {...form.register("bookingSource")}/>

          <label className="space-y-2">
            <span className="text-sm font-medium">{tBooking("status")}</span>
            <select {...form.register("status")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              {["Pending", "Confirmed", "Cancelled", "Completed"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{tBooking("providerNotes")}</span>
            <Textarea {...form.register("providerNotes")} rows={4} disabled={isPending}/>
          </label>

          <div className="flex justify-end gap-3 border-t pt-5">
            <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>{tBooking("cancel")}</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save booking"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
