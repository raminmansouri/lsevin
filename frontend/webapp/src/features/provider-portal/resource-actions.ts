"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getProviderPageDataTag } from "@/features/service-providers/db/cache";

import { requireCurrentUserId } from "./server/session";
import {
  createProviderResourceRow,
  deleteProviderResourceRow,
  updateProviderResourceRow,
} from "./server/resource-repository";

function providerBase(locale: string, providerId: string) {
  return `/${locale}/provider-portal/providers/${providerId}`;
}

export async function createProviderResourceAction(formData: FormData) {
  const userId = await requireCurrentUserId();
  const locale = String(formData.get("_locale") || "fa");
  const providerId = String(formData.get("_providerId") || "");
  const resource = String(formData.get("_resource") || "");
  if (!providerId || !resource)
    throw new Error("Missing provider resource context.");

  await createProviderResourceRow(userId, providerId, resource, formData);
  revalidatePath(providerBase(locale, providerId));
  revalidatePath(`${providerBase(locale, providerId)}/manage/${resource}`);
  redirect(`${providerBase(locale, providerId)}/manage/${resource}`);
}

export async function updateProviderResourceAction(formData: FormData) {
  const userId = await requireCurrentUserId();
  const locale = String(formData.get("_locale") || "fa");
  const providerId = String(formData.get("_providerId") || "");
  const resource = String(formData.get("_resource") || "");
  const recordId = String(formData.get("_recordId") || "");
  if (!providerId || !resource || !recordId)
    throw new Error("Missing provider resource context.");

  await updateProviderResourceRow(
    userId,
    providerId,
    resource,
    recordId,
    formData,
  );
  // Showing/hiding a review changes the public provider page, which is cached for hours.
  if (resource === "reviews") revalidateTag(getProviderPageDataTag(providerId));
  revalidatePath(providerBase(locale, providerId));
  revalidatePath(`${providerBase(locale, providerId)}/manage/${resource}`);
  redirect(`${providerBase(locale, providerId)}/manage/${resource}`);
}

export async function deleteProviderResourceAction(formData: FormData) {
  const userId = await requireCurrentUserId();
  const locale = String(formData.get("_locale") || "fa");
  const providerId = String(formData.get("_providerId") || "");
  const resource = String(formData.get("_resource") || "");
  const recordId = String(formData.get("_recordId") || "");
  if (!providerId || !resource || !recordId)
    throw new Error("Missing provider resource context.");

  await deleteProviderResourceRow(userId, providerId, resource, recordId);
  revalidatePath(providerBase(locale, providerId));
  revalidatePath(`${providerBase(locale, providerId)}/manage/${resource}`);
}
