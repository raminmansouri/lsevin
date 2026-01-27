import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getProviderTypeGlobalTag() {
  return getGlobalTag("provider-types");
}

export function getProviderTypeIdTag(id: string) {
  return getIdTag("provider-types", id);
}

export function getProviderTypeUserTag(userId: string) {
  return getUserTag("provider-types", userId);
}

export function revalidateProviderTypeCache({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}) {
  revalidateTag(getProviderTypeGlobalTag());
  if (id) {
    revalidateTag(getProviderTypeIdTag(id));
  }
  revalidateTag(getProviderTypeUserTag(userId));
}

export function revalidateBulkProviderTypeCache({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  ids.forEach((id) => {
    revalidateTag(getProviderTypeIdTag(id));
  });
  revalidateTag(getProviderTypeUserTag(userId));
  revalidateTag(getProviderTypeGlobalTag());
}
