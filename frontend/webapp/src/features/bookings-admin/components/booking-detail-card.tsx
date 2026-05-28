"use client";


import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { reviewChildBookingAction } from "../actions/review-child-booking";
import type { BookingDetail } from "../types";

export function BookingDetailCard({ booking }: { booking: BookingDetail }) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{tAdmin("summary")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label={tAdmin("provider")} value={booking.providerName} />
          <Info label={tAdmin("service")} value={booking.serviceName} />
          <Info label={tAdmin("specialist")} value={booking.specialistName} />
          <Info label={tAdmin("customer")} value={booking.customerName} />
          <Info label={tAdmin("email")} value={booking.customerEmail} />
          <Info label={tAdmin("status")} value={booking.bookingStatus} />
          <Info label={tAdmin("paymentStatus")} value={booking.paymentStatus} />
          <Info label={tAdmin("paymentMethod")} value={booking.paymentMethod} />
          <Info label={tAdmin("amount")} value={`${booking.totalAmount ?? '-'} ${booking.currencyCode ?? ''}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tAdmin("childSubBookings")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {booking.childBookings?.length ? booking.childBookings.map((item: any) => (
            <ChildBookingCard key={item.id} parentBookingId={booking.id} item={item} />
          )) : <p className="text-sm text-muted-foreground">{tAdmin("noChildBookings")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tAdmin("addOns")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.addOns?.length ? booking.addOns.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.addonId}</div>
              <div className="text-muted-foreground">{item.sourceType} · {item.addonKind} · qty {item.quantity}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">{tAdmin("noAddOns")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tAdmin("documents")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.documents?.length ? booking.documents.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.title}</div>
              <div className="text-muted-foreground">{item.fileName}</div>
              <a href={item.fileUrl} target="_blank" className="text-primary underline">{tAdmin("openFile")}</a>
            </div>
          )) : <p className="text-sm text-muted-foreground">{tAdmin("noDocuments")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{tAdmin("payments")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {booking.payments?.length ? booking.payments.map((item: any) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{item.paymentMethod} · {item.status}</div>
              <div className="text-muted-foreground">{item.amount} {item.currency}</div>
            </div>
          )) : <p className="text-sm text-muted-foreground">{tAdmin("noPayments")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}

function ChildBookingCard({ item, parentBookingId }: { item: any; parentBookingId: string }) {
  const tAdmin = useTranslations("AdminGenerated");
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
      <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tAdmin("reviewNote")} />
      <div className="flex gap-2">
        <Button disabled={isPending} onClick={() => startTransition(async () => {
          try {
            await reviewChildBookingAction({ childBookingId: item.id, parentBookingId, status, adminNote: note });
            toast.success(tAdmin("childBookingUpdated"));
          } catch (error: any) {
            toast.error(error?.message ?? 'Failed to update child booking');
          }
        })}>Save child review</Button>
      </div>
    </div>
  );
}
