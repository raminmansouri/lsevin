import { notFound } from "next/navigation";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

import { listDocumentsForPatient } from "@/features/patients/server/documents-repository";
import { getHealthIntake, listSelfEditableRecords } from "@/features/patients/server/intake-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import { INTAKE_STEPS, type IntakeStep } from "@/features/patients/intake-schemas";

import { requireAuthenticatedUserId } from "../auth";
import { HealthQuestionnaire } from "./health-questionnaire";

export const dynamic = "force-dynamic";

/**
 * The step-by-step health questionnaire. Same object-level rule as the rest
 * of my-health-record: the patient comes from the signed-in account's own
 * active links, never from the caller alone -- `?patient=` only chooses
 * between records this account already holds a non-"limited" link to.
 */
export default async function HealthQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; step?: string }>;
}) {
  const { patient: requestedPatientId, step: requestedStep } = await searchParams;
  const locale = await getLocale();
  const accountId = await requireAuthenticatedUserId();
  if (!accountId) redirect({ href: "/n/app/mobile/profile/my-health-record", locale });

  const links = (await listPatientAccessForAccount(accountId)).filter((link) => link.accessRole !== "limited");
  const link = requestedPatientId
    ? links.find((entry) => entry.patient.id === requestedPatientId)
    : (links.find((entry) => entry.relationshipType === "self") ?? links[0]);
  if (!link) {
    if (requestedPatientId) notFound();
    redirect({ href: "/n/app/mobile/profile/my-health-record", locale });
    return null;
  }

  const [intake, records, documents] = await Promise.all([
    getHealthIntake(link.patient.id),
    listSelfEditableRecords(link.patient.id),
    listDocumentsForPatient(link.patient.id),
  ]);

  const firstOpenStep = INTAKE_STEPS.find((step) => !intake?.completedSteps.includes(step)) ?? "review";
  const initialStep: IntakeStep = INTAKE_STEPS.includes(requestedStep as IntakeStep)
    ? (requestedStep as IntakeStep)
    : firstOpenStep;

  return (
    <HealthQuestionnaire
      initialStep={initialStep}
      patient={{
        id: link.patient.id,
        firstName: link.patient.firstName,
        lastName: link.patient.lastName,
        birthDate: link.patient.birthDate,
        sexAtBirth: link.patient.sexAtBirth,
        relationshipType: link.relationshipType,
      }}
      intake={intake}
      records={records}
      documents={documents.map((document) => ({
        id: document.id,
        title: document.title,
        documentType: document.documentType,
      }))}
    />
  );
}
