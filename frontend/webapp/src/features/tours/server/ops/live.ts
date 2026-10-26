import "server-only";

import db from "@/config/database/db";

import { acceptablePoints, trackingState, type IncomingPoint } from "../../domain/live";
import { fail, mapDbError } from "../platform/errors";
import { canSeeDepartureLocation, type Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import type { LiveView } from "./contract";
import { auditOps, authorizeDeparture, iso, loadDeparture, requireUuid, type Tx } from "./common";

/**
 * Live trip (C-070..C-080, AT-19, AT-20).
 *
 *   * Position is visible only to travelers with a live booking on that
 *     departure, the provider's members, assigned guides and admins — and only
 *     while the session is active. After it ends nobody but an admin (audited)
 *     sees positions; points are purged at retention_until (sweeper).
 *   * Points that are replays, out of order or from the future are dropped
 *     server-side (domain/live.acceptablePoints), so a reconnecting device can
 *     never move the bus back to an old position.
 */

const TRACKING_LEAD_MS = 2 * 3_600_000;
const TRACKING_TAIL_MS = 6 * 3_600_000;

export type TrackingSession = { id: string; departureId: string; startedBy: string; startedAt: string; endedAt: string | null; endReason: string | null; lastSeq: number; lastRecordedAt: string | null };

function mapSession(s: any): TrackingSession {
  return {
    id: s.id, departureId: s.departure_id, startedBy: s.started_by, startedAt: iso(s.started_at)!, endedAt: iso(s.ended_at),
    endReason: s.end_reason ?? null, lastSeq: s.last_seq, lastRecordedAt: iso(s.last_recorded_at),
  };
}

async function emergencyContact(): Promise<{ phone: string; label: string }> {
  const [row] = await db<{ value: any }[]>`select value from tour.settings where key = 'emergency_contact'`;
  const v = row?.value ?? {};
  return { phone: String(v.phone || "112"), label: String(v.label || "Emergency services") };
}

export async function getLiveView(actor: Actor, departureId: string): Promise<LiveView> {
  if (!actor.userId) throw fail.auth();
  const dep = await loadDeparture(departureId);
  const canSeeLocation = await canSeeDepartureLocation(actor, departureId);
  if (!canSeeLocation) {
    // A traveler whose booking is not (yet) confirmed may follow status but not position.
    const [own] = await db`select 1 from tour.bookings where departure_id = ${departureId}::uuid and user_id = ${actor.userId}::uuid
                            and status in ('pending_payment','requested','confirmed','completed') limit 1`;
    if (!own) throw fail.forbidden("not_a_participant");
  }
  const settings = await getTourSettings();
  const [session] = await db<any[]>`
    select id::text, departure_id::text, started_by::text, started_at, ended_at, end_reason, last_seq, last_recorded_at
      from tour.tracking_sessions where departure_id = ${departureId}::uuid order by started_at desc limit 1`;
  const now = new Date();
  const tracking = trackingState({
    sessionStartedAt: iso(session?.started_at), sessionEndedAt: iso(session?.ended_at),
    lastPointAt: iso(session?.last_recorded_at), now, staleSeconds: Number(settings.trackingStaleSeconds ?? 120),
  });

  let lastPosition: LiveView["lastPosition"] = null;
  const active = session && !session.ended_at;
  if (session && canSeeLocation && (active || actor.isAdmin)) {
    const [p] = await db<any[]>`
      select latitude, longitude, accuracy_m, recorded_at from tour.tracking_points
       where session_id = ${session.id}::uuid order by seq desc limit 1`;
    if (p) {
      lastPosition = { lat: Number(p.latitude), lng: Number(p.longitude), accuracyM: p.accuracy_m == null ? null : Number(p.accuracy_m), recordedAt: iso(p.recorded_at)! };
      if (!active) {
        await auditOps(db, actor, "admin", dep.serviceProviderId, "tracking_session", session.id, "position_viewed_after_end", {});
      }
    }
  }

  const milestones = await db<any[]>`
    select id::text, kind, stop_id::text, delay_minutes, note, created_at
      from tour.milestones where departure_id = ${departureId}::uuid order by created_at asc limit 200`;

  let nextStopId: string | null = null;
  if (!["completed", "cancelled"].includes(dep.status)) {
    const stops = await db<{ id: string }[]>`select id::text from tour.itinerary_stops where tour_id = ${dep.tourId}::uuid order by day_number, position`;
    const lastArrived = [...milestones].reverse().find((m) => m.kind === "arrived_stop" && m.stop_id);
    const idx = lastArrived ? stops.findIndex((s) => s.id === lastArrived.stop_id) : -1;
    nextStopId = stops[idx + 1]?.id ?? null;
  }

  // Guide contact per the guide's contact policy (C-078): phone only during the tour window.
  const [guide] = await db<any[]>`
    select g.display_name, g.contact_policy, g.public_phone
      from tour.departure_assignments a join tour.guides g on g.id = a.guide_id
     where a.departure_id = ${departureId}::uuid and a.status in ('assigned','accepted') and a.role in ('lead_guide','guide')
     order by case a.role when 'lead_guide' then 0 else 1 end, a.assigned_at limit 1`;
  const inWindow = now.getTime() >= dep.startsAt.getTime() - TRACKING_LEAD_MS && now.getTime() <= (dep.endsAt ?? dep.startsAt).getTime() + TRACKING_TAIL_MS;
  const guideContact = guide
    ? { name: String(guide.display_name), phone: guide.contact_policy === "phone_during_tour" && inWindow && canSeeLocation && dep.status !== "cancelled" ? guide.public_phone ?? null : null }
    : null;

  return {
    departureId,
    canSeeLocation,
    tracking,
    lastPosition,
    milestones: milestones.map((m) => ({ id: m.id, kind: m.kind, stopId: m.stop_id ?? null, delayMinutes: m.delay_minutes ?? null, note: m.note ?? null, createdAt: iso(m.created_at)! })),
    departureStatus: dep.status,
    delayMinutes: dep.delayMinutes,
    nextStopId,
    guideContact,
    emergency: await emergencyContact(),
  };
}

/** Ends the active session of a departure (inside the caller's transaction). */
export async function endTrackingTx(tx: Tx, departureId: string, reason: "manual" | "completed" | "cancelled" | "expired" | "admin_disabled", retentionDays: number) {
  return tx<any[]>`
    update tour.tracking_sessions
       set ended_at = now(), end_reason = ${reason}, retention_until = now() + make_interval(days => ${retentionDays})
     where departure_id = ${departureId}::uuid and ended_at is null
    returning id::text, departure_id::text, started_by::text, started_at, ended_at, end_reason, last_seq, last_recorded_at`;
}

export async function startTracking(actor: Actor, departureId: string): Promise<TrackingSession> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "manager", allowGuide: true });
  const { dep } = access;
  if (["cancelled", "completed"].includes(dep.status)) throw fail.conflict("departure_not_operating");
  const now = Date.now();
  if (now < dep.startsAt.getTime() - TRACKING_LEAD_MS || now > (dep.endsAt ?? dep.startsAt).getTime() + TRACKING_TAIL_MS) {
    throw fail.conflict("outside_tracking_window");
  }
  try {
    return await db.begin(async (tx) => {
      const [existing] = await tx<any[]>`
        select id::text, departure_id::text, started_by::text, started_at, ended_at, end_reason, last_seq, last_recorded_at
          from tour.tracking_sessions where departure_id = ${departureId}::uuid and ended_at is null for update`;
      if (existing) {
        if (existing.started_by !== actor.userId) throw fail.conflict("tracking_already_active");
        return mapSession(existing);
      }
      const [s] = await tx<any[]>`
        insert into tour.tracking_sessions (departure_id, started_by) values (${departureId}::uuid, ${actor.userId}::uuid)
        returning id::text, departure_id::text, started_by::text, started_at, ended_at, end_reason, last_seq, last_recorded_at`;
      await auditOps(tx as unknown as Tx, actor, access.scope, dep.serviceProviderId, "tracking_session", s.id, "tracking_started", { departureId });
      return mapSession(s);
    });
  } catch (e) {
    // Concurrent start by the same user: the unique active-session index decided; return the winner.
    if ((e as { code?: string })?.code === "23505") {
      const [s] = await db<any[]>`select id::text, departure_id::text, started_by::text, started_at, ended_at, end_reason, last_seq, last_recorded_at
                                    from tour.tracking_sessions where departure_id = ${departureId}::uuid and ended_at is null`;
      if (s && s.started_by === actor.userId) return mapSession(s);
      throw fail.conflict("tracking_already_active");
    }
    throw mapDbError(e, "startTracking");
  }
}

export async function stopTracking(actor: Actor, departureId: string, reason: "manual" | "admin_disabled" = "manual"): Promise<TrackingSession | null> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "manager", allowGuide: true });
  if (reason === "admin_disabled" && !actor.isAdmin) throw fail.forbidden("admin_required");
  const settings = await getTourSettings();
  return db.begin(async (tx) => {
    const [s] = await endTrackingTx(tx as unknown as Tx, departureId, reason === "admin_disabled" ? "admin_disabled" : "manual", Number(settings.trackingRetentionDays ?? 30));
    if (!s) return null;
    await auditOps(tx as unknown as Tx, actor, access.scope, access.dep.serviceProviderId, "tracking_session", s.id, "tracking_stopped", { reason });
    return mapSession(s);
  });
}

/**
 * Accepts a batch of GPS points from the session owner's device. Tracking
 * points are high-volume telemetry: the session start/stop is audited, the
 * individual points are not.
 */
export async function pushPoints(actor: Actor, sessionId: string, points: IncomingPoint[]): Promise<{ accepted: number; rejected: number }> {
  if (!actor.userId) throw fail.auth();
  requireUuid(sessionId, "session_not_found");
  if (!Array.isArray(points) || points.length === 0) return { accepted: 0, rejected: 0 };
  if (points.length > 500) throw fail.validation("too_many_points");
  try {
    return await db.begin(async (tx) => {
      const [s] = await tx<any[]>`select id::text, started_by::text, ended_at, last_seq, last_recorded_at from tour.tracking_sessions where id = ${sessionId}::uuid for update`;
      if (!s) throw fail.notFound("session_not_found");
      if (s.started_by !== actor.userId) throw fail.forbidden("not_session_owner");
      if (s.ended_at) throw fail.conflict("tracking_ended");
      const ok = acceptablePoints(points, { seq: s.last_seq, recordedAt: iso(s.last_recorded_at) }, new Date());
      let accepted = 0;
      for (const p of ok) {
        const r = await tx`
          insert into tour.tracking_points (session_id, seq, recorded_at, latitude, longitude, accuracy_m)
          values (${sessionId}::uuid, ${p.seq}, ${new Date(p.recordedAt)}, ${p.latitude}, ${p.longitude}, ${p.accuracyM ?? null})
          on conflict (session_id, seq) do nothing returning id`;
        accepted += r.length;
      }
      if (ok.length > 0) {
        const last = ok[ok.length - 1];
        await tx`update tour.tracking_sessions set last_seq = ${last.seq}, last_recorded_at = ${new Date(last.recordedAt)} where id = ${sessionId}::uuid`;
      }
      return { accepted, rejected: points.length - accepted };
    });
  } catch (e) {
    throw mapDbError(e, "pushPoints");
  }
}

export type MilestoneInput = { departureId: string; kind: "departed" | "arrived_stop" | "delayed" | "completed" | "note"; stopId?: string | null; delayMinutes?: number | null; note?: string | null };

export async function postMilestone(actor: Actor, input: MilestoneInput): Promise<{ id: string }> {
  const access = await authorizeDeparture(actor, input.departureId, { minimum: "staff", allowGuide: true });
  const { dep } = access;
  if (!["departed", "arrived_stop", "delayed", "completed", "note"].includes(input.kind)) throw fail.validation("invalid_milestone_kind");
  if (["cancelled", "completed"].includes(dep.status)) throw fail.conflict("departure_not_operating");
  if (input.kind === "delayed" && !(Number.isInteger(input.delayMinutes) && input.delayMinutes! >= 1 && input.delayMinutes! <= 1440)) {
    throw fail.validation("invalid_delay_minutes");
  }
  if (input.kind === "arrived_stop" && !input.stopId) throw fail.validation("stop_required");
  const note = input.note == null ? null : String(input.note).trim().slice(0, 1000) || null;
  if (input.kind === "note" && !note) throw fail.validation("note_required");
  const settings = await getTourSettings();
  try {
    return await db.begin(async (tx) => {
      if (input.stopId) {
        requireUuid(input.stopId, "stop_not_found");
        const [s] = await tx`select 1 from tour.itinerary_stops where id = ${input.stopId}::uuid and tour_id = ${dep.tourId}::uuid`;
        if (!s) throw fail.validation("stop_not_in_tour");
      }
      const [m] = await tx<any[]>`
        insert into tour.milestones (departure_id, kind, stop_id, delay_minutes, note, created_by)
        values (${dep.id}::uuid, ${input.kind}, ${input.stopId ?? null}, ${input.kind === "delayed" ? input.delayMinutes! : null}, ${note}, ${actor.userId}::uuid)
        returning id::text`;
      if (input.kind === "delayed") {
        await tx`update tour.departures set status = case when status = 'in_progress' then status else 'delayed' end,
                        delay_minutes = ${input.delayMinutes!}, last_modified_date = now() where id = ${dep.id}::uuid`;
      } else if (input.kind === "departed") {
        await tx`update tour.departures set status = 'in_progress', last_modified_date = now() where id = ${dep.id}::uuid and status in ('scheduled','delayed')`;
      } else if (input.kind === "completed") {
        await tx`update tour.departures set status = 'completed', last_modified_date = now() where id = ${dep.id}::uuid`;
        await endTrackingTx(tx as unknown as Tx, dep.id, "completed", Number(settings.trackingRetentionDays ?? 30));
        const confirmed = await tx<{ booking_id: string }[]>`select booking_id::text from tour.bookings where departure_id = ${dep.id}::uuid and status = 'confirmed'`;
        for (const b of confirmed) {
          await tx`select tour.close_booking(${b.booking_id}::uuid, 'completed', null)`;
          await tx`update booking.bookings set booking_status = 'Completed', last_modified_date = now() where id = ${b.booking_id}::uuid`;
        }
      }
      await auditOps(tx as unknown as Tx, actor, access.scope, dep.serviceProviderId, "milestone", m.id, `milestone_${input.kind}`,
        { departureId: dep.id, stopId: input.stopId ?? null, delayMinutes: input.delayMinutes ?? null });
      return { id: m.id as string };
    });
  } catch (e) {
    throw mapDbError(e, "postMilestone");
  }
}
