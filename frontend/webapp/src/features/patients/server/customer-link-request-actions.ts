"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import { SubmitAccountLinkRequestSchema, type SubmitAccountLinkRequestInput } from "../link-request-schemas";
import type { AccountLinkRequestRow } from "../link-request-types";
import { PATIENTS_TRANSLATION_KEY, type PatientActionResult } from "../types";
import { recordPatientAuditEvent } from "./audit";
import { createAccountLinkRequest } from "./link-request-repository";

const MY_HEALTH_RECORD_PATH = "/n/app/mobile/profile/my-health-record";

/**
 * Customer-initiated only: never creates or updates
 * patient.account_patient_links directly (see 0060's header comment for
 * why) -- this only ever queues a request for an admin to review in
 * link-request-actions.ts.
 */
export async function submitAccountLinkRequestAction(
  input: SubmitAccountLinkRequestInput
): Promise<PatientActionResult<AccountLinkRequestRow>> {
  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const session = await getSession();
  const accountId = session?.user?.id;
  if (!accountId) return { ok: false, error: t("errors.notFound") };

  let values;
  try {
    values = SubmitAccountLinkRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: t("errors.invalidForm") };
    throw error;
  }

  const request = await createAccountLinkRequest({ ...values, accountId });
  await recordPatientAuditEvent({
    actorUserId: accountId,
    action: "account_link_request_submitted",
    entityType: "account_link_request",
    entityId: request.id,
    metadata: { relationshipType: values.relationshipType, matchedPatientId: request.matchedPatientId, selfService: true },
  });
  revalidatePath(MY_HEALTH_RECORD_PATH);
  return { ok: true, data: request };
}
