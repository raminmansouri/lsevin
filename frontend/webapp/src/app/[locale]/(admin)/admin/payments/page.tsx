import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import db from "@/config/database/db";
import { BookingPaymentReviewQueue, type PendingBookingPayment } from "@/payment/admin/components/booking-payment-review-queue";

async function listPendingBookingPayments(paymentMethod: string): Promise<PendingBookingPayment[]> {
  const rows = await db<any[]>`
    select p.id::text as id,
           p.booking_id::text as "bookingId",
           p.amount::float as amount,
           p.currency,
           p.gateway_payload,
           p.created_at::text as "createdAt",
           trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as "customerName",
           u.email as "customerEmail"
    from booking.payments p
    left join identity.asp_net_users u on u.id = p.user_id
    where p.payment_method = ${paymentMethod} and p.status = 'Pending'
    order by p.created_at asc nulls last
    limit 200
  `;

  return rows.map((row) => ({
    id: row.id,
    bookingId: row.bookingId,
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? "",
    customerName: row.customerName || null,
    customerEmail: row.customerEmail || null,
    createdAt: row.createdAt,
    receiptUrl: row.gateway_payload?.receipt?.fileUrl ?? null,
    receiptMimeType: row.gateway_payload?.receipt?.mimeType ?? null,
  }));
}

export default async function PaymentsPage() {
  const [pendingReceipts, pendingCollections, items] = await Promise.all([
    listPendingBookingPayments("bank_receipt"),
    listPendingBookingPayments("pay_on_delivery"),
    db<any[]>`
      select p.*, trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as customer_name
      from booking.payments p
      left join identity.asp_net_users u on u.id = p.user_id
      order by p.created_at desc
      limit 300
    `,
  ]);

  return (
    <div className="space-y-6">
      <BookingPaymentReviewQueue
        title="Pending bank receipts"
        description="Approve or reject receipts customers uploaded for bank-transfer payments."
        emptyLabel="No bank receipts are waiting for review."
        payments={pendingReceipts}
        showReceipt
      />

      <BookingPaymentReviewQueue
        title="Pending cash collections"
        description="Mark pay-on-delivery bookings as paid once the cash has been collected."
        emptyLabel="No pay-on-delivery payments are waiting for collection."
        payments={pendingCollections}
        showReceipt={false}
      />

      <Card>
        <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Booking payments" description="Normalized payment attempts and reconciliations" /></CardTitle></CardHeader>
        <CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-md border p-4 text-sm"><div className="font-medium">{item.customer_name || item.user_id}</div><div className="text-muted-foreground">{item.payment_method} · {item.status} · {item.gateway || 'manual'}</div><div>{item.amount} {item.currency}</div></div>)}</CardContent>
      </Card>
    </div>
  );
}
