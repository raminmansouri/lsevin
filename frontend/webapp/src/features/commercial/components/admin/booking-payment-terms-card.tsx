import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BookingPaymentTermsRecord } from '../../types';

export function BookingPaymentTermsCard({ terms }: { terms: BookingPaymentTermsRecord | null }) {
  if (!terms) {
    return (
      <Card>
        <CardHeader><CardTitle>Booking payment terms</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No frozen booking payment terms were found for this booking yet.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking payment terms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div><div className="text-xs text-muted-foreground">Collection mode</div><div className="font-medium">{terms.collectionMode}</div></div>
          <div><div className="text-xs text-muted-foreground">Currency</div><div className="font-medium">{terms.paymentCurrencyCode}</div></div>
          <div><div className="text-xs text-muted-foreground">Due now</div><div className="font-medium">{terms.dueNowAmount}</div></div>
          <div><div className="text-xs text-muted-foreground">Due later</div><div className="font-medium">{terms.dueLaterAmount}</div></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div><div className="text-xs text-muted-foreground">Deposit percent</div><div className="font-medium">{terms.depositPercent ?? '—'}</div></div>
          <div><div className="text-xs text-muted-foreground">Deposit fixed</div><div className="font-medium">{terms.depositFixedAmount ?? '—'}</div></div>
          <div><div className="text-xs text-muted-foreground">Refund mode</div><div className="font-medium">{terms.depositRefundableMode}</div></div>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3">Line</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Status</th>
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
