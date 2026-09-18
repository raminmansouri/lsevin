"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ZodError } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { UpsertTransferRouteSchema, type UpsertTransferRouteInput } from "../schemas";
import { TRANSFERS_TRANSLATION_KEY, type TransferRouteActionResult } from "../types";
import { deleteTransferRoute, upsertTransferRoute } from "./repository";

const ADMIN_PATH = "/admin/transfer-routes";

/**
 * Every export of a `"use server"` module is a public POST endpoint reachable by
 * action id from any page, so each one re-establishes who the caller is -- same
 * discipline consultation/gym-memberships' own actions.ts documents for itself.
 *
 * There is no customer-facing action here on purpose: booking a route is booking
 * a regular provider_services listing, which already goes through booking-pro's
 * own cart/checkout actions. This module only ever edits the from/to enrichment
 * row, never a booking.
 */

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (output[key] ??= []).push(issue.message);
  }
  return output;
}

export async function upsertTransferRouteAction(
  input: UpsertTransferRouteInput
): Promise<TransferRouteActionResult<{ id: string }>> {
  await assertAdmin();
  const t = await getTranslations(TRANSFERS_TRANSLATION_KEY);

  let values;
  try {
    values = UpsertTransferRouteSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: t("admin.errors.invalidForm"), fieldErrors: fieldErrorsFrom(error) };
    }
    throw error;
  }

  const result = await upsertTransferRoute({
    id: values.id,
    serviceProviderId: values.serviceProviderId,
    providerServiceId: values.providerServiceId,
    fromTranslations: values.fromTranslations.translations,
    toTranslations: values.toTranslations.translations,
    vehicleType: values.vehicleType,
  });

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: result };
}

export async function deleteTransferRouteAction(input: {
  id: string;
}): Promise<TransferRouteActionResult> {
  await assertAdmin();
  const t = await getTranslations(TRANSFERS_TRANSLATION_KEY);

  const deleted = await deleteTransferRoute(input.id);
  if (!deleted) return { ok: false, error: t("admin.errors.notFound") };

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}
