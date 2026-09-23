"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z, ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import { CreateShareGrantSchema, type CreateShareGrantInput } from "../sharing-schemas";
import type { PatientConsentRow, ShareGrantRow, ShareGrantWithToken } from "../sharing-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { findActiveAccountPatientLink } from "./repository";
import {
  createShareGrant,
  listConsentsForPatient,
  listShareGrantsForPatient,
  revokeShareGrant,
  withdrawConsent,
} from "./sharing-repository";

const MY_SHARING_PATH = "/n/app/mobile/profile/my-sharing";

/**
 * Customer-side counterpart to sharing-actions.ts's assertAdmin()-gated
 * actions. Object-level check only (same rule as the document-download
 * route and my-health-record/my-cases): the signed-in account must hold an
 * active, non-"limited" account_patient_links row for the target patient.
 * "limited" is excluded here for the same reason it hides clinical/case
 * detail elsewhere -- managing who else can see the record is not a
 * "basic details only" action.
 */
async function requireOwnedLink(patientId: string) {
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return null;
  const link = await findActiveAccountPatientLink(accountId, patientId);
  if (!link || link.accessRole === "limited") return null;
  return { accountId };
}

const WithdrawMyConsentSchema = z.object({ patientId: z.uuid(), id: z.uuid() });
export type WithdrawMyConsentInput = z.input<typeof WithdrawMyConsentSchema>;

export async function withdrawMyConsentAction(input: WithdrawMyConsentInput): Promise<PatientActionResult<PatientConsentRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = WithdrawMyConsentSchema.parse(input);
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const existing = await listConsentsForPatient(values.patientId);
  if (!existing.some((consent) => consent.id === values.id)) return { ok: false, error: t("errors.notFound") };

  const consent = await withdrawConsent(values.id);
  if (!consent) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "consent_withdrawn",
    entityType: "patient_consent",
    entityId: consent.id,
    metadata: { patientId: consent.patientId, selfService: true },
  });
  revalidatePath(MY_SHARING_PATH);
  return { ok: true, data: consent };
}

const RevokeMyShareGrantSchema = z.object({ patientId: z.uuid(), id: z.uuid() });
export type RevokeMyShareGrantInput = z.input<typeof RevokeMyShareGrantSchema>;

export async function revokeMyShareGrantAction(input: RevokeMyShareGrantInput): Promise<PatientActionResult<ShareGrantRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = RevokeMyShareGrantSchema.parse(input);
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const existing = await listShareGrantsForPatient(values.patientId);
  if (!existing.some((grant) => grant.id === values.id)) return { ok: false, error: t("errors.notFound") };

  const grant = await revokeShareGrant(values.id);
  if (!grant) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "share_grant_revoked",
    entityType: "share_grant",
    entityId: grant.id,
    metadata: { patientId: grant.patientId, selfService: true },
  });
  revalidatePath(MY_SHARING_PATH);
  return { ok: true, data: grant };
}

export async function createMyShareGrantAction(input: CreateShareGrantInput): Promise<PatientActionResult<ShareGrantWithToken>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = CreateShareGrantSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }
  const owned = await requireOwnedLink(values.patientId);
  if (!owned) return { ok: false, error: t("errors.notFound") };

  const { grant, token } = await createShareGrant({ ...values, createdBy: owned.accountId });
  await recordPatientAuditEvent({
    actorUserId: owned.accountId,
    action: "share_grant_created",
    entityType: "share_grant",
    entityId: grant.id,
    metadata: { patientId: values.patientId, scope: values.scope, selfService: true },
  });
  revalidatePath(MY_SHARING_PATH);
  return { ok: true, data: { ...grant, token } };
}
