"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import type { ReconciliationConflict } from "../../identity-types";
import { resolveReconciliationConflictAction } from "../../server/identity-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

export function ReconciliationCard({ patientId, conflicts }: { patientId: string; conflicts: ReconciliationConflict[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const resolve = (conflict: ReconciliationConflict, discardId: string, action: "keep_both" | "mark_outdated" | "entered_in_error") => {
    startTransition(async () => {
      const result = await resolveReconciliationConflictAction({
        patientId,
        recordType: conflict.recordType,
        discardId,
        action,
      });
      if (result.ok) {
        toast.success(t("admin.identity.reconciled"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.identity.reconciliation")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conflicts.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.identity.noConflicts")}</p>}
        {conflicts.map((conflict) => (
          <div key={`${conflict.recordAId}-${conflict.recordBId}`} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-medium">
              {t(`admin.identity.recordTypes.${conflict.recordType}`)}: {conflict.label}
            </p>
            <p className="text-muted-foreground text-xs">{t("admin.identity.duplicateActiveEntries")}</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => resolve(conflict, conflict.recordBId, "keep_both")}
              >
                {t("admin.identity.keepBoth")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => resolve(conflict, conflict.recordBId, "mark_outdated")}
              >
                {t("admin.identity.markOutdated")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => resolve(conflict, conflict.recordBId, "entered_in_error")}
              >
                {t("admin.identity.markEnteredInError")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
