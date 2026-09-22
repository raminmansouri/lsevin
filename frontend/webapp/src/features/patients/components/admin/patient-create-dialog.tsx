"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersianDateTimePicker } from "@/components/date-time/PersianDateTimePicker";
import { useRouter } from "@/i18n/navigation";

import { createPatientAction } from "../../server/actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

const EMPTY_FORM = { firstName: "", lastName: "", preferredName: "", birthDate: "" };

export function PatientCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY_FORM);

  const canSave = form.firstName.trim().length > 0 && form.lastName.trim().length > 0;

  const save = () => {
    startTransition(async () => {
      const result = await createPatientAction({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        preferredName: form.preferredName.trim() || undefined,
        birthDate: form.birthDate || undefined,
        createdBySource: "admin",
      });

      if (result.ok && result.data) {
        toast.success(t("admin.create.saved"));
        onOpenChange(false);
        setForm(EMPTY_FORM);
        router.push(`/admin/patients/${result.data.id}`);
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.create.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patient-first-name">{t("admin.fields.firstName")}</Label>
              <Input
                id="patient-first-name"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-last-name">{t("admin.fields.lastName")}</Label>
              <Input
                id="patient-last-name"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-preferred-name">{t("admin.fields.preferredName")}</Label>
            <Input
              id="patient-preferred-name"
              value={form.preferredName}
              onChange={(event) => setForm((prev) => ({ ...prev, preferredName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-birth-date">{t("admin.fields.birthDate")}</Label>
            <PersianDateTimePicker
              id="patient-birth-date"
              mode="date"
              value={form.birthDate || null}
              onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={isPending || !canSave}>
            {isPending ? t("admin.create.saving") : t("admin.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
