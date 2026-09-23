"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AddFollowupScheduleRuleSchema,
  DeactivateFollowupScheduleRuleSchema,
  type AddFollowupScheduleRuleInput,
  type DeactivateFollowupScheduleRuleInput,
} from "../analytics-schemas";
import type { FollowupScheduleRuleRow } from "../analytics-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { addFollowupScheduleRule, deactivateFollowupScheduleRule } from "./followup-automation-repository";

const ADMIN_PATIENTS_OPERATIONS_PATH = "/admin/patients/operations";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function addFollowupScheduleRuleAction(
  input: AddFollowupScheduleRuleInput
): Promise<PatientActionResult<FollowupScheduleRuleRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = AddFollowupScheduleRuleSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const rule = await addFollowupScheduleRule({ ...values, createdBy: ctx.userId ?? null });
  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "followup_schedule_rule_added",
    entityType: "followup_schedule_rule",
    entityId: rule.id,
    metadata: { caseType: values.caseType, daysAfterCompletion: values.daysAfterCompletion },
  });
  revalidatePath(ADMIN_PATIENTS_OPERATIONS_PATH);
  return { ok: true, data: rule };
}

export async function deactivateFollowupScheduleRuleAction(
  input: DeactivateFollowupScheduleRuleInput
): Promise<PatientActionResult<FollowupScheduleRuleRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const values = DeactivateFollowupScheduleRuleSchema.parse(input);

  const rule = await deactivateFollowupScheduleRule(values.id);
  if (!rule) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "followup_schedule_rule_deactivated",
    entityType: "followup_schedule_rule",
    entityId: rule.id,
    metadata: { caseType: rule.caseType },
  });
  revalidatePath(ADMIN_PATIENTS_OPERATIONS_PATH);
  return { ok: true, data: rule };
}
