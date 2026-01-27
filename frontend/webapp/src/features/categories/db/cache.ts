import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getCategoryGlobalTag() {
  return getGlobalTag("categories");
}

export function getCategoryIdTag(id: string) {
  return getIdTag("categories", id);
}

export function getCategoryUserTag(userId: string) {
  return getUserTag("categories", userId);
}

export function revalidateCategoryCache({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}) {
  revalidateTag(getCategoryGlobalTag());
  if (id) {
    revalidateTag(getCategoryIdTag(id));
  }
  revalidateTag(getCategoryUserTag(userId));
}

export function revalidateBulkCategoryCache({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  ids.forEach((id) => {
    revalidateTag(getCategoryIdTag(id));
  });
  revalidateTag(getCategoryUserTag(userId));
  revalidateTag(getCategoryGlobalTag());
}
