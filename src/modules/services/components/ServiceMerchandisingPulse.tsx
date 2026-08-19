import { BadgePercent, Image, Megaphone, MessageSquareText, Sparkles, Star } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { translatedPortalValue } from "@core/i18n/config";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { StatCard } from "@core/ui/StatCard";
import { serviceMerchandisingCopy } from "../marketCopy";
import { getProviderServiceMerchandisingPulse } from "../repository";
import type { ServiceMerchandisingIssue } from "../marketTypes";

function issueLabel(issue: ServiceMerchandisingIssue, copy: ReturnType<typeof serviceMerchandisingCopy>) {
  if (issue === "missing_media") return copy.missingMedia;
  if (issue === "weak_localized_content") return copy.weakContent;
  if (issue === "no_active_offer") return copy.noOffer;
  return copy.lowReviews;
}

export async function ServiceMerchandisingPulse({ providerId }: { providerId: string }) {
  const locale = await getPortalLocale();
  const copy = serviceMerchandisingCopy(locale.locale);
  const pulse = await getProviderServiceMerchandisingPulse(providerId, locale.header);

  return (
    <section className="space-y-4" data-service-merchandising-pulse>
      <div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Sparkles} label={copy.bookable} value={pulse.bookableServices} />
        <StatCard icon={Megaphone} label={copy.strength} value={`${pulse.merchandisingStrengthPercent}%`} />
        <StatCard icon={Image} label={copy.strengthen} value={pulse.bookableServicesToStrengthen} />
        <StatCard icon={BadgePercent} label={copy.demand} value={pulse.demandOnServicesToStrengthen30d} />
      </div>
      <Card>
        <CardHeader><CardTitle>{copy.queueTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{copy.queueDescription}</p></CardHeader>
        <CardContent className="space-y-3">
          {!pulse.queue.length ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : null}
          {pulse.queue.map((item) => (
            <div key={item.providerServiceId} className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1.5fr)_auto_auto_auto] lg:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{translatedPortalValue(item.nameTranslations, locale.header, item.providerServiceId)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.issues.map((issue) => <Badge key={issue} variant="warning">{issueLabel(issue, copy)}</Badge>)}
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">{copy.score}</p><p className="font-semibold">{item.merchandisingScore}%</p></div>
              <div><p className="text-xs text-muted-foreground">{copy.bookings}</p><p className="font-semibold">{item.bookings30d}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral"><MessageSquareText size={13} className="me-1 inline" />{copy.reviews}: {item.approvedReviewCount}</Badge>
                <Badge variant="neutral"><Star size={13} className="me-1 inline" />{copy.offers}: {item.activeOfferCount}</Badge>
                <LinkButton href={`/providers/${providerId}/services/${item.providerServiceId}/edit`} size="sm" variant="secondary">{copy.improve}</LinkButton>
                {item.activeOfferCount < 1 ? <LinkButton href={`/providers/${providerId}/offers`} size="sm" variant="ghost">{copy.manageOffers}</LinkButton> : null}
              </div>
            </div>
          ))}
          <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">{copy.notice}</div>
        </CardContent>
      </Card>
    </section>
  );
}
