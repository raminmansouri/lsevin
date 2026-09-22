"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";

import { MEDICAL_CASE_STATUSES, PACKAGE_SCOPES } from "../../cases-schemas";
import type {
  CaseReadiness,
  ClinicalEncounterRow,
  MedicalCaseFollowUpRow,
  MedicalCasePackageRow,
  MedicalCaseProviderSubmissionRow,
  MedicalCaseRequirementRow,
  MedicalCaseRow,
  MedicalCaseSecondOpinionRow,
  MedicalCaseStatus,
  MedicalCaseStatusHistoryRow,
  MedicalCaseTreatmentProposalRow,
} from "../../cases-types";
import { isValidCaseTransition } from "../../cases-transitions";
import {
  generateCasePackageAction,
  transitionCaseStatusAction,
  updateCaseRequirementStatusAction,
  updateSubmissionResponseAction,
} from "../../server/cases-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import type { PatientRow } from "../../types";
import {
  AddEncounterDialog,
  AddFollowUpDialog,
  AddProposalDialog,
  AddRequirementDialog,
  AddSecondOpinionDialog,
  AddSubmissionDialog,
} from "./case-dialogs";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CaseDashboard({
  patient,
  medicalCase,
  statusHistory,
  encounters,
  requirements,
  readiness,
  submissions,
  proposals,
  secondOpinions,
  followUps,
  packages,
}: {
  patient: PatientRow;
  medicalCase: MedicalCaseRow;
  statusHistory: MedicalCaseStatusHistoryRow[];
  encounters: ClinicalEncounterRow[];
  requirements: MedicalCaseRequirementRow[];
  readiness: CaseReadiness;
  submissions: MedicalCaseProviderSubmissionRow[];
  proposals: MedicalCaseTreatmentProposalRow[];
  secondOpinions: MedicalCaseSecondOpinionRow[];
  followUps: MedicalCaseFollowUpRow[];
  packages: MedicalCasePackageRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <h2 className="text-lg font-semibold">{medicalCase.title}</h2>
            <p className="text-muted-foreground text-sm">
              {patient.firstName} {patient.lastName} · <span dir="ltr">{medicalCase.caseNumber}</span>
            </p>
          </div>
          <Badge variant="outline">{t(`admin.cases.statuses.${medicalCase.caseStatus}`)}</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{t("admin.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="encounters">{t("admin.cases.tabs.encounters")}</TabsTrigger>
          <TabsTrigger value="providers">{t("admin.cases.tabs.providers")}</TabsTrigger>
          <TabsTrigger value="package">{t("admin.cases.tabs.package")}</TabsTrigger>
          <TabsTrigger value="followups">{t("admin.cases.tabs.followUps")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <OverviewTab medicalCase={medicalCase} statusHistory={statusHistory} requirements={requirements} readiness={readiness} />
        </TabsContent>

        <TabsContent value="encounters" className="pt-4">
          <EncountersTab patientId={patient.id} medicalCaseId={medicalCase.id} encounters={encounters} />
        </TabsContent>

        <TabsContent value="providers" className="space-y-4 pt-4">
          <ProvidersTab medicalCaseId={medicalCase.id} submissions={submissions} proposals={proposals} secondOpinions={secondOpinions} />
        </TabsContent>

        <TabsContent value="package" className="pt-4">
          <PackageTab patientId={patient.id} medicalCaseId={medicalCase.id} packages={packages} />
        </TabsContent>

        <TabsContent value="followups" className="pt-4">
          <FollowUpsTab medicalCaseId={medicalCase.id} followUps={followUps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  medicalCase,
  statusHistory,
  requirements,
  readiness,
}: {
  medicalCase: MedicalCaseRow;
  statusHistory: MedicalCaseStatusHistoryRow[];
  requirements: MedicalCaseRequirementRow[];
  readiness: CaseReadiness;
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addRequirementOpen, setAddRequirementOpen] = useState(false);

  const nextStatuses = MEDICAL_CASE_STATUSES.filter((status) => isValidCaseTransition(medicalCase.caseStatus, status));

  const transition = (toStatus: MedicalCaseStatus) => {
    startTransition(async () => {
      const result = await transitionCaseStatusAction({ medicalCaseId: medicalCase.id, toStatus });
      if (result.ok) {
        toast.success(t("admin.cases.statusChanged"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const updateRequirement = (id: string, requirementStatus: string) => {
    startTransition(async () => {
      const result = await updateCaseRequirementStatusAction({ id, requirementStatus: requirementStatus as never });
      if (result.ok) {
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.cases.status")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button key={status} type="button" size="sm" variant="outline" disabled={isPending} onClick={() => transition(status)}>
                  {t(`admin.cases.statuses.${status}`)}
                </Button>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            {statusHistory.map((entry) => (
              <div key={entry.id} className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{t(`admin.cases.statuses.${entry.toStatus}`)}</span>
                <span dir="ltr">{formatDateTime(entry.occurredAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            {t("admin.cases.requirements")} ({readiness.satisfied}/{readiness.total} — {readiness.percent}%)
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddRequirementOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {requirements.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {requirements.map((requirement) => (
            <div key={requirement.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{requirement.title}</p>
                <p className="text-muted-foreground text-xs">{t(`admin.cases.requirementTypes.${requirement.requirementType}`)}</p>
              </div>
              <Select value={requirement.requirementStatus} onValueChange={(value) => updateRequirement(requirement.id, value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["missing", "requested", "received", "expired", "rejected", "accepted"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`admin.cases.requirementStatuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddRequirementDialog medicalCaseId={medicalCase.id} open={addRequirementOpen} onOpenChange={setAddRequirementOpen} />
    </div>
  );
}

function EncountersTab({
  patientId,
  medicalCaseId,
  encounters,
}: {
  patientId: string;
  medicalCaseId: string;
  encounters: ClinicalEncounterRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.cases.tabs.encounters")}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t("admin.overview.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {encounters.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
        {encounters.map((encounter) => (
          <div key={encounter.id} className="border-b pb-2 last:border-0 last:pb-0">
            <p className="text-sm font-medium">{t(`admin.cases.encounterTypes.${encounter.encounterType}`)}</p>
            <p dir="ltr" className="text-muted-foreground text-xs">
              {formatDate(encounter.startedAt)}
            </p>
            {encounter.reason && <p className="text-muted-foreground text-xs">{encounter.reason}</p>}
          </div>
        ))}
      </CardContent>
      <AddEncounterDialog patientId={patientId} medicalCaseId={medicalCaseId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function ProvidersTab({
  medicalCaseId,
  submissions,
  proposals,
  secondOpinions,
}: {
  medicalCaseId: string;
  submissions: MedicalCaseProviderSubmissionRow[];
  proposals: MedicalCaseTreatmentProposalRow[];
  secondOpinions: MedicalCaseSecondOpinionRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addSubmissionOpen, setAddSubmissionOpen] = useState(false);
  const [addProposalOpen, setAddProposalOpen] = useState(false);
  const [addOpinionOpen, setAddOpinionOpen] = useState(false);

  const respond = (id: string, responseStatus: string) => {
    startTransition(async () => {
      const result = await updateSubmissionResponseAction({ id, responseStatus: responseStatus as never });
      if (result.ok) {
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
          <CardTitle className="text-base">{t("admin.cases.submissions")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddSubmissionOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissions.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {submissions.map((submission) => (
            <div key={submission.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <p dir="ltr" className="text-muted-foreground text-sm">
                {submission.providerId}
              </p>
              <Select value={submission.responseStatus} onValueChange={(value) => respond(submission.id, value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["pending", "accepted", "declined", "needs_more_info"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`admin.cases.submissionStatuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.cases.proposals")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddProposalOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {proposals.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {proposals.map((proposal) => (
            <div key={proposal.id} className="border-b pb-2 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{proposal.diagnosis ?? proposal.treatmentPlan ?? "-"}</p>
              <Badge variant="outline">{t(`admin.cases.proposalStatuses.${proposal.proposalStatus}`)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.cases.secondOpinions")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddOpinionOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {secondOpinions.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {secondOpinions.map((opinion) => (
            <div key={opinion.id} className="border-b pb-2 last:border-0 last:pb-0">
              <p className="text-sm">{opinion.conclusion}</p>
              <p dir="ltr" className="text-muted-foreground text-xs">
                {formatDate(opinion.opinionDate)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddSubmissionDialog medicalCaseId={medicalCaseId} open={addSubmissionOpen} onOpenChange={setAddSubmissionOpen} />
      <AddProposalDialog medicalCaseId={medicalCaseId} open={addProposalOpen} onOpenChange={setAddProposalOpen} />
      <AddSecondOpinionDialog medicalCaseId={medicalCaseId} open={addOpinionOpen} onOpenChange={setAddOpinionOpen} />
    </div>
  );
}

function PackageTab({
  patientId,
  medicalCaseId,
  packages,
}: {
  patientId: string;
  medicalCaseId: string;
  packages: MedicalCasePackageRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scopes, setScopes] = useState<string[]>([...PACKAGE_SCOPES]);

  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  const generate = () => {
    if (scopes.length === 0) return;
    startTransition(async () => {
      const result = await generateCasePackageAction({ medicalCaseId, patientId, includedScopes: scopes as never });
      if (result.ok) {
        toast.success(t("admin.cases.packageGenerated"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.cases.tabs.package")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PACKAGE_SCOPES.map((scope) => (
            <label key={scope} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
              {t(`admin.cases.packageScopes.${scope}`)}
            </label>
          ))}
        </div>
        <Button type="button" size="sm" disabled={isPending || scopes.length === 0} onClick={generate}>
          {t("admin.cases.generatePackage")}
        </Button>

        <div className="space-y-2 pt-2">
          {packages.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {packages.map((pkg) => (
            <div key={pkg.id} className="border-b pb-2 text-sm last:border-0 last:pb-0">
              <p dir="ltr" className="text-muted-foreground text-xs">
                {formatDateTime(pkg.createdAt)}
              </p>
              <p className="text-muted-foreground text-xs">{pkg.includedScopes.map((s) => t(`admin.cases.packageScopes.${s}`)).join("، ")}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowUpsTab({ medicalCaseId, followUps }: { medicalCaseId: string; followUps: MedicalCaseFollowUpRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("admin.cases.tabs.followUps")}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t("admin.overview.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {followUps.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
        {followUps.map((followUp) => (
          <div key={followUp.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
            <div>
              <p dir="ltr" className="text-sm font-medium">
                {formatDate(followUp.scheduledDate)}
              </p>
              {followUp.requiredItems && <p className="text-muted-foreground text-xs">{followUp.requiredItems}</p>}
            </div>
            <Badge variant="outline">{t(`admin.cases.followupStatuses.${followUp.followupStatus}`)}</Badge>
          </div>
        ))}
      </CardContent>
      <AddFollowUpDialog medicalCaseId={medicalCaseId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
