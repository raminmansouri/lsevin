import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import type { ProviderPageDataResponse } from "@/features/service-providers/types/provider-page-types";
import type { ApiReturnType } from "@/types/network";

import { getProviderPageDataTag } from "../db/cache";
import {
  getProviderPageDataFromDb,
  type ProviderPageQueryInput,
} from "./provider-page.repository";

/**
 * Cached wrapper around {@link getProviderPageDataFromDb}. The provider page is
 * a client component that fetches this through a server action on mount, so the
 * heavy join fan-out ran on every navigation. The result only changes when the
 * provider, its services/staff or its media change.
 *
 * Every field of the input (providerId, locale, userId, currency, country) is
 * part of the `"use cache"` key, so a signed-in visitor keeps their
 * personalised favourite / converted price; anonymous visitors share one entry
 * per (provider, locale, currency, country).
 *
 * Tag: `provider-page` + `service-providers:id:page-<id>` — call
 * `revalidateTag(getProviderPageDataTag(id))` from the provider admin mutations.
 */
export async function getProviderPageDataFromDbCached(
  input: ProviderPageQueryInput,
): Promise<ApiReturnType<ProviderPageDataResponse>> {
  "use cache";
  cacheTag("provider-page");
  if (input?.providerId) cacheTag(getProviderPageDataTag(input.providerId));
  cacheLife("default");

  return getProviderPageDataFromDb(input);
}
