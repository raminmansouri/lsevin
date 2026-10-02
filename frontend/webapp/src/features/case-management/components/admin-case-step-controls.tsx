"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

import {
  CASE_STEP_TRANSITIONS,
  type CaseStepStatus,
} from "../lib/case-step-transitions";
import { updateAdminCaseStepAction } from "../server/admin-actions";

export function AdminCaseStepControls({
  caseId,
  stepId,
  status,
  lockVersion,
}: {
  caseId: string;
  stepId: string;
  status: CaseStepStatus;
  lockVersion: number;
}) {
  const t = useTranslations("CaseManagement");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const transitions = CASE_STEP_TRANSITIONS[status] ?? [];

  const update = (nextStatus: CaseStepStatus) => {
    startTransition(async () => {
      const result = await updateAdminCaseStepAction({
        caseId,
        caseStepId: stepId,
        lockVersion,
        status: nextStatus,
        note,
      });
      if ("error" in result) {
        toast.error(t(`errors.${result.error}`));
        if (result.error === "stale") router.refresh();
        return;
      }
      toast.success(t("stepUpdated"));
      setNote("");
      router.refresh();
    });
  };

  if (transitions.length === 0) return null;
  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        rows={2}
        disabled={isPending}
        placeholder={t("completionNotePlaceholder")}
        aria-label={t("completionNote")}
      />
      <div className="flex flex-wrap gap-2">
        {transitions.map((nextStatus) => (
          <Button
            key={nextStatus}
            type="button"
            size="sm"
            variant={nextStatus === "completed" ? "default" : "outline"}
            disabled={isPending}
            onClick={() => update(nextStatus)}
          >
            {t(`stepStatuses.${nextStatus}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
