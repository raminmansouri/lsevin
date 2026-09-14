"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { StaffLazySearchableSelect } from "@/features/staff/components/staff-lazy-select";

import { createGatheringCampaignAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY } from "../../types";

export function GatheringCampaignFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [providerServiceId, setProviderServiceId] = useState("");
  const [targetHeadcount, setTargetHeadcount] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [currency, setCurrency] = useState("IRR");
  const [joinDeadline, setJoinDeadline] = useState("");

  const reset = () => {
    setProviderServiceId("");
    setTargetHeadcount("");
    setPricePerPerson("");
    setCurrency("IRR");
    setJoinDeadline("");
  };

  const save = () => {
    startTransition(async () => {
      try {
        const result = await createGatheringCampaignAction({
          providerServiceId,
          targetHeadcount: Number(targetHeadcount),
          pricePerPerson: Number(pricePerPerson),
          currency,
          joinDeadline: joinDeadline || undefined,
        });

        if (result.ok) {
          toast.success(t("admin.gathering.saved"));
          reset();
          onOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("admin.errors.generic"));
      } catch {
        toast.error(t("admin.errors.generic"));
      }
    });
  };

  const canSave = Boolean(providerServiceId) && Number(targetHeadcount) >= 2 && Boolean(pricePerPerson);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.gathering.create")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.departures.tour")}</Label>
            <StaffLazySearchableSelect
              resource="providerServices"
              locale={locale}
              value={providerServiceId}
              onValueChange={setProviderServiceId}
              placeholder={t("admin.departures.tourPlaceholder")}
            />
            <p className="text-muted-foreground text-xs">{t("admin.departures.tourHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gathering-target">{t("admin.gathering.targetHeadcount")}</Label>
            <Input
              id="gathering-target"
              type="number"
              min={2}
              dir="ltr"
              value={targetHeadcount}
              onChange={(event) => setTargetHeadcount(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gathering-price">{t("admin.gathering.pricePerPerson")}</Label>
              <Input
                id="gathering-price"
                dir="ltr"
                inputMode="numeric"
                value={pricePerPerson}
                onChange={(event) => setPricePerPerson(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gathering-currency">{t("admin.gathering.currency")}</Label>
              <Input
                id="gathering-currency"
                dir="ltr"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gathering-deadline">{t("admin.gathering.joinDeadline")}</Label>
            <Input
              id="gathering-deadline"
              type="date"
              dir="ltr"
              value={joinDeadline}
              onChange={(event) => setJoinDeadline(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.departures.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !canSave}>
            {isPending ? t("admin.departures.saving") : t("admin.departures.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
