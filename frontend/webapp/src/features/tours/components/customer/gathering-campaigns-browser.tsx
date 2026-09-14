"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { listOpenGatheringCampaignsAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourGatheringCampaign } from "../../types";
import { GatheringJoinDialog } from "./gathering-join-dialog";

/** The customer-facing browse-and-join grid, fetched client-side so it can stay
 * independent of the signed-in "my participations" read alongside it -- a
 * signed-out visitor can still browse open campaigns. */
export function GatheringCampaignsBrowser() {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const [campaigns, setCampaigns] = useState<TourGatheringCampaign[] | null>(null);
  const [selected, setSelected] = useState<TourGatheringCampaign | null>(null);

  useEffect(() => {
    listOpenGatheringCampaignsAction()
      .then((result) => setCampaigns(result.ok ? result.data || [] : []))
      .catch(() => setCampaigns([]));
  }, []);

  if (campaigns === null) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return <p className="text-muted-foreground py-8 text-sm">{t("customer.empty")}</p>;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="space-y-1">
              <div className="text-muted-foreground text-xs">{campaign.providerName}</div>
              <CardTitle className="text-base">{campaign.serviceName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p dir="ltr" className="text-lg font-semibold tabular-nums">
                {campaign.pricePerPerson.toLocaleString()} {campaign.currency}
              </p>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Users className="size-3.5" />
                {t("customer.progress", { count: campaign.approvedCount, target: campaign.targetHeadcount })}
              </div>
              {campaign.joinDeadline ? (
                <p className="text-muted-foreground text-xs">{t("customer.joinBy", { date: campaign.joinDeadline })}</p>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button type="button" className="w-full" onClick={() => setSelected(campaign)}>
                {t("customer.join")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <GatheringJoinDialog campaign={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
