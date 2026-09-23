import { CalendarClock, ClipboardCheck, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  computeCaseReadiness,
  listCasesForPatient,
  listFollowUpsForCase,
  listProposalsForCase,
  listRequirementsForCase,
  listSecondOpinionsForCase,
} from "@/features/patients/server/cases-repository";
import type {
  MedicalCaseFollowUpRow,
  MedicalCaseRequirementRow,
  MedicalCaseRow,
  MedicalCaseSecondOpinionRow,
  MedicalCaseTreatmentProposalRow,
} from "@/features/patients/cases-types";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import type { TranslationType } from "@/types/next";

import { requireAuthenticatedUserId } from "./auth";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Same object-level rule as my-health-record: never accepts a patientId or
 * caseId from the caller, only ever shows cases belonging to a patient the
 * signed-in account holds an active account_patient_links row for. A
 * "limited" access_role hides case detail entirely, same as it hides
 * clinical detail on my-health-record.
 *
 * Provider submissions (V4.6 -- which providers were approached and their
 * internal notes) are deliberately left out: that's coordinator/operational
 * detail, not something the patient decides on. Requirements, treatment
 * proposals, second opinions and follow-ups ARE shown because the patient
 * is the one who has to act on or decide about each of them. Read-only for
 * now -- there's no "accept this proposal" or "log my follow-up outcome"
 * action anywhere in the app yet, admin or customer side.
 */
export default async function MyCasesPage() {
  const t = await getTranslations("MobileProfile.myCases");
  const tCases = await getTranslations("Patients.admin.cases");
  const accountId = await requireAuthenticatedUserId();
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];

  const patientsWithCases = await Promise.all(
    links
      .filter((link) => link.accessRole !== "limited")
      .map(async (link) => ({
        patient: link.patient,
        relationshipType: link.relationshipType,
        cases: await listCasesForPatient(link.patient.id),
      }))
  );

  const hasAnyCase = patientsWithCases.some((entry) => entry.cases.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 p-6">
        {!hasAnyCase && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">{t("empty")}</div>
        )}

        {patientsWithCases.map(({ patient, relationshipType, cases }) =>
          cases.length === 0 ? null : (
            <div key={patient.id} className="space-y-3">
              {relationshipType !== "self" && (
                <p className="text-xs font-medium text-gray-500">
                  {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}`)}
                </p>
              )}
              {cases.map((medicalCase) => (
                <CaseCard key={medicalCase.id} medicalCase={medicalCase} t={t} tCases={tCases} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

async function CaseCard({
  medicalCase,
  t,
  tCases,
}: {
  medicalCase: MedicalCaseRow;
  t: TranslationType;
  tCases: TranslationType;
}) {
  const [requirements, proposals, secondOpinions, followUps] = await Promise.all([
    listRequirementsForCase(medicalCase.id),
    listProposalsForCase(medicalCase.id),
    listSecondOpinionsForCase(medicalCase.id),
    listFollowUpsForCase(medicalCase.id),
  ]);
  const readiness = computeCaseReadiness(requirements);

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900">{medicalCase.title}</p>
          <p dir="ltr" className="text-xs text-gray-500">
            {medicalCase.caseNumber}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {tCases(`statuses.${medicalCase.caseStatus}`)}
        </span>
      </div>

      {requirements.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <ClipboardCheck size={14} />
              {t("requirements")}
            </p>
            <span className="text-xs text-gray-400" dir="ltr">
              {readiness.satisfied}/{readiness.total} — {readiness.percent}%
            </span>
          </div>
          <RequirementsList requirements={requirements} tCases={tCases} />
        </div>
      )}

      {proposals.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Stethoscope size={14} />
            {t("treatmentProposals")}
          </p>
          {proposals.map((proposal) => (
            <ProposalRow key={proposal.id} proposal={proposal} t={t} tCases={tCases} />
          ))}
        </div>
      )}

      {secondOpinions.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500">{t("secondOpinions")}</p>
          {secondOpinions.map((opinion) => (
            <div key={opinion.id} className="mt-1.5">
              <p dir="ltr" className="text-xs text-gray-400">
                {formatDate(opinion.opinionDate)}
              </p>
              <p className="text-sm text-gray-800">{opinion.conclusion}</p>
            </div>
          ))}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <CalendarClock size={14} />
            {t("followUps")}
          </p>
          {followUps.map((followUp) => (
            <FollowUpRow key={followUp.id} followUp={followUp} tCases={tCases} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementsList({
  requirements,
  tCases,
}: {
  requirements: MedicalCaseRequirementRow[];
  tCases: TranslationType;
}) {
  return (
    <div className="mt-1.5 space-y-1.5">
      {requirements.map((requirement) => (
        <div key={requirement.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="text-gray-800">{requirement.title}</span>
          <span className="shrink-0 text-xs text-gray-400">{tCases(`requirementStatuses.${requirement.requirementStatus}`)}</span>
        </div>
      ))}
    </div>
  );
}

function ProposalRow({
  proposal,
  t,
  tCases,
}: {
  proposal: MedicalCaseTreatmentProposalRow;
  t: TranslationType;
  tCases: TranslationType;
}) {
  return (
    <div className="mt-2 rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        {proposal.suggestedProcedure && <p className="text-sm font-medium text-gray-900">{proposal.suggestedProcedure}</p>}
        <span className="text-xs text-gray-500">{tCases(`proposalStatuses.${proposal.proposalStatus}`)}</span>
      </div>
      {proposal.treatmentPlan && <p className="mt-1 text-xs text-gray-600">{proposal.treatmentPlan}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        {proposal.estimatedStayDays !== null && (
          <span>
            {t("estimatedStay")}: {proposal.estimatedStayDays} {t("days")}
          </span>
        )}
        {proposal.validUntil && (
          <span dir="ltr">
            {t("validUntil")}: {formatDate(proposal.validUntil)}
          </span>
        )}
      </div>
    </div>
  );
}

function FollowUpRow({ followUp, tCases }: { followUp: MedicalCaseFollowUpRow; tCases: TranslationType }) {
  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
      <span dir="ltr" className="text-gray-800">
        {formatDate(followUp.scheduledDate)}
      </span>
      <span className="text-xs text-gray-400">{tCases(`followupStatuses.${followUp.followupStatus}`)}</span>
    </div>
  );
}
