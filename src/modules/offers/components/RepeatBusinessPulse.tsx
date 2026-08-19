import { BadgePercent, CalendarCheck2, MessageSquareText, Repeat2 } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { translatedPortalValue } from "@core/i18n/config";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { StatCard } from "@core/ui/StatCard";
import { repeatBusinessCopy } from "../marketCopy";
import { getProviderRepeatBusinessPulse } from "../repository";
import type { RepeatBusinessIssue } from "../marketTypes";

function issueLabel(issue: RepeatBusinessIssue, copy: ReturnType<typeof repeatBusinessCopy>) {
  if (issue === "repeat_demand_no_offer") return copy.noOffer;
  if (issue === "completed_demand_low_review_proof") return copy.lowReviews;
  return copy.noUse;
}

export async function RepeatBusinessPulse({ providerId }: { providerId: string }) {
  const locale = await getPortalLocale();
  const copy = repeatBusinessCopy(locale.locale);
  const pulse = await getProviderRepeatBusinessPulse(providerId);

  return (
    <section className="space-y-4" data-repeat-business-pulse>
      <div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck2} label={copy.completed} value={pulse.completedBookings90d} />
        <StatCard icon={Repeat2} label={copy.repeatCustomers} value={pulse.repeatCustomers90d} />
        <StatCard icon={BadgePercent} label={copy.offerCoverage} value={`${pulse.repeatOfferCoveragePercent}%`} />
        <StatCard icon={MessageSquareText} label={copy.offerUses} value={pulse.activeOfferUsesOnRepeatDemandServices} />
      </div>
      <Card>
        <CardHeader><CardTitle>{copy.queueTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{copy.queueDescription}</p></CardHeader>
        <CardContent className="space-y-3">
          {!pulse.queue.length ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : null}
          {pulse.queue.map((item) => (
            <div key={item.providerServiceId} className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,1.6fr)_auto_auto_auto] xl:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{translatedPortalValue(item.nameTranslations, locale.header, item.providerServiceId)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.issues.map((issue) => <Badge key={issue} variant="warning">{issueLabel(issue, copy)}</Badge>)}
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">{copy.completedShort}</p><p className="font-semibold">{item.completedBookings90d}</p></div>
              <div><p className="text-xs text-muted-foreground">{copy.repeatShort}</p><p className="font-semibold">{item.repeatCustomers90d}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{copy.offers}: {item.activeOfferCount}</Badge>
                <Badge variant="neutral">{copy.uses}: {item.activeOfferUses}</Badge>
                <Badge variant="neutral">{copy.reviews}: {item.approvedReviewCount}</Badge>
                {item.issues.includes("repeat_demand_no_offer") ? <LinkButton href={`/providers/${providerId}/offers#offer-create`} size="sm" variant="secondary">{copy.createOffer}</LinkButton> : null}
                {item.issues.includes("completed_demand_low_review_proof") ? <LinkButton href={`/providers/${providerId}/reviews`} size="sm" variant="ghost">{copy.reviewProof}</LinkButton> : null}
              </div>
            </div>
          ))}
          <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">{copy.notice}</div>
        </CardContent>
      </Card>
    </section>
  );
}
