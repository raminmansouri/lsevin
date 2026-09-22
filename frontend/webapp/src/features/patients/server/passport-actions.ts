"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { GeneratePassportSchema, type GeneratePassportInput } from "../passport-schemas";
import type { PatientPassportRow } from "../passport-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { generatePatientPassport } from "./passport-repository";

const ADMIN_PATIENTS_PATH = "/admin/patients";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function generatePatientPassportAction(
  input: GeneratePassportInput
): Promise<PatientActionResult<PatientPassportRow>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  let values;
  try {
    values = GeneratePassportSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    throw error;
  }

  const passport = await generatePatientPassport({ ...values, generatedBy: ctx.userId ?? null });
  if (!passport) return { ok: false, error: t("errors.notFound") };

  await recordPatientAuditEvent({
    actorUserId: ctx.userId,
    actorRoles: ctx.roles,
    action: "passport_generated",
    entityType: "patient_passport",
    entityId: passport.id,
    metadata: { patientId: values.patientId, language: values.language, sections: values.includedSections },
  });
  revalidatePath(`${ADMIN_PATIENTS_PATH}/${values.patientId}`);
  return { ok: true, data: passport };
}
