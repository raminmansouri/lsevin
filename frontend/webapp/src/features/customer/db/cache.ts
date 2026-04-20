import { revalidateTag } from "next/cache";

import {
  getGlobalTag,
  getIdTag,
  getServiceProviderTag,
  getUserTag,
} from "@/lib/data-cache";

export function getHomePageGlobalTag() {
  return getGlobalTag("home-page");
}

export function getHomePageTag(id: string) {
  return getIdTag("home-page", id);
}

export function getGetPickedLocationsTag() {
  return getIdTag("home-page", 'picked-locations');
}

export function revalidateHomePageRequestCache(
  id?: string,
) {
  revalidateTag(getHomePageGlobalTag());
  if (id) {
    revalidateTag(getHomePageTag(id));
  }

}
