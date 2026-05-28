"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const locale = String(formData.get("_locale") || "en");
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
  const locale = String(formData.get("_locale") || "en");
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
  revalidatePath(providerBase(locale, providerId));
  revalidatePath(`${providerBase(locale, providerId)}/manage/${resource}`);
  redirect(`${providerBase(locale, providerId)}/manage/${resource}`);
}

export async function deleteProviderResourceAction(formData: FormData) {
  const userId = await requireCurrentUserId();
  const locale = String(formData.get("_locale") || "en");
  const providerId = String(formData.get("_providerId") || "");
  const resource = String(formData.get("_resource") || "");
  const recordId = String(formData.get("_recordId") || "");
  if (!providerId || !resource || !recordId)
    throw new Error("Missing provider resource context.");

  await deleteProviderResourceRow(userId, providerId, resource, recordId);
  revalidatePath(providerBase(locale, providerId));
  revalidatePath(`${providerBase(locale, providerId)}/manage/${resource}`);
}
