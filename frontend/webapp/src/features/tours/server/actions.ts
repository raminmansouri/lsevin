"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";
import { getSession } from "@/lib/auth/session";

import {
  CancelGatheringCampaignSchema,
  ConfirmGatheringCampaignSchema,
  CreateGatheringCampaignSchema,
  DeleteTourDepartureSchema,
  JoinGatheringCampaignSchema,
  ReviewGatheringParticipantSchema,
  UpsertTourDepartureSchema,
  type ConfirmGatheringCampaignInput,
  type CreateGatheringCampaignInput,
  type JoinGatheringCampaignInput,
  type ReviewGatheringParticipantInput,
  type UpsertTourDepartureInput,
} from "../schemas";
import {
  TOURS_TRANSLATION_KEY,
  type TourActionResult,
  type TourDeparture,
  type TourGatheringCampaign,
} from "../types";
import {
  cancelGatheringCampaign,
  confirmGatheringCampaign,
  createGatheringCampaign,
  deleteTourDeparture,
  getOpenGatheringCampaignForService,
  joinGatheringCampaign,
  listMyGatheringParticipations,
  listOpenDeparturesForService,
  listOpenGatheringCampaigns,
  reviewGatheringParticipant,
  upsertTourDeparture,
} from "./repository";

const ADMIN_PATH = "/admin/tours";
const CUSTOMER_PATH = "/profile/tour-gatherings";

/**
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id from any page, so each one re-establishes who the caller is -- same
 * discipline every other feature's actions.ts documents for itself this session.
 */

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function upsertTourDepartureAction(
  input: UpsertTourDepartureInput
): Promise<TourActionResult<{ id: string }>> {
  await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  let values;
  try {
    values = UpsertTourDepartureSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("admin.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let result;
  try {
    result = await upsertTourDeparture(values);
  } catch (error) {
    if (error instanceof Error && error.message === "DEPARTURE_NOT_FOUND_OR_CAPACITY_BELOW_BOOKED") {
      return { ok: false, error: t("admin.errors.capacityBelowBooked") };
    }
    if (error instanceof Error && error.message === "PROVIDER_SERVICE_NOT_FOUND") {
      return { ok: false, error: t("admin.errors.tourNotFound") };
    }
    throw error;
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: result };
}

export async function deleteTourDepartureAction(input: { id: string }): Promise<TourActionResult> {
  await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  const values = DeleteTourDepartureSchema.parse(input);
  const deleted = await deleteTourDeparture(values.id);
  if (!deleted) return { ok: false, error: t("admin.errors.deleteHasBookings") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

/** Public, no session required -- browsing a tour's departure dates is part of the
 * catalogue, same as browsing the tour listing itself needs no sign-in. */
export async function listOpenDeparturesForServiceAction(
  providerServiceId: string
): Promise<TourActionResult<TourDeparture[]>> {
  const departures = await listOpenDeparturesForService(providerServiceId);
  return { ok: true, data: departures };
}

// ---------------------------------------------------------------------------
// Subscription-gathering campaigns
// ---------------------------------------------------------------------------

export async function createGatheringCampaignAction(
  input: CreateGatheringCampaignInput
): Promise<TourActionResult<{ id: string }>> {
  await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  let values;
  try {
    values = CreateGatheringCampaignSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("admin.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let result;
  try {
    result = await createGatheringCampaign(values);
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_SERVICE_NOT_FOUND") {
      return { ok: false, error: t("admin.errors.tourNotFound") };
    }
    throw error;
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: result };
}

export async function confirmGatheringCampaignAction(
  input: ConfirmGatheringCampaignInput
): Promise<TourActionResult> {
  await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  let values;
  try {
    values = ConfirmGatheringCampaignSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("admin.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const confirmed = await confirmGatheringCampaign(values);
  if (!confirmed) return { ok: false, error: t("admin.errors.gatheringNotOpen") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

export async function cancelGatheringCampaignAction(input: { id: string }): Promise<TourActionResult> {
  await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  const values = CancelGatheringCampaignSchema.parse(input);
  const cancelled = await cancelGatheringCampaign(values.id);
  if (!cancelled) return { ok: false, error: t("admin.errors.gatheringNotOpen") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

export async function reviewGatheringParticipantAction(
  input: ReviewGatheringParticipantInput
): Promise<TourActionResult> {
  const ctx = await assertAdmin();
  const t = await getTranslations(TOURS_TRANSLATION_KEY);

  let values;
  try {
    values = ReviewGatheringParticipantSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("admin.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let updated: boolean;
  try {
    updated = await reviewGatheringParticipant({
      id: values.id,
      decision: values.decision,
      note: values.note,
      actorUserId: ctx.userId ?? null,
    });
  } catch (error) {
    if (error instanceof Error) return { ok: false, error: error.message };
    throw error;
  }

  if (!updated) return { ok: false, error: t("admin.errors.notFound") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}

/** Public: an open gathering campaign for a given tour listing, if any -- browsing
 * whether a tour is gathering interest needs no sign-in, same as browsing its fixed
 * departures. */
export async function getOpenGatheringCampaignForServiceAction(
  providerServiceId: string
): Promise<TourActionResult<TourGatheringCampaign | null>> {
  const campaign = await getOpenGatheringCampaignForService(providerServiceId);
  return { ok: true, data: campaign };
}

export async function joinGatheringCampaignAction(
  input: JoinGatheringCampaignInput
): Promise<TourActionResult<{ alreadyJoined: boolean }>> {
  const t = await getTranslations(TOURS_TRANSLATION_KEY);
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ?? null;
  if (!userId) return { ok: false, error: t("customer.errors.signInRequired") };

  let values;
  try {
    values = JoinGatheringCampaignSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("customer.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  let result;
  try {
    result = await joinGatheringCampaign(userId, values.campaignId, values.paymentReference);
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") {
      return { ok: false, error: t("customer.errors.campaignNotFound") };
    }
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_OPEN") {
      return { ok: false, error: t("customer.errors.campaignNotOpen") };
    }
    throw error;
  }

  revalidatePath(CUSTOMER_PATH);
  return { ok: true, data: { alreadyJoined: result.alreadyJoined } };
}

/** Public: every currently-open campaign across all tours, for the customer browse
 * page -- signing in is only required to actually join, not to look. */
export async function listOpenGatheringCampaignsAction(): Promise<TourActionResult<TourGatheringCampaign[]>> {
  const locale = await getLocale();
  const campaigns = await listOpenGatheringCampaigns(locale);
  return { ok: true, data: campaigns };
}

export async function getMyGatheringParticipationsAction(): Promise<
  TourActionResult<Awaited<ReturnType<typeof listMyGatheringParticipations>>>
> {
  const t = await getTranslations(TOURS_TRANSLATION_KEY);
  const session = await getSession().catch(() => null);
  const userId = session?.user?.id ?? null;
  if (!userId) return { ok: false, error: t("customer.errors.signInRequired") };

  const locale = await getLocale();
  const participations = await listMyGatheringParticipations(userId, locale);
  return { ok: true, data: participations };
}
