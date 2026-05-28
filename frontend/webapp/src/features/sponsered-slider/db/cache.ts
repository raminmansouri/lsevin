import { revalidatePath, revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

export function getSponseredSliderGlobalTag() {
  return getGlobalTag("sponsered-slider");
}

export function getSponseredSliderIdTag(id: string) {
  return getIdTag("sponsered-slider", id);
}

export function getSponseredSliderUserTag(userId: string) {
  return getUserTag("sponsered-slider", userId);
}

export function revalidateSponseredSliderCache({ id, userId }: { id?: string; userId: string }) {
  revalidateTag(getSponseredSliderGlobalTag());
  if (id) revalidateTag(getSponseredSliderIdTag(id));
  revalidateTag(getSponseredSliderUserTag(userId));
  revalidatePath("/admin/sponsered-slider");
  revalidatePath("/admin/sponsored-slider");
}
