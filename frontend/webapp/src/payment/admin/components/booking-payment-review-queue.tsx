"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useAction from "@/hooks/use-action";
import { approveBookingPaymentAction, rejectBookingPaymentAction } from "@/payment/admin/actions";

export type PendingBookingPayment = {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string | null;
  receiptUrl: string | null;
  receiptMimeType: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function PendingPaymentRow({ payment, showReceipt }: { payment: PendingBookingPayment; showReceipt: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [resolved, setResolved] = useState(false);

  const { execute: approve } = useAction(approveBookingPaymentAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Payment approved.");
      setResolved(true);
    },
    onError: (error) => toast.error(error?.detail || error?.title || "Could not approve."),
  });

  const { execute: reject } = useAction(rejectBookingPaymentAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Payment rejected.");
      setResolved(true);
    },
    onError: (error) => toast.error(error?.detail || error?.title || "Could not reject."),
  });

  if (resolved) return null;

  const isImage = payment.receiptMimeType?.startsWith("image/");

  return (
    <div className="rounded-md border p-4 text-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="font-medium">{payment.customerName || "Unknown customer"}</div>
          {payment.customerEmail && <div className="text-muted-foreground" dir="ltr">{payment.customerEmail}</div>}
          <div className="text-muted-foreground">{formatDate(payment.createdAt)}</div>
          <div className="text-base font-semibold">
            {payment.amount.toLocaleString()} <span className="text-muted-foreground text-sm">{payment.currency}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            Booking: <span dir="ltr" className="font-mono">{payment.bookingId}</span>
          </div>
          {showReceipt && payment.receiptUrl && (
            <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="inline-block pt-1">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={payment.receiptUrl} alt="Receipt" className="h-28 w-auto rounded-md border object-cover" />
              ) : (
                <span className="text-sm font-medium text-primary underline">View receipt file</span>
              )}
            </a>
          )}
        </div>

        <div className="grid gap-2 sm:min-w-[360px] sm:grid-cols-2">
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
            <p className="text-xs font-medium text-green-900 dark:text-green-200">Approve</p>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="mt-2 w-full bg-green-700 text-white hover:bg-green-800"
              onClick={() => approve({ paymentId: payment.id, bookingId: payment.bookingId })}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="text-xs font-medium text-red-900 dark:text-red-200">Reject reason</p>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Rejected by admin"
              disabled={isPending}
              className="mt-1 h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              className="mt-2 w-full"
              onClick={() => reject({ paymentId: payment.id, bookingId: payment.bookingId, reason: reason || undefined })}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingPaymentReviewQueue({
  title,
  description,
  emptyLabel,
  payments,
  showReceipt,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  payments: PendingBookingPayment[];
  showReceipt: boolean;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {payments.length === 0 && <p className="text-muted-foreground text-sm">{emptyLabel}</p>}
        {payments.map((payment) => (
          <PendingPaymentRow key={payment.id} payment={payment} showReceipt={showReceipt} />
        ))}
      </CardContent>
    </Card>
  );
}
