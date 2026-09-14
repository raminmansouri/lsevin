"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { confirmGatheringCampaignAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourGatheringCampaign } from "../../types";

export function ConfirmGatheringDialog({
  campaign,
  onOpenChange,
}: {
  campaign: TourGatheringCampaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const router = useRouter();
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [isPending, startTransition] = useTransition();

  const open = Boolean(campaign);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStartsOn("");
      setEndsOn("");
    }
    onOpenChange(next);
  };

  const submit = () => {
    if (!campaign) return;
    startTransition(async () => {
      try {
        const result = await confirmGatheringCampaignAction({
          id: campaign.id,
          confirmedStartsOn: startsOn,
          confirmedEndsOn: endsOn,
        });

        if (result.ok) {
          toast.success(t("admin.gathering.confirmed"));
          handleOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("admin.errors.generic"));
      } catch {
        toast.error(t("admin.errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.gathering.confirmTitle")}</DialogTitle>
        </DialogHeader>

        {campaign ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t("admin.gathering.confirmHint", { count: campaign.approvedCount, target: campaign.targetHeadcount })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="gathering-confirm-starts">{t("admin.departures.startsOn")}</Label>
                <Input
                  id="gathering-confirm-starts"
                  type="date"
                  dir="ltr"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gathering-confirm-ends">{t("admin.departures.endsOn")}</Label>
                <Input
                  id="gathering-confirm-ends"
                  type="date"
                  dir="ltr"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("admin.departures.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || !startsOn || !endsOn}>
            {isPending ? t("admin.departures.saving") : t("admin.gathering.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
