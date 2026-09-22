"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import type { MergePreview } from "../../identity-types";
import { mergePatientsAction, previewMergeAction } from "../../server/identity-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

export function MergeDialog({
  survivingPatientId,
  mergedPatientId,
  mergedPatientLabel,
  open,
  onOpenChange,
}: {
  survivingPatientId: string;
  mergedPatientId: string;
  mergedPatientLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setReason("");
      return;
    }
    startTransition(async () => {
      const result = await previewMergeAction({ survivingPatientId, mergedPatientId });
      if (result.ok && result.data) setPreview(result.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const totalRecords =
    preview &&
    Object.values(preview.affectedRecordCounts).reduce((sum, count) => sum + count, 0);

  const confirm = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      const result = await mergePatientsAction({ survivingPatientId, mergedPatientId, reason: reason.trim() });
      if (result.ok) {
        toast.success(t("admin.identity.merged"));
        onOpenChange(false);
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("admin.identity.mergeWith", { name: mergedPatientLabel })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{t("admin.identity.mergeWarning")}</p>

          {preview ? (
            <div className="rounded-lg border p-3 text-sm">
              <p>
                {t("admin.identity.recordsToMove")}: <span className="font-medium">{totalRecords}</span>
              </p>
              {preview.identifierConflicts > 0 && (
                <p className="text-amber-700">
                  {t("admin.identity.identifierConflicts", { count: preview.identifierConflicts })}
                </p>
              )}
              {preview.activeAccountLinkConflicts > 0 && (
                <p className="text-amber-700">
                  {t("admin.identity.accountLinkConflicts", { count: preview.activeAccountLinkConflicts })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("admin.identity.loadingPreview")}</p>
          )}

          <div className="space-y-2">
            <Label>{t("admin.identity.mergeReason")}</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("admin.create.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={isPending || !preview || !reason.trim()}>
            {t("admin.identity.confirmMerge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
