import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getStaffGlobalTag() {
  return getGlobalTag("staff");
}

export function getStaffIdTag(id: string) {
  return getIdTag("staff", id);
}

export function getStaffUserTag(userId: string) {
  return getUserTag("staff", userId);
}

export function revalidateStaffCache({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}) {
  revalidateTag(getStaffGlobalTag());
  if (id) {
    revalidateTag(getStaffIdTag(id));
  }
  revalidateTag(getStaffUserTag(userId));
}

export function revalidateBulkStaffCache({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  ids.forEach((id) => {
    revalidateTag(getStaffIdTag(id));
  });
  revalidateTag(getStaffUserTag(userId));
  revalidateTag(getStaffGlobalTag());
}
