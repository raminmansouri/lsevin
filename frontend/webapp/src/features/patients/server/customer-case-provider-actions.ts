"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import { CreateCaseProviderGrantSchema, RevokeCaseProviderGrantSchema, type CreateCaseProviderGrantInput, type RevokeCaseProviderGrantInput } from "../case-provider-schemas";
import type { CaseProviderGrantRow } from "../case-provider-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { findActiveAccountPatientLink, listPatientAccessForAccount } from "./repository";
import { listCasesForPatient } from "./cases-repository";
import { createCaseProviderGrant, revokeCaseProviderGrant } from "./case-provider-repository";

const MY_CASES_PATH = "/n/app/mobile/profile/my-cases";

export type ShareableCaseGroup = {
  patientId: string;
  patientName: string;
  cases: { id: string; title: string; caseNumber: string; caseStatus: string }[];
};

/**
 * Booking wizard's "share this case with my provider" step needs to offer a
 * case picker before the customer has navigated to My Cases at all -- same
 * account-ownership rule as every other customer action here (non-"limited"
 * links only, since sharing is a write), just grouped by patient instead of
 * requiring the caller to already know a patientId.
 */
export async function listMyShareableCasesAction(): Promise<PatientActionResult<ShareableCaseGroup[]>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return { ok: false, error: t("errors.notFound") };

  const access = await listPatientAccessForAccount(accountId);
  const groups = await Promise.all(
    access
      .filter((entry) => entry.accessRole !== "limited")
      .map(async (entry) => {
        const cases = await listCasesForPatient(entry.patient.id);
        return {
          patientId: entry.patient.id,
          patientName: `${entry.patient.firstName} ${entry.patient.lastName}`.trim(),
          cases: cases.map((c) => ({ id: c.id, title: c.title, caseNumber: c.caseNumber, caseStatus: c.caseStatus })),
        };
      })
  );
  return { ok: true, data: groups.filter((group) => group.cases.length > 0) };
}

/**
 * Customer-side counterpart to a would-be admin equivalent (none exists --
 * sharing a case with a provider is patient-initiated by nature, same
 * reasoning as V5.3's share grants). Same object-level rule as the rest of
 * this session's customer actions: the signed-in account must hold an
 * active, non-"limited" account_patient_links row for the case's patient.
 */
async function requireOwnedLink(patientId: string) {
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return null;
  const link = await findActiveAccountPatientLink(accountId, patientId);
  if (!link || link.accessRole === "limited") return null;
  return { accountId };
}

export async function createCaseProviderGrantAction(
  input: CreateCaseProviderGrantInput
): Promise<PatientActionResult<CaseProviderGrantRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = CreateCaseProviderGrantSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const grant = await createCaseProviderGrant({ ...values, grantedBy: owned.accountId });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "case_provider_grant_created",
    entityType: "case_provider_grant",
    entityId: grant.id,
    metadata: { patientId: values.patientId, medicalCaseId: values.medicalCaseId, providerId: values.providerId, permission: values.permission, selfService: true },
  });
  revalidatePath(MY_CASES_PATH);
  return { ok: true, data: grant };
}

export async function revokeCaseProviderGrantAction(
  input: RevokeCaseProviderGrantInput
): Promise<PatientActionResult<CaseProviderGrantRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RevokeCaseProviderGrantSchema.parse(input);
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const grant = await revokeCaseProviderGrant(values.id, owned.accountId);
  // Defense in depth: confirm the grant that was just revoked actually
  // belonged to this patient, not just that the caller owns *some* case --
  // mirrors the same double-check used for consents/share grants in
  // customer-sharing-actions.ts.
  if (!grant || grant.patientId !== values.patientId) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "case_provider_grant_revoked",
    entityType: "case_provider_grant",
    entityId: grant.id,
    metadata: { patientId: grant.patientId, medicalCaseId: grant.medicalCaseId, providerId: grant.providerId, selfService: true },
  });
  revalidatePath(MY_CASES_PATH);
  return { ok: true, data: grant };
}
