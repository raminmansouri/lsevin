import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getBookingGlobalTag() {
  return getGlobalTag("bookings");
}

export function getBookingIdTag(id: string) {
  return getIdTag("bookings", id);
}

export function getBookingUserTag(userId: string) {
  return getUserTag("bookings", userId);
}

export function revalidateBookingCache({
  id,
  userId,
}: {
  id?: string;
  userId: string;
}) {
  revalidateTag(getBookingGlobalTag());
  if (id) {
    revalidateTag(getBookingIdTag(id));
  }
  revalidateTag(getBookingUserTag(userId));
}

export function revalidateBulkBookingCache({
  ids,
  userId,
}: {
  ids: string[];
  userId: string;
}) {
  ids.forEach((id) => {
    revalidateTag(getBookingIdTag(id));
  });
  revalidateTag(getBookingUserTag(userId));
  revalidateTag(getBookingGlobalTag());
}
