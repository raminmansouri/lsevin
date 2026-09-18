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

import { joinGatheringCampaignAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourGatheringCampaign } from "../../types";

export function GatheringJoinDialog({
  campaign,
  onOpenChange,
}: {
  campaign: TourGatheringCampaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const router = useRouter();
  const [paymentReference, setPaymentReference] = useState("");
  const [isPending, startTransition] = useTransition();

  const open = Boolean(campaign);

  const handleOpenChange = (next: boolean) => {
    if (!next) setPaymentReference("");
    onOpenChange(next);
  };

  const submit = () => {
    if (!campaign) return;
    startTransition(async () => {
      try {
        const result = await joinGatheringCampaignAction({
          campaignId: campaign.id,
          paymentReference: paymentReference || undefined,
        });

        if (result.ok) {
          toast.success(result.data?.alreadyJoined ? t("customer.alreadyJoined") : t("customer.joined"));
          handleOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("customer.errors.generic"));
      } catch {
        toast.error(t("customer.errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("customer.joinTitle")}</DialogTitle>
        </DialogHeader>

        {campaign ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{campaign.serviceName}</span>
              <span className="text-muted-foreground">· {campaign.providerName}</span>
            </div>
            <p dir="ltr" className="text-lg font-semibold tabular-nums">
              {campaign.pricePerPerson.toLocaleString()} {campaign.currency}
            </p>
            <div className="space-y-2">
              <Label htmlFor="gathering-join-reference">{t("customer.paymentReference")}</Label>
              <Input
                id="gathering-join-reference"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t("customer.paymentReferenceHint")}</p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("customer.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? t("customer.joining") : t("customer.join")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
