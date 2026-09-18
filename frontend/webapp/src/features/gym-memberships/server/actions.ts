"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";
import { getSession } from "@/lib/auth/session";

import {
  ReviewMembershipMonthSchema,
  SubmitMembershipMonthsSchema,
  UpsertMembershipPlanSchema,
  type ReviewMembershipMonthInput,
  type SubmitMembershipMonthsInput,
  type UpsertMembershipPlanInput,
} from "../schemas";
import {
  GYM_MEMBERSHIPS_TRANSLATION_KEY,
  type GymMembership,
  type GymMembershipActionResult,
  type GymMembershipPlan,
} from "../types";
import {
  gymMembershipSchemaExists,
  listMembershipPlans,
  listMyMemberships,
  reviewMembershipMonth,
  submitMembershipMonths,
  upsertMembershipPlan,
} from "./repository";

const ADMIN_PATH = "/admin/gym-memberships";
const CUSTOMER_PATH = "/profile/memberships";

/**
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id from any page, so each one re-establishes who the caller is -- same
 * discipline consultation/server/actions.ts documents for itself.
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

export async function submitMembershipMonthsAction(
  input: SubmitMembershipMonthsInput
): Promise<GymMembershipActionResult<{ membershipId: string; created: number }>> {
  const t = await getTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ?? null;
  if (!userId) return { ok: false, error: t("errors.signInRequired") };

  if (!(await gymMembershipSchemaExists())) {
    return { ok: false, error: t("errors.notAvailable") };
  }

  let values;
  try {
    values = SubmitMembershipMonthsSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let outcome;
  try {
    outcome = await submitMembershipMonths(userId, values.membershipPlanId, values.periodMonths, values.paymentReference);
  } catch (error) {
    if (error instanceof Error && error.message === "PLAN_NOT_FOUND") {
      return { ok: false, error: t("errors.planNotFound") };
    }
    throw error;
  }

  revalidatePath(CUSTOMER_PATH);
  revalidatePath(ADMIN_PATH);
  return { ok: true, data: { membershipId: outcome.membershipId, created: outcome.created } };
}

/** Public: the plan picker a customer browses before subscribing. No session is
 * required to look, matching the rest of the catalogue (booking-pro's own service
 * listing needs no sign-in either). */
export async function listActiveMembershipPlansAction(): Promise<GymMembershipActionResult<GymMembershipPlan[]>> {
  if (!(await gymMembershipSchemaExists())) {
    return { ok: true, data: [] };
  }

  const locale = await getLocale();
  const plans = await listMembershipPlans(locale, { activeOnly: true });
  return { ok: true, data: plans };
}

export async function getMyMembershipsAction(): Promise<GymMembershipActionResult<GymMembership[]>> {
  const t = await getTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ?? null;
  if (!userId) return { ok: false, error: t("errors.signInRequired") };

  if (!(await gymMembershipSchemaExists())) {
    return { ok: true, data: [] };
  }

  const locale = await getLocale();
  const memberships = await listMyMemberships(userId, locale);
  return { ok: true, data: memberships };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function upsertMembershipPlanAction(
  input: UpsertMembershipPlanInput
): Promise<GymMembershipActionResult<{ id: string }>> {
  await assertAdmin();
  const t = await getTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);

  let values;
  try {
    values = UpsertMembershipPlanSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const result = await upsertMembershipPlan({
    id: values.id,
    serviceProviderId: values.serviceProviderId,
    nameTranslations: values.nameTranslations.translations,
    monthlyPrice: values.monthlyPrice,
    currency: values.currency,
    isActive: values.isActive,
  });

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: result };
}

// No hard delete: a plan with paid history can't be removed (memberships/months
// reference it), so "delete" from the admin's point of view is deactivating it via
// upsertMembershipPlanAction with isActive:false.

export async function reviewMembershipMonthAction(
  input: ReviewMembershipMonthInput
): Promise<GymMembershipActionResult> {
  const ctx = await assertAdmin();
  const t = await getTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);

  let values;
  try {
    values = ReviewMembershipMonthSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let updated: boolean;
  try {
    updated = await reviewMembershipMonth({ id: values.id, decision: values.decision, note: values.note, actorUserId: ctx.userId ?? null });
  } catch (error) {
    if (error instanceof Error) return { ok: false, error: error.message };
    throw error;
  }

  if (!updated) return { ok: false, error: t("errors.notFound") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}
