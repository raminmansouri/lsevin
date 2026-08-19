import { AlertTriangle, CalendarClock, CalendarDays, Gauge, Layers3 } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { translatedPortalValue } from "@core/i18n/config";
import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { StatCard } from "@core/ui/StatCard";
import { availabilityMarketCopy } from "../marketCopy";
import { getProviderAvailabilityConversionPulse } from "../repository";
import type { AvailabilityCoverageMode } from "../marketTypes";

function coverageLabel(mode: AvailabilityCoverageMode, copy: ReturnType<typeof availabilityMarketCopy>) {
  if (mode === "service_rule") return copy.serviceRule;
  if (mode === "provider_rule") return copy.providerRule;
  if (mode === "operating_hours") return copy.operatingHours;
  return copy.none;
}

export async function AvailabilityConversionPulse({ providerId }: { providerId: string }) {
  const locale = await getPortalLocale();
  const copy = availabilityMarketCopy(locale.locale);
  const pulse = await getProviderAvailabilityConversionPulse(providerId);

  return (
    <section className="space-y-4" data-availability-conversion-pulse>
      <div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Layers3} label={copy.activeServices} value={pulse.activeServices} />
        <StatCard icon={Gauge} label={copy.coverage} value={`${pulse.coveragePercent}%`} />
        <StatCard icon={AlertTriangle} label={copy.demandGaps} value={pulse.demandWithoutCoverage} />
        <StatCard icon={CalendarClock} label={copy.upcomingRisk} value={pulse.upcomingWithoutCoverage} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.queueTitle}</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.queueDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!pulse.gapQueue.length ? <p className="text-sm text-muted-foreground">{copy.emptyQueue}</p> : null}
          {pulse.gapQueue.map((item) => (
            <div key={item.providerServiceId} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1.4fr)_auto_auto_auto] md:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{translatedPortalValue(item.nameTranslations, locale.header, copy.service)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.coverageMode}: {coverageLabel(item.coverageMode, copy)}</p>
              </div>
              <div><p className="text-xs text-muted-foreground">{copy.recentDemand}</p><p className="font-semibold">{item.bookings30d}</p></div>
              <div><p className="text-xs text-muted-foreground">{copy.upcoming}</p><p className="font-semibold">{item.upcomingBookings30d}</p></div>
              <div className="flex items-center gap-2">
                {item.blockingServiceRules > 0 ? <Badge variant="warning">{copy.blockingRules}: {item.blockingServiceRules}</Badge> : null}
                <Badge variant="warning"><CalendarDays size={13} className="me-1 inline" />{copy.review}</Badge>
              </div>
            </div>
          ))}
          <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">{copy.notice}</div>
        </CardContent>
      </Card>
    </section>
  );
}
