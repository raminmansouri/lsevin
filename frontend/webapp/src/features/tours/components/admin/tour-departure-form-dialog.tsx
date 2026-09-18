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
import { Switch } from "@/components/ui/switch";
import { StaffLazySearchableSelect } from "@/features/staff/components/staff-lazy-select";

import { upsertTourDepartureAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourDepartureAdminRow } from "../../types";

export type TourDepartureFormState = {
  id?: string;
  providerServiceId: string;
  serviceLabel: string;
  startsOn: string;
  endsOn: string;
  capacity: string;
  isActive: boolean;
};

export const EMPTY_TOUR_DEPARTURE_FORM: TourDepartureFormState = {
  providerServiceId: "",
  serviceLabel: "",
  startsOn: "",
  endsOn: "",
  capacity: "",
  isActive: true,
};

export function tourDepartureToFormState(row: TourDepartureAdminRow): TourDepartureFormState {
  return {
    id: row.id,
    providerServiceId: row.providerServiceId,
    serviceLabel: `${row.serviceName} (${row.providerName})`,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    capacity: String(row.capacity),
    isActive: row.isActive,
  };
}

export function TourDepartureFormDialog({
  form,
  setForm,
  open,
  onOpenChange,
}: {
  form: TourDepartureFormState;
  setForm: (updater: (prev: TourDepartureFormState) => TourDepartureFormState) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      try {
        const result = await upsertTourDepartureAction({
          id: form.id,
          providerServiceId: form.providerServiceId,
          startsOn: form.startsOn,
          endsOn: form.endsOn,
          capacity: Number(form.capacity),
          isActive: form.isActive,
        });

        if (result.ok) {
          toast.success(t("admin.departures.saved"));
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

  const canSave =
    Boolean(form.providerServiceId) && Boolean(form.startsOn) && Boolean(form.endsOn) && Boolean(form.capacity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? t("admin.departures.edit") : t("admin.departures.create")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.departures.tour")}</Label>
            <StaffLazySearchableSelect
              resource="providerServices"
              locale={locale}
              value={form.providerServiceId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, providerServiceId: value }))}
              initialOptions={form.serviceLabel ? [{ id: form.providerServiceId, label: form.serviceLabel }] : []}
              disabled={Boolean(form.id)}
              placeholder={t("admin.departures.tourPlaceholder")}
            />
            <p className="text-muted-foreground text-xs">{t("admin.departures.tourHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tour-departure-starts">{t("admin.departures.startsOn")}</Label>
              <Input
                id="tour-departure-starts"
                type="date"
                dir="ltr"
                value={form.startsOn}
                onChange={(event) => setForm((prev) => ({ ...prev, startsOn: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-departure-ends">{t("admin.departures.endsOn")}</Label>
              <Input
                id="tour-departure-ends"
                type="date"
                dir="ltr"
                value={form.endsOn}
                onChange={(event) => setForm((prev) => ({ ...prev, endsOn: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tour-departure-capacity">{t("admin.departures.capacity")}</Label>
            <Input
              id="tour-departure-capacity"
              type="number"
              min={1}
              dir="ltr"
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="tour-departure-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="tour-departure-active" className="font-normal">
              {t("admin.departures.isActive")}
            </Label>
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
