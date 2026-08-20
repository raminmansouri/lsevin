"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";
import { getSession } from "@/lib/auth/session";

import {
  CreateConsultationRequestSchema,
  DeleteConsultationRecipientSchema,
  SaveConsultationSmsSettingsSchema,
  UpdateConsultationRequestSchema,
  UpsertConsultationRecipientSchema,
  type CreateConsultationRequestInput,
  type SaveConsultationSmsSettingsInput,
  type UpdateConsultationRequestInput,
  type UpsertConsultationRecipientInput,
} from "../schemas";
import {
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationActionResult,
  type ConsultationRecipient,
} from "../types";
import { dispatchConsultationNotifications } from "./notifications";
import {
  DUPLICATE_PHONE,
  RECIPIENT_NOT_FOUND,
  consultationSchemaExists,
  consumeConsultationRateLimit,
  createConsultationRequest,
  deleteConsultationRecipient,
  getConsultationSmsSettings,
  saveConsultationSmsSettings,
  updateConsultationRequest,
  upsertConsultationRecipient,
} from "./repository";

const ADMIN_PATH = "/admin/consultation-requests";

/**
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id from any page, so each one re-establishes who the caller is. The
 * admin ones use assertAdmin() — `createAuthenticatedSafeAction`'s `adminRequired`
 * flag does not actually check roles (getSession ignores the parameter), so it is
 * not a substitute here.
 */

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export async function submitConsultationRequest(
  input: CreateConsultationRequestInput
): Promise<ConsultationActionResult<{ id: string }>> {
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  // The booking wizard is behind `protectedSegments`, so a caller here is always
  // signed in. Requiring it explicitly matters for a second reason: this endpoint
  // makes the platform send an SMS to a number supplied in the request body, and
  // an anonymous version of that is an SMS-cost amplifier. Pattern mode already
  // bounds the *content* — the body is fixed at the provider and cannot be made
  // to look like a verification code — and the per-user rate limit below bounds
  // the volume.
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return { ok: false, error: t("errors.signInRequired") };
  }

  if (!(await consultationSchemaExists())) {
    return { ok: false, error: t("errors.notAvailable") };
  }

  let values;
  try {
    values = CreateConsultationRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: t("errors.invalidForm"),
        fieldErrors: fieldErrorsFrom(error),
      };
    }
    throw error;
  }

  const settings = await getConsultationSmsSettings();
  const allowed = await consumeConsultationRateLimit(
    `consultation:user:${userId}`,
    settings.rateLimitPerHour
  );

  if (!allowed) {
    return { ok: false, error: t("errors.rateLimited") };
  }

  const locale = await getLocale();

  const created = await createConsultationRequest({
    userId,
    bookingDraftId: values.bookingDraftId ?? null,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    // What the form said the number belongs to, falling back to the account's
    // country. Stored so an admin calling back an international lead knows which
    // dial code the stored number already carries.
    phoneCountryCode:
      values.phoneCountryCode ?? session?.user?.phoneNumberCountryCode ?? null,
    email: values.email ?? null,
    categoryId: values.categoryId ?? null,
    categoryName: values.categoryName ?? null,
    description: values.description ?? null,
    preferredContactTime: values.preferredContactTime,
    urgency: values.urgency,
    locale,
    source: "booking_wizard",
  });

  // Awaited rather than fired and forgotten: a serverless invocation can be frozen
  // the moment the response is returned, which would strand the send mid-flight and
  // leave a `pending` row nothing ever resolves. dispatch never throws and bounds
  // each provider call at 15s.
  await dispatchConsultationNotifications({
    requestId: created.id,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    urgencyLabel: t(`urgency.${values.urgency}`),
  });

  revalidatePath(ADMIN_PATH);

  return { ok: true, data: { id: created.id } };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function updateConsultationRequestAction(
  input: UpdateConsultationRequestInput
): Promise<ConsultationActionResult> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  let values;
  try {
    values = UpdateConsultationRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: t("errors.invalidForm"),
        fieldErrors: fieldErrorsFrom(error),
      };
    }
    throw error;
  }

  const updated = await updateConsultationRequest({
    id: values.id,
    status: values.status,
    adminNote: values.adminNote ?? null,
    actorUserId: ctx.userId ?? null,
  });

  if (!updated) return { ok: false, error: t("errors.notFound") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

export async function upsertConsultationRecipientAction(
  input: UpsertConsultationRecipientInput
): Promise<ConsultationActionResult<ConsultationRecipient>> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  let values;
  try {
    values = UpsertConsultationRecipientSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: t("errors.invalidForm"),
        fieldErrors: fieldErrorsFrom(error),
      };
    }
    throw error;
  }

  const outcome = await upsertConsultationRecipient({
    id: values.id,
    label: values.label,
    phone: values.phone,
    isActive: values.isActive,
  });

  if (outcome.error === DUPLICATE_PHONE) {
    return {
      ok: false,
      error: t("errors.duplicatePhone"),
      fieldErrors: { phone: ["duplicatePhone"] },
    };
  }

  if (outcome.error === RECIPIENT_NOT_FOUND || !outcome.recipient) {
    return { ok: false, error: t("errors.notFound") };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: outcome.recipient };
}

export async function deleteConsultationRecipientAction(
  input: { id: string }
): Promise<ConsultationActionResult> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  let values;
  try {
    values = DeleteConsultationRecipientSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm") };
    }
    throw error;
  }

  const deleted = await deleteConsultationRecipient(values.id);
  if (!deleted) return { ok: false, error: t("errors.notFound") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

export async function saveConsultationSmsSettingsAction(
  input: SaveConsultationSmsSettingsInput
): Promise<ConsultationActionResult> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  let values;
  try {
    values = SaveConsultationSmsSettingsSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: t("errors.invalidForm"),
        fieldErrors: fieldErrorsFrom(error),
      };
    }
    throw error;
  }

  await saveConsultationSmsSettings({
    enabled: values.enabled,
    customerBodyId: values.customerBodyId,
    adminBodyId: values.adminBodyId,
    rateLimitPerHour: values.rateLimitPerHour,
    actorUserId: ctx.userId ?? null,
  });

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}
