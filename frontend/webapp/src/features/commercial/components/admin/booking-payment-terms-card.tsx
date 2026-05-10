import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BookingPaymentTermsRecord } from '../../types';

export function BookingPaymentTermsCard({ terms }: { terms: BookingPaymentTermsRecord | null }) {
  const tAdmin = useTranslations("AdminGenerated");
  if (!terms) {
    return (
      <Card>
        <CardHeader><CardTitle>{tAdmin("bookingPaymentTerms")}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{tAdmin("noFrozenBookingPaymentTermsWereFoundForThisBookingYet")}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tAdmin("bookingPaymentTerms")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div><div className="text-xs text-muted-foreground">{tAdmin("collectionMode")}</div><div className="font-medium">{terms.collectionMode}</div></div>
          <div><div className="text-xs text-muted-foreground">{tAdmin("currency")}</div><div className="font-medium">{terms.paymentCurrencyCode}</div></div>
          <div><div className="text-xs text-muted-foreground">{tAdmin("dueNow")}</div><div className="font-medium">{terms.dueNowAmount}</div></div>
          <div><div className="text-xs text-muted-foreground">{tAdmin("dueLater")}</div><div className="font-medium">{terms.dueLaterAmount}</div></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div><div className="text-xs text-muted-foreground">{tAdmin("depositPercent")}</div><div className="font-medium">{terms.depositPercent ?? '—'}</div></div>
          <div><div className="text-xs text-muted-foreground">{tAdmin("depositFixed")}</div><div className="font-medium">{terms.depositFixedAmount ?? '—'}</div></div>
          <div><div className="text-xs text-muted-foreground">{tAdmin("refundMode")}</div><div className="font-medium">{terms.depositRefundableMode}</div></div>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3">{tAdmin("line")}</th>
                <th className="px-4 py-3">{tAdmin("type")}</th>
                <th className="px-4 py-3">{tAdmin("label")}</th>
                <th className="px-4 py-3">{tAdmin("amount")}</th>
                <th className="px-4 py-3">{tAdmin("currency")}</th>
                <th className="px-4 py-3">{tAdmin("status")}</th>
              </tr>
            </thead>
            <tbody>
              {(terms.schedule ?? []).map((line) => (
                <tr key={`${line.line_no}-${line.line_type}`} className="border-t">
                  <td className="px-4 py-3">{line.line_no}</td>
                  <td className="px-4 py-3">{line.line_type}</td>
                  <td className="px-4 py-3">{line.label}</td>
                  <td className="px-4 py-3">{line.amount}</td>
                  <td className="px-4 py-3">{line.currency_code}</td>
                  <td className="px-4 py-3">{line.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
