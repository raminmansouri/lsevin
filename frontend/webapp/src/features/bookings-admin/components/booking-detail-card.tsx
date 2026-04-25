"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { reviewChildBookingAction } from "../actions/review-child-booking";
import type { BookingDetail } from "../types";

export function BookingDetailCard({ booking }: { booking: BookingDetail }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label="Provider" value={booking.providerName} />
          <Info label="Service" value={booking.serviceName} />
          <Info label="Specialist" value={booking.specialistName} />
          <Info label="Customer" value={booking.customerName} />
          <Info label="Email" value={booking.customerEmail} />
          <Info label="Status" value={booking.bookingStatus} />
          <Info label="Payment status" value={booking.paymentStatus} />
          <Info label="Payment method" value={booking.paymentMethod} />
          <Info label="Amount" value={`${booking.totalAmount ?? '-'} ${booking.currencyCode ?? ''}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Child sub-bookings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {booking.childBookings?.length ? booking.childBookings.map((item: any) => (
            <ChildBookingCard key={item.id} parentBookingId={booking.id} item={item} />
          )) : <p className="text-sm text-muted-foreground">No child bookings.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add-ons</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.addOns?.length ? booking.addOns.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.addonId}</div>
              <div className="text-muted-foreground">{item.sourceType} · {item.addonKind} · qty {item.quantity}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No add-ons.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.documents?.length ? booking.documents.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.title}</div>
              <div className="text-muted-foreground">{item.fileName}</div>
              <a href={item.fileUrl} target="_blank" className="text-primary underline">Open file</a>
            </div>
          )) : <p className="text-sm text-muted-foreground">No documents.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.payments?.length ? booking.payments.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.paymentMethod} · {item.status}</div>
              <div className="text-muted-foreground">{item.amount} {item.currency}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No payments.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}

function ChildBookingCard({ item, parentBookingId }: { item: any; parentBookingId: string }) {
  const [status, setStatus] = useState(item.status ?? 'Draft');
  const [note, setNote] = useState(item.adminNote ?? '');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <div className="font-medium">{item.providerName || item.providerId} → {item.serviceName || item.serviceId}</div>
        <div className="text-sm text-muted-foreground">{item.bookingUiMode} · {item.currency} {item.subtotalAmount}</div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Input value={status} onChange={(e) => setStatus(e.target.value)} />
        <Input value={item.selectedDate || ''} disabled />
      </div>
      <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note" />
      <div className="flex gap-2">
        <Button disabled={isPending} onClick={() => startTransition(async () => {
          try {
            await reviewChildBookingAction({ childBookingId: item.id, parentBookingId, status, adminNote: note });
            toast.success('Child booking updated');
          } catch (error: any) {
            toast.error(error?.message ?? 'Failed to update child booking');
          }
        })}>Save child review</Button>
      </div>
    </div>
  );
}
