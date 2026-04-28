import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { RefundRequestForm } from './refund-request-form';

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

export function BookingFinancialBreakdown({ data }: { data: any }) {
  const { booking, chargeLines, providerLedgers, refundRequests } = data;
  const paymentId = refundRequests.find((x: any) => x.payment_id)?.payment_id ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Booking financial summary</h2>
            <p className="text-sm text-muted-foreground">Frozen pricing, compensation, and refund state for this booking.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">Booking {booking.bookingStatus ?? '—'}</Badge>
            <Badge variant="outline">Payment {booking.paymentStatus ?? '—'}</Badge>
          </div>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div><div className="text-muted-foreground">Source currency</div><div className="font-medium">{booking.sourceCurrencyCode ?? '—'}</div></div>
          <div><div className="text-muted-foreground">Display currency</div><div className="font-medium">{booking.displayCurrencyCode ?? '—'}</div></div>
          <div><div className="text-muted-foreground">Payment currency</div><div className="font-medium">{booking.paymentCurrencyCode ?? '—'}</div></div>
          <div><div className="text-muted-foreground">Settlement currency</div><div className="font-medium">{booking.settlementCurrencyCode ?? '—'}</div></div>
          <div><div className="text-muted-foreground">Payment gross</div><div className="font-medium">{money(booking.paymentGrossAmount)}</div></div>
          <div><div className="text-muted-foreground">Discount</div><div className="font-medium">{money(booking.discountAmount)}</div></div>
          <div><div className="text-muted-foreground">Net</div><div className="font-medium">{money(booking.netAmount)}</div></div>
          <div><div className="text-muted-foreground">Refunded</div><div className="font-medium">{money(booking.refundedAmount)}</div></div>
          <div><div className="text-muted-foreground">Platform fee</div><div className="font-medium">{money(booking.platformFeeAmount)}</div></div>
          <div><div className="text-muted-foreground">Provider payable</div><div className="font-medium">{money(booking.providerPayableAmount)}</div></div>
          <div><div className="text-muted-foreground">Gateway fee</div><div className="font-medium">{money(booking.gatewayFeeAmount)}</div></div>
          <div><div className="text-muted-foreground">Remaining net</div><div className="font-medium">{money(booking.remainingNetAmount)}</div></div>
        </div>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Charge lines</h2>
          <p className="text-sm text-muted-foreground">Main service, child bookings, and add-ons as separate commercial lines.</p>
        </div>
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Line</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Policy</th>
              <th className="p-3 text-left">Gross</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-left">Net</th>
              <th className="p-3 text-left">Platform</th>
              <th className="p-3 text-left">Provider</th>
            </tr>
          </thead>
          <tbody>
            {chargeLines.map((line: any) => (
              <tr key={line.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{line.description}</div>
                  <div className="text-xs text-muted-foreground">{line.providerName ?? line.addonName ?? line.providerServiceName ?? '—'}</div>
                </td>
                <td className="p-3">{line.line_type}</td>
                <td className="p-3 text-xs text-muted-foreground">{line.policy_id ?? 'No policy'}</td>
                <td className="p-3">{money(line.payment_gross_amount)} {line.payment_currency_code}</td>
                <td className="p-3">{money(line.discount_amount)}</td>
                <td className="p-3">{money(line.net_amount)}</td>
                <td className="p-3">{money(line.platform_fee_amount)}</td>
                <td className="p-3">{money(line.provider_payable_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Provider ledger entries</h2>
        <div className="space-y-2 text-sm">
          {providerLedgers.length === 0 && <div className="text-muted-foreground">No provider ledger entries yet.</div>}
          {providerLedgers.map((entry: any) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{entry.providerName ?? entry.providerId}</div>
                <div className="text-xs text-muted-foreground">{entry.entryType} • {entry.status}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{money(entry.amount)} {entry.currencyCode}</div>
                <div className="text-xs text-muted-foreground">{entry.referenceType ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Refund requests</h2>
            <p className="text-sm text-muted-foreground">Create and review partial or full refunds against frozen charge lines.</p>
          </div>
          <Link href="/admin/commercial/refund-requests" className="text-sm underline">Open all refund requests</Link>
        </div>
        <div className="mb-6 space-y-2 text-sm">
          {refundRequests.length === 0 && <div className="text-muted-foreground">No refund requests yet.</div>}
          {refundRequests.map((request: any) => (
            <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{request.reason}</div>
                <div className="text-xs text-muted-foreground">{request.refund_scope} • {request.status}</div>
              </div>
              <Link href={`/admin/commercial/refund-requests/${request.id}`} className="underline">Open</Link>
            </div>
          ))}
        </div>
        <RefundRequestForm bookingId={booking.id} paymentId={paymentId} chargeLines={chargeLines} />
      </section>
    </div>
  );
}
