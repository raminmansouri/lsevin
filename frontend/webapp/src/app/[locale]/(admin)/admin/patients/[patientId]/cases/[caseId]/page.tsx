import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { CaseDashboard } from "@/features/patients/components/admin/case-dashboard";
import {
  computeCaseReadiness,
  getMedicalCase,
  listCaseStatusHistory,
  listEncountersForCase,
  listFollowUpsForCase,
  listPackagesForCase,
  listProposalsForCase,
  listRequirementsForCase,
  listSecondOpinionsForCase,
  listSubmissionsForCase,
} from "@/features/patients/server/cases-repository";
import { getPatientById } from "@/features/patients/server/repository";
import { getCaseReadinessAlerts, suggestRelevantRecordsForCase } from "@/features/patients/server/readiness-repository";
import { PATIENTS_TRANSLATION_KEY } from "@/features/patients/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams & { patientId: string; caseId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { caseId } = await params;
  const medicalCase = await getMedicalCase(caseId);
  return { title: medicalCase?.title ?? "" };
}

export default function AdminMedicalCaseDetailPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={PATIENTS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <PageHeader title={t("admin.cases.detailTitle")} />
            <Suspense fallback={null}>
              <SuspenseBoundary params={params} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({ params }: { params: Props["params"] }) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  await assertAdmin();
  const { patientId, caseId } = await params;

  const medicalCase = await getMedicalCase(caseId);
  if (!medicalCase || medicalCase.patientId !== patientId) notFound();

  const patient = await getPatientById(patientId);
  if (!patient) notFound();

  const [statusHistory, encounters, requirements, submissions, proposals, secondOpinions, followUps, packages, readinessAlerts, suggestedRecords] =
    await Promise.all([
      listCaseStatusHistory(caseId),
      listEncountersForCase(caseId),
      listRequirementsForCase(caseId),
      listSubmissionsForCase(caseId),
      listProposalsForCase(caseId),
      listSecondOpinionsForCase(caseId),
      listFollowUpsForCase(caseId),
      listPackagesForCase(caseId),
      getCaseReadinessAlerts(caseId, patientId),
      suggestRelevantRecordsForCase(patientId),
    ]);

  return (
    <CaseDashboard
      patient={patient}
      medicalCase={medicalCase}
      statusHistory={statusHistory}
      encounters={encounters}
      requirements={requirements}
      readiness={computeCaseReadiness(requirements)}
      submissions={submissions}
      proposals={proposals}
      secondOpinions={secondOpinions}
      followUps={followUps}
      packages={packages}
      readinessAlerts={readinessAlerts}
      suggestedRecords={suggestedRecords}
    />
  );
}
