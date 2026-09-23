"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { ReviewAccountLinkRequestSchema, type ReviewAccountLinkRequestInput } from "../link-request-schemas";
import type { AccountLinkRequestRow } from "../link-request-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { getAccountLinkRequest, resolveAccountLinkRequest } from "./link-request-repository";
import { linkAccountToPatient } from "./repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

/**
 * The only place a customer-submitted link request ever turns into a real
 * patient.account_patient_links row -- via the same, unmodified
 * linkAccountToPatient() the rest of the admin panel already uses, so
 * nothing about how links are created changes for any other caller.
 */
export async function reviewAccountLinkRequestAction(
  input: ReviewAccountLinkRequestInput
): Promise<PatientActionResult<AccountLinkRequestRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = ReviewAccountLinkRequestSchema.parse(input);

  const existing = await getAccountLinkRequest(values.id);
  if (!existing || existing.requestStatus !== "pending") return { ok: false, error: t("errors.notFound") };

  const patientId = values.decision === "approved" ? (values.patientId ?? existing.matchedPatientId) : null;
  if (values.decision === "approved" && !patientId) return { ok: false, error: t("errors.invalidForm") };

  const request = await resolveAccountLinkRequest({
    id: values.id,
    status: values.decision,
    reviewedBy: ctx.userId ?? "",
    reviewNotes: values.reviewNotes,
  });
  if (!request) return { ok: false, error: t("errors.notFound") };

  if (values.decision === "approved" && patientId) {
    await linkAccountToPatient({
      accountId: existing.accountId,
      patientId,
      relationshipType: existing.relationshipType,
      accessRole: values.accessRole ?? "full",
      createdBy: ctx.userId ?? null,
    });
    await recordPatientAuditEvent({
      actorUserId: ctx.userId,
      actorRoles: ctx.roles,
      action: "account_link_request_approved",
      entityType: "account_link_request",
      entityId: request.id,
      metadata: { patientId, accountId: existing.accountId },
    });
    revalidatePath(`${ADMIN_PATIENTS_PATH}/${patientId}`);
  } else {
    await recordPatientAuditEvent({
      actorUserId: ctx.userId,
      actorRoles: ctx.roles,
      action: "account_link_request_rejected",
      entityType: "account_link_request",
      entityId: request.id,
      metadata: { accountId: existing.accountId },
    });
  }

  return { ok: true, data: request };
}
