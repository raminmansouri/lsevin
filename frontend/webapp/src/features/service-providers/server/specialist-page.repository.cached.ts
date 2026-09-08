import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { getSpecialistPageByIdTag } from "../db/cache";
import type { SpecialistPageResponse } from "../types/specialist-page-types";
import { getSpecialistPageFromDb } from "./specialist-page.repository";

type SpecialistPageArgs = Parameters<typeof getSpecialistPageFromDb>[0];

/**
 * Cached wrapper around {@link getSpecialistPageFromDb} — same rationale as
 * {@link getServicePageByIdCached}: a heavy per-request join fan-out whose
 * result only moves when the staff member, their providers or their media
 * change. Every argument is part of the `"use cache"` key so personalised
 * currency is preserved; anonymous visitors share one entry per
 * (specialist, locale, currency, country).
 *
 * Tag: `specialist-page` + `service-providers:user:spec-<id>` — call
 * `revalidateTag(getSpecialistPageByIdTag(id))` from the staff admin mutations.
 */
export async function getSpecialistPageFromDbCached(
  args: SpecialistPageArgs,
): Promise<SpecialistPageResponse | null> {
  "use cache";
  cacheTag("specialist-page");
  if (args?.specialistId) cacheTag(getSpecialistPageByIdTag(args.specialistId));
  // See service-page.repository.cached.ts: "default" never expires, and the
  // key includes userId, so entries only ever accumulated until the 50MB
  // cache cap forced eviction churn. "hours" still avoids the join fan-out
  // within a session but frees combinations nobody revisits in a day.
  cacheLife("hours");

  return getSpecialistPageFromDb(args);
}
