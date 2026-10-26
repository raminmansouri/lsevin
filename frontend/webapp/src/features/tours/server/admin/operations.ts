import "server-only";

import db from "@/config/database/db";

import { setTourVisibility } from "../platform/authoring";
import { audit } from "../platform/booking";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";
import { cancelDeparture, delayDeparture, updateDeparture, type NoticeTexts } from "../ops/departures";
import { stopTracking } from "../ops/live";

import { assertAdminActor, intIn, requireReason, requireUuid } from "./guard";

/**
 * Platform-admin overrides on provider operations (M-015, M-019). The ops
 * layer does the work (and its own audit); every admin override additionally
 * records the admin's written reason as `admin_override` in tour.audit_log so
 * the trail answers "who, what and why" (CLAUDE.md §10).
 */

async function departureOwner(departureId: string) {
  const [d] = await db<any[]>`select service_provider_id::text, tour_id::text from tour.departures where id = ${departureId}::uuid`;
  if (!d) throw fail.notFound("departure_not_found");
  return d as { service_provider_id: string; tour_id: string | null };
}

async function recordOverride(actor: Actor, departureId: string, action: string, reason: string, detail: Record<string, unknown> = {}) {
  const d = await departureOwner(departureId);
  await audit(db, actor, d.service_provider_id, "departure", departureId, "admin_override", { action, reason, tourId: d.tour_id, ...detail });
}

export async function adminSetDepartureBlocked(actor: Actor, input: { departureId: string; blocked: boolean; reason: string }) {
  assertAdminActor(actor);
  const id = requireUuid(input.departureId, "departure_not_found");
  const reason = requireReason(input.reason);
  await updateDeparture(actor, id, { block: Boolean(input.blocked) });
  await recordOverride(actor, id, input.blocked ? "block" : "unblock", reason);
}

export async function adminOverrideCapacity(actor: Actor, input: { departureId: string; capacity: number | string; reason: string }) {
  assertAdminActor(actor);
  const id = requireUuid(input.departureId, "departure_not_found");
  const reason = requireReason(input.reason);
  const capacity = intIn(input.capacity, 1, 10_000, "invalid_capacity");
  await updateDeparture(actor, id, { capacity });
  await recordOverride(actor, id, "capacity", reason, { capacity });
}

function noticeFrom(input: { sourceLocale: string; texts: Record<string, { title: string; body: string }> }): NoticeTexts {
  const texts: NoticeTexts["texts"] = {};
  for (const [loc, t] of Object.entries(input.texts ?? {})) {
    const title = String(t?.title ?? "").trim();
    const body = String(t?.body ?? "").trim();
    if (title || body) texts[loc] = { title, body };
  }
  return { sourceLocale: input.sourceLocale, texts };
}

export async function adminDelayDeparture(actor: Actor, input: { departureId: string; minutes: number | string; reason: string; notice: { sourceLocale: string; texts: Record<string, { title: string; body: string }> } }) {
  assertAdminActor(actor);
  const id = requireUuid(input.departureId, "departure_not_found");
  const reason = requireReason(input.reason);
  const minutes = intIn(input.minutes, 1, 1440, "invalid_delay_minutes");
  const r = await delayDeparture(actor, id, minutes, noticeFrom(input.notice));
  await recordOverride(actor, id, "delay", reason, { minutes, notified: r.notified });
  return r;
}

/** Cancels a departure, releases every seat exactly once and sends the mass notice (M-015, M-019). */
export async function adminCancelDeparture(actor: Actor, input: { departureId: string; reasonCode: string; reason: string; notice: { sourceLocale: string; texts: Record<string, { title: string; body: string }> } }) {
  assertAdminActor(actor);
  const id = requireUuid(input.departureId, "departure_not_found");
  const reason = requireReason(input.reason);
  const r = await cancelDeparture(actor, id, input.reasonCode, noticeFrom(input.notice));
  await recordOverride(actor, id, "cancel", reason, { reasonCode: input.reasonCode, ...r });
  return r;
}

/** Ends live location sharing for safety/privacy reasons (screen matrix: "Audit/disable location sharing"). */
export async function adminDisableTracking(actor: Actor, input: { departureId: string; reason: string }) {
  assertAdminActor(actor);
  const id = requireUuid(input.departureId, "departure_not_found");
  const reason = requireReason(input.reason);
  const session = await stopTracking(actor, id, "admin_disabled");
  await recordOverride(actor, id, "disable_tracking", reason, { sessionId: session?.id ?? null });
  return { stopped: Boolean(session) };
}

/** Suspends (pauses) or restores a published tour with a recorded reason (M-015). */
export async function adminSetTourVisibility(actor: Actor, input: { tourId: string; target: "paused" | "published" | "retired"; reason: string }) {
  assertAdminActor(actor);
  const tourId = requireUuid(input.tourId, "tour_not_found");
  if (!["paused", "published", "retired"].includes(input.target)) throw fail.validation("invalid_status_transition");
  const reason = requireReason(input.reason);
  await setTourVisibility(actor, tourId, input.target);
  const [t] = await db<any[]>`select service_provider_id::text from tour.tours where id = ${tourId}::uuid`;
  await audit(db, actor, t?.service_provider_id ?? null, "tour", tourId, "admin_override", { action: `visibility_${input.target}`, reason });
}

/**
 * Removes a blackout. Departures it blocked (status_reason 'blackout') are
 * unblocked unless another blackout still covers their date.
 */
export async function removeBlackout(actor: Actor, input: { blackoutId: string; reason: string }) {
  assertAdminActor(actor);
  const id = requireUuid(input.blackoutId, "blackout_not_found");
  const reason = requireReason(input.reason);
  return db.begin(async (tx) => {
    const [b] = await tx<any[]>`
      delete from tour.blackouts bl using tour.tours t
       where bl.id = ${id}::uuid and t.id = bl.tour_id
      returning bl.tour_id::text, bl.date_from::text, bl.date_to::text, t.service_provider_id::text`;
    if (!b) throw fail.notFound("blackout_not_found");
    const unblocked = await tx`
      update tour.departures d set is_blocked = false, status_reason = null, last_modified_date = now()
       where d.tour_id = ${b.tour_id}::uuid and d.is_blocked and d.status_reason = 'blackout'
         and d.starts_on between ${b.date_from}::date and ${b.date_to}::date
         and not exists (select 1 from tour.blackouts o where o.tour_id = d.tour_id and d.starts_on between o.date_from and o.date_to)
      returning d.id`;
    await audit(tx as unknown as typeof db, actor, b.service_provider_id, "blackout", id, "removed",
      { tourId: b.tour_id, from: b.date_from, to: b.date_to, unblocked: unblocked.length, reason });
    return { unblocked: unblocked.length };
  });
}
