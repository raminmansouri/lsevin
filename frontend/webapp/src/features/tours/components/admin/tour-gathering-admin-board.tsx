"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  TOURS_TRANSLATION_KEY,
  type TourGatheringCampaign,
  type TourGatheringCampaignsAdminPageData,
  type TourGatheringParticipantAdminRow,
} from "../../types";
import { ConfirmGatheringDialog } from "./confirm-gathering-dialog";
import { GatheringCampaignFormDialog } from "./gathering-campaign-form-dialog";
import { GatheringCampaignsTable } from "./gathering-campaigns-table";
import { GatheringParticipantReviewDialog } from "./gathering-participant-review-dialog";
import { GatheringParticipantsTable } from "./gathering-participants-table";

/** Everything on the page is driven from one server read -- mirrors every other
 * admin board this session. Local state is only which dialog is open. */
export function TourGatheringAdminBoard({ data }: { data: TourGatheringCampaignsAdminPageData }) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirming, setConfirming] = useState<TourGatheringCampaign | null>(null);
  const [reviewing, setReviewing] = useState<TourGatheringParticipantAdminRow | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t("admin.gathering.campaignsTitle")}</CardTitle>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("admin.gathering.create")}
          </Button>
        </CardHeader>
        <CardContent>
          <GatheringCampaignsTable campaigns={data.campaigns} onConfirm={setConfirming} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("admin.gathering.participantsTitle")}</h2>
        <GatheringParticipantsTable participants={data.participants} onReview={setReviewing} />
      </div>

      <GatheringCampaignFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmGatheringDialog campaign={confirming} onOpenChange={(open) => !open && setConfirming(null)} />
      <GatheringParticipantReviewDialog row={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />
    </div>
  );
}
