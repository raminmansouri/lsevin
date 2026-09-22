"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  CreateShareGrantSchema,
  GrantConsentSchema,
  RevokeAccountLinkSchema,
  RevokeShareGrantSchema,
  WithdrawConsentSchema,
  type CreateShareGrantInput,
  type GrantConsentInput,
  type RevokeAccountLinkInput,
  type RevokeShareGrantInput,
  type WithdrawConsentInput,
} from "../sharing-schemas";
import type { PatientConsentRow, ShareGrantRow, ShareGrantWithToken } from "../sharing-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { getPatientById, unlinkAccountFromPatient } from "./repository";
import { createShareGrant, grantConsent, revokeShareGrant, withdrawConsent } from "./sharing-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function grantConsentAction(input: GrantConsentInput): Promise<PatientActionResult<PatientConsentRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = GrantConsentSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const consent = await grantConsent({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "consent_granted",
    entityType: "patient_consent",
    entityId: consent.id,
    metadata: { patientId: values.patientId },
    purpose: values.purpose,
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: consent };
}

export async function withdrawConsentAction(input: WithdrawConsentInput): Promise<PatientActionResult<PatientConsentRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = WithdrawConsentSchema.parse(input);
  const consent = await withdrawConsent(values.id);
  if (!consent) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "consent_withdrawn",
    entityType: "patient_consent",
    entityId: consent.id,
    metadata: { patientId: consent.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${consent.patientId}`);
  return { ok: true, data: consent };
}

export async function createShareGrantAction(
  input: CreateShareGrantInput
): Promise<PatientActionResult<ShareGrantWithToken>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = CreateShareGrantSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }
  const patient = await getPatientById(values.patientId);
  if (!patient) return { ok: false, error: t("errors.notFound") };

  const { grant, token } = await createShareGrant({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "share_grant_created",
    entityType: "share_grant",
    entityId: grant.id,
    metadata: { patientId: values.patientId, scope: values.scope },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: { ...grant, token } };
}

export async function revokeShareGrantAction(input: RevokeShareGrantInput): Promise<PatientActionResult<ShareGrantRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RevokeShareGrantSchema.parse(input);
  const grant = await revokeShareGrant(values.id);
  if (!grant) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "share_grant_revoked",
    entityType: "share_grant",
    entityId: grant.id,
    metadata: { patientId: grant.patientId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${grant.patientId}`);
  return { ok: true, data: grant };
}

/** V5.4 family/proxy access revoke: account_patient_links already models
 * this (0048) via valid_until -- this action is the missing "revoke"
 * surface on top of it (add/link already existed since V0/V1). */
export async function revokeAccountLinkAction(input: RevokeAccountLinkInput): Promise<PatientActionResult<{ revoked: boolean }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RevokeAccountLinkSchema.parse(input);
  const revoked = await unlinkAccountFromPatient(values.accountId, values.patientId);
  if (!revoked) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "account_unlinked",
    entityType: "account_patient_link",
    entityId: null,
    metadata: { patientId: values.patientId, accountId: values.accountId },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: { revoked } };
}
