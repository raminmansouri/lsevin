import { AlertTriangle, CalendarCheck, CheckCircle2, Clock3, Gauge, TimerReset } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime } from "@core/lib/format";
import { bookingMarketCopy } from "../marketCopy";
import { getProviderBookingResponsePulse } from "../repository";

function ageLabel(minutes: number, copy: ReturnType<typeof bookingMarketCopy>) {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} ${copy.minutes}`;
  if (minutes < 1440) return `${Math.max(1, Math.round(minutes / 60))} ${copy.hours}`;
  return `${Math.max(1, Math.round(minutes / 1440))} ${copy.days}`;
}

function scheduledLabel(date: string | null, time: string | null, locale: string, empty: string) {
  if (!date) return empty;
  const candidate = `${date}T${time || "00:00:00"}`;
  try { return formatDateTime(candidate, locale); } catch { return [date, time].filter(Boolean).join(" · ") || empty; }
}

export async function BookingResponsePulse({ providerId }: { providerId: string }) {
  const locale = await getPortalLocale();
  const copy = bookingMarketCopy(locale.locale);
  const pulse = await getProviderBookingResponsePulse(providerId);
  const responseValue = pulse.averageResponseProxyMinutes === null ? copy.notAvailable : ageLabel(pulse.averageResponseProxyMinutes, copy);

  return (
    <section className="space-y-4" data-booking-response-pulse>
      <div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label={copy.bookings30d} value={pulse.bookings30d} />
        <StatCard icon={Gauge} label={copy.actionCoverage} value={`${pulse.responseCoveragePercent}%`} />
        <StatCard icon={CheckCircle2} label={copy.completed30d} value={pulse.completed30d} />
        <StatCard icon={TimerReset} label={copy.averageResponse} value={responseValue} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>{copy.awaitingAction}</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pulse.awaitingProviderAction}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>{copy.overdue}</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pulse.overdueProviderAttention}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>{copy.cancelledNoShow}</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{pulse.cancelledOrNoShow30d}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.queueTitle}</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.queueDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!pulse.attentionQueue.length ? <p className="text-sm text-muted-foreground">{copy.emptyQueue}</p> : null}
          {pulse.attentionQueue.map((item) => (
            <div key={item.bookingId} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{copy.booking}: {item.confirmationCode || item.bookingId}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.scheduled}: {scheduledLabel(item.selectedDate, item.selectedTime, locale.header, copy.notAvailable)}</p>
              </div>
              <div><p className="text-xs text-muted-foreground">{copy.status}</p><Badge variant="warning">{item.bookingStatus}</Badge></div>
              <div><p className="text-xs text-muted-foreground">{copy.age}</p><p className="font-semibold">{ageLabel(item.ageMinutes, copy)}</p></div>
              {item.ageMinutes >= pulse.attentionThresholdMinutes ? <AlertTriangle className="text-amber-600" size={20} aria-label={copy.overdue} /> : <Clock3 className="text-muted-foreground" size={20} />}
            </div>
          ))}
          <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
            <p>{copy.proxyNotice}</p>
            <p>{copy.attentionThreshold}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
