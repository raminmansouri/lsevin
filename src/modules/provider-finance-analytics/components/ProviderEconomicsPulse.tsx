import { CircleDollarSign, Landmark, ReceiptText, RotateCcw } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { translatedPortalValue } from "@core/i18n/config";
import { formatMoney } from "@core/lib/format";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { StatCard } from "@core/ui/StatCard";
import { providerEconomicsCopy } from "../marketCopy";
import { getProviderEconomicsPulse } from "../marketRepository";
import type { DateRangeInput } from "../types";
import type { ProviderEconomicsSignal } from "../marketTypes";

function signalLabel(signal: ProviderEconomicsSignal, copy: ReturnType<typeof providerEconomicsCopy>) {
  if (signal === "refund_drag") return copy.refundSignal;
  if (signal === "revenue_concentration") return copy.concentrationSignal;
  return copy.settlementSignal;
}

export async function ProviderEconomicsPulse({ providerId, range }: { providerId: string; range?: DateRangeInput }) {
  const locale = await getPortalLocale();
  const copy = providerEconomicsCopy(locale.locale);
  const pulse = await getProviderEconomicsPulse(providerId, range);
  const currency = pulse.range.currencyCode;
  const money = (value: string) => formatMoney(value, currency, locale.header);

  return (
    <section className="space-y-4" data-provider-economics-pulse>
      <div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label={copy.gross} value={money(pulse.settlementGrossAmount)} />
        <StatCard icon={ReceiptText} label={copy.payable} value={money(pulse.providerPayableAmount)} />
        <StatCard icon={Landmark} label={copy.retained} value={money(pulse.retainedProviderPayableAmount)} />
        <StatCard icon={RotateCcw} label={copy.reversals} value={money(pulse.appliedReversalAmount)} />
      </div>
      <Card>
        <CardHeader><CardTitle>{copy.queueTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{copy.queueDescription}</p></CardHeader>
        <CardContent className="space-y-3">
          {!pulse.attentionQueue.length ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : null}
          {pulse.attentionQueue.map((item) => (
            <div key={item.providerServiceId} className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] xl:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{translatedPortalValue(item.nameTranslations, locale.header, item.providerServiceId)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{item.signals.map((signal) => <Badge key={signal} variant="warning">{signalLabel(signal, copy)}</Badge>)}</div>
              </div>
              <div><p className="text-xs text-muted-foreground">{copy.bookings}</p><p className="font-semibold">{item.completedBookings}</p></div>
              <div><p className="text-xs text-muted-foreground">{copy.retained}</p><p className="font-semibold">{money(item.retainedProviderPayableAmount)}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{copy.providerShare}: {item.providerSharePercent}%</Badge>
                <Badge variant="neutral">{copy.refundDrag}: {item.refundDragPercent}%</Badge>
                <Badge variant="neutral">{copy.revenueShare}: {item.retainedRevenueSharePercent}%</Badge>
                {item.signals.includes("settlement_in_progress") ? <LinkButton href={`/providers/${providerId}/finance/settlements`} size="sm" variant="secondary">{copy.settlements}</LinkButton> : null}
              </div>
            </div>
          ))}
          <div className="grid gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground sm:grid-cols-3">
            <span>{copy.pending}: {money(pulse.pendingLedgerAmount)}</span><span>{copy.approved}: {money(pulse.approvedLedgerAmount)}</span><span>{copy.paid}: {money(pulse.paidLedgerAmount)}</span>
          </div>
          <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">{copy.notice}</div>
        </CardContent>
      </Card>
    </section>
  );
}
