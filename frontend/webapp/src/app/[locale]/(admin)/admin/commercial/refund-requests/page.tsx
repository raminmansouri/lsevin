import { getTranslations } from "next-intl/server";
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminRefundRequests } from '@/features/commercial/api/server/get-admin-commercial';

export default async function RefundRequestsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const t = await getTranslations("AdminPages");
  const params = await searchParams;
  const status = typeof params?.status === 'string' ? params.status : '';
  const bookingId = typeof params?.bookingId === 'string' ? params.bookingId : '';
  const rows = await getAdminRefundRequests({ status: status || undefined, bookingId: bookingId || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("refundRequests")}</h1>
        <p className="text-sm text-muted-foreground">{t("manageRequestedApprovedProcessingAndRefundedBookingRefunds")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("filter")}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input type="text" name="bookingId" defaultValue={bookingId} placeholder={t("bookingId")} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="status" defaultValue={status} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t("allStatuses")}</option>
              <option value="requested">{t("requested")}</option>
              <option value="approved">{t("approved")}</option>
              <option value="rejected">{t("rejected")}</option>
              <option value="processing">{t("processing")}</option>
              <option value="refunded">{t("refunded")}</option>
              <option value="failed">{t("failed")}</option>
              <option value="cancelled">{t("cancelled")}</option>
            </select>
            <button type="submit" className="rounded-md border px-3 py-2 text-sm">{t("apply")}</button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">{t("booking")}</th>
              <th className="p-3 text-left">{t("reason")}</th>
              <th className="p-3 text-left">{t("scope")}</th>
              <th className="p-3 text-left">{t("status")}</th>
              <th className="p-3 text-left">{t("payment")}</th>
              <th className="p-3 text-left">{t("created")}</th>
              <th className="p-3 text-right">{t("action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-3 text-xs text-muted-foreground">{row.booking_id}</td>
                <td className="p-3">
                  <div className="font-medium">{row.reason}</div>
                  <div className="text-xs text-muted-foreground">{row.customer_note ?? '—'}</div>
                </td>
                <td className="p-3">{row.refund_scope}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.payment_amount ?? '—'} {row.payment_currency ?? ''}</td>
                <td className="p-3">{row.created_at}</td>
                <td className="p-3 text-right"><Link href={`/admin/commercial/refund-requests/${row.id}`} className="underline">{t("open")}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
