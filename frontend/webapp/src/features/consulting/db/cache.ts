import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getConsultingGlobalTag() {
  return getGlobalTag("consulting");
}

export function getConsultingIdTag(id: string) {
  return getIdTag("consulting", id);
}

export function getUserConsultingTag(userId: string) {
  return getUserTag("consulting", userId);
}

export function revalidateConsultingCache(id: string, userId: string) {
  revalidateTag(getConsultingGlobalTag());
  revalidateTag(getConsultingIdTag(id));
  revalidateTag(getUserConsultingTag(userId));
}
