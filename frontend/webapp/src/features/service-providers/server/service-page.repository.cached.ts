import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getServicePageDataTag } from "../db/cache";
import type { GetServicePageByIdResponse } from "../types/service-page.types";
import { getServicePageByIdFromDb } from "./service-page.repository";

type ServicePageArgs = Parameters<typeof getServicePageByIdFromDb>[0];

/**
 * Cached wrapper around {@link getServicePageByIdFromDb}. The repository does a
 * large fan-out of joins across `category.*` / `media.*` on every request; the
 * result only changes when the service, its provider or its media change.
 *
 * Every argument (serviceId, locale, userId, currency, country) is part of the
 * `"use cache"` key, so a signed-in visitor still gets their personalised
 * favourite / converted price — anonymous visitors, who are the bulk of the
 * traffic, all share one entry per (service, locale, currency, country).
 *
 * Tags: `service-page` (all) + `service-providers:id:service-<id>` — call
 * `revalidateTag(getServicePageDataTag(id))` from the service/provider admin
 * mutations to push an edit through immediately.
 */
export async function getServicePageByIdCached(
  args: ServicePageArgs,
): Promise<GetServicePageByIdResponse | null> {
  "use cache";
  cacheTag("service-page");
  if (args?.serviceId) cacheTag(getServicePageDataTag(args.serviceId));
  cacheLife("default");

  return getServicePageByIdFromDb(args);
}
