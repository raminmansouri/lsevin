"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z, ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import { AddClinicalDocumentSchema, type AddClinicalDocumentInput } from "../documents-schemas";
import type { ClinicalDocumentRow } from "../documents-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { addClinicalDocument } from "./documents-repository";
import { listRequirementsForCase, updateRequirementStatus } from "./cases-repository";
import { findActiveAccountPatientLink } from "./repository";

const MY_CASES_PATH = "/n/app/mobile/profile/my-cases";

async function requireOwnedLink(patientId: string) {
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return null;
  const link = await findActiveAccountPatientLink(accountId, patientId);
  if (!link || link.accessRole === "limited") return null;
  return { accountId };
}

/**
 * Customer-side document upload -- object-level gated the same way as
 * every other customer action this session. Optionally fulfils a specific
 * case requirement (customer responding to "please upload your last blood
 * test"): requirementId is checked against listRequirementsForCase for
 * this exact medicalCaseId before being touched, same double-check
 * pattern used for revoking grants elsewhere in this feature.
 */
const UploadMyDocumentSchema = AddClinicalDocumentSchema.extend({
  medicalCaseId: z.uuid().optional(),
  requirementId: z.uuid().optional(),
});
export type UploadMyDocumentInput = z.input<typeof UploadMyDocumentSchema>;

export async function uploadMyDocumentAction(
  input: UploadMyDocumentInput
): Promise<PatientActionResult<ClinicalDocumentRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = UploadMyDocumentSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  if (values.requirementId && values.medicalCaseId) {
    const requirements = await listRequirementsForCase(values.medicalCaseId);
    if (!requirements.some((requirement) => requirement.id === values.requirementId)) {
      return { ok: false, error: t("errors.notFound") };
    }
  }

  const document = await addClinicalDocument({ ...values, createdBy: owned.accountId });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "document_added",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId: values.patientId, requirementId: values.requirementId, selfService: true },
  });

  if (values.requirementId) {
    await updateRequirementStatus(values.requirementId, "received", document.id);
    await recordPatientAuditEvent({
      actorUserId: owned.accountId,
      action: "case_requirement_updated",
      entityType: "medical_case_requirement",
      entityId: values.requirementId,
      metadata: { patientId: values.patientId, fulfilledDocumentId: document.id, selfService: true },
    });
  }

  revalidatePath(MY_CASES_PATH);
  return { ok: true, data: document };
}
