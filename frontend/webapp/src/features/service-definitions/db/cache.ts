import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getServiceDefinitionGlobalTag() {
  return getGlobalTag("service-definitions");
}

export function getServiceDefinitionIdTag(id: string) {
  return getIdTag("service-definitions", id);
}

export function getServiceDefinitionUserTag(userId: string) {
  return getUserTag("service-definitions", userId);
}

export function getServiceDefinitionAllLocalesGlobalTag() {
  return "service-definitions-all-locales";
}

export function revalidateServiceDefinitionCache({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}) {
  revalidateTag(getServiceDefinitionGlobalTag());
  if (id) {
    revalidateTag(getServiceDefinitionIdTag(id));
  }
  revalidateTag(getServiceDefinitionUserTag(userId));
}

export function revalidateBulkServiceDefinitionCache({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  ids.forEach((id) => {
    revalidateTag(getServiceDefinitionIdTag(id));
  });
  revalidateTag(getServiceDefinitionUserTag(userId));
  revalidateTag(getServiceDefinitionGlobalTag());
}
