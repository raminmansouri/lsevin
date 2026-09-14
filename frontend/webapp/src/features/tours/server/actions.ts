"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { DeleteTourDepartureSchema, UpsertTourDepartureSchema, type UpsertTourDepartureInput } from "../schemas";
import { TOURS_TRANSLATION_KEY, type TourActionResult, type TourDeparture } from "../types";
import { deleteTourDeparture, listOpenDeparturesForService, upsertTourDeparture } from "./repository";

const ADMIN_PATH = "/admin/tours";

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
