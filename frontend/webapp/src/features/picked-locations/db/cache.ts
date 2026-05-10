import { revalidateTag } from "next/cache";

const PICKED_LOCATIONS_TAG = "admin:picked-locations";

export function getPickedLocationsTag() {
  return PICKED_LOCATIONS_TAG;
}

export function getPickedLocationIdTag(id: string) {
  return `${PICKED_LOCATIONS_TAG}:${id}`;
}

export function revalidatePickedLocationCache(id?: string | null) {
  revalidateTag(PICKED_LOCATIONS_TAG);
  if (id) revalidateTag(getPickedLocationIdTag(id));
}
