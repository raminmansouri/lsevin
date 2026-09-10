import { useTranslations } from "next-intl";
import { Badge } from '@/components/ui/badge';

export function ProviderRefundRequestDetail({ data }: { data: any }) {
  const t = useTranslations("AdminPages");
  const request = data.request;
  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("refundRequest")}</h2>
            <p className="text-sm text-muted-foreground">Booking {request.booking_id}</p>
          </div>
          <Badge variant="outline">{request.status}</Badge>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div><div className="text-muted-foreground">{t("scope")}</div><div className="font-medium">{request.refund_scope}</div></div>
          <div><div className="text-muted-foreground">{t("payment")}</div><div className="font-medium">{request.payment_amount ?? '—'} {request.payment_currency ?? ''}</div></div>
          <div><div className="text-muted-foreground">{t("bookingStatus")}</div><div className="font-medium">{request.booking_status ?? '—'}</div></div>
          <div><div className="text-muted-foreground">{t("created")}</div><div className="font-medium">{request.created_at}</div></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><div className="text-sm text-muted-foreground">{t("reason")}</div><div>{request.reason}</div></div>
          <div><div className="text-sm text-muted-foreground">{t("providerNote")}</div><div>{request.customer_note ?? '—'}</div></div>
          <div><div className="text-sm text-muted-foreground">{t("adminNote")}</div><div>{request.admin_note ?? '—'}</div></div>
        </div>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4"><h3 className="font-semibold">{t("refundLines")}</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">{t("type")}</th>
              <th className="p-3 text-left">{t("paymentRefund")}</th>
              <th className="p-3 text-left">{t("settlementReversal")}</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line: any) => (
              <tr key={line.id} className="border-t">
                <td className="p-3">{line.line_type}</td>
                <td className="p-3">{Number(line.payment_refund_amount ?? 0).toFixed(2)} {line.payment_currency_code}</td>
                <td className="p-3">{Number(line.settlement_reversal_amount ?? 0).toFixed(2)} {line.settlement_currency_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4"><h3 className="font-semibold">{t("executionRows")}</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">{t("gateway")}</th>
              <th className="p-3 text-left">{t("amount")}</th>
              <th className="p-3 text-left">{t("status")}</th>
              <th className="p-3 text-left">{t("processed")}</th>
            </tr>
          </thead>
          <tbody>
            {data.refunds.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={4}>{t("noRefundExecutionRowsYet")}</td></tr>}
            {data.refunds.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.gateway ?? 'wallet/gateway stub'}</td>
                <td className="p-3">{Number(row.refund_amount ?? 0).toFixed(2)} {row.currency_code}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.processed_at ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
