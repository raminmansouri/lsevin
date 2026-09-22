"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import type { PatientMatchCandidateRow, PatientMergeRow, ReconciliationConflict } from "../../identity-types";
import {
  reviewMatchCandidateAction,
  scanForDuplicatesAction,
  unmergePatientsAction,
} from "../../server/identity-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import type { PatientRow } from "../../types";
import { MergeDialog } from "./identity-merge-dialog";
import { ReconciliationCard } from "./identity-reconciliation-card";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function IdentityTab({
  patientId,
  candidates,
  merges,
  conflicts,
}: {
  patientId: string;
  candidates: { candidate: PatientMatchCandidateRow; otherPatient: PatientRow | null }[];
  merges: { merge: PatientMergeRow; otherPatient: PatientRow | null; isSurvivor: boolean }[];
  conflicts: ReconciliationConflict[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mergeTarget, setMergeTarget] = useState<{ id: string; label: string } | null>(null);

  const scan = () => {
    startTransition(async () => {
      const result = await scanForDuplicatesAction({ patientId });
      if (result.ok) {
        toast.success(t("admin.identity.scanComplete", { count: result.data?.length ?? 0 }));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const review = (id: string, decision: "confirmed_same_person" | "confirmed_different" | "ignored") => {
    startTransition(async () => {
      const result = await reviewMatchCandidateAction({ id, decision });
      if (result.ok) {
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const unmerge = (mergeId: string) => {
    startTransition(async () => {
      const result = await unmergePatientsAction({ mergeId });
      if (result.ok) {
        toast.success(t("admin.identity.unmerged"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.identity.candidates")}</CardTitle>
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={scan}>
            {t("admin.identity.scan")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidates.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {candidates.map(({ candidate, otherPatient }) => (
            <div key={candidate.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {otherPatient ? `${otherPatient.firstName} ${otherPatient.lastName}` : t("admin.identity.unknownPatient")}
                </p>
                <Badge variant="outline">{candidate.matchScore}%</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {candidate.matchReasons.map((r) => t(`admin.identity.matchReasons.${r}`)).join("، ")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => review(candidate.id, "confirmed_different")}>
                  {t("admin.identity.notSamePerson")}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => review(candidate.id, "ignored")}>
                  {t("admin.identity.ignore")}
                </Button>
                {otherPatient && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      review(candidate.id, "confirmed_same_person");
                      setMergeTarget({ id: otherPatient.id, label: `${otherPatient.firstName} ${otherPatient.lastName}` });
                    }}
                  >
                    {t("admin.identity.samePersonMerge")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.identity.mergeHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {merges.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {merges.map(({ merge, otherPatient, isSurvivor }) => (
            <div key={merge.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm">
                  {isSurvivor ? t("admin.identity.absorbedLabel") : t("admin.identity.mergedIntoLabel")}{" "}
                  {otherPatient ? `${otherPatient.firstName} ${otherPatient.lastName}` : t("admin.identity.unknownPatient")}
                </p>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  {formatDate(merge.mergedAt)}
                </p>
              </div>
              {!merge.reversedAt ? (
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => unmerge(merge.id)}>
                  {t("admin.identity.unmerge")}
                </Button>
              ) : (
                <Badge variant="secondary">{t("admin.identity.reversed")}</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <ReconciliationCard patientId={patientId} conflicts={conflicts} />
      </div>

      {mergeTarget && (
        <MergeDialog
          survivingPatientId={patientId}
          mergedPatientId={mergeTarget.id}
          mergedPatientLabel={mergeTarget.label}
          open={Boolean(mergeTarget)}
          onOpenChange={(open) => !open && setMergeTarget(null)}
        />
      )}
    </div>
  );
}
