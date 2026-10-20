import "server-only";

import db from "@/config/database/db";

import { fail, mapDbError } from "../platform/errors";

import { auditOps, iso, notifyUser, requireUuid, type Tx } from "./common";

/**
 * Waitlist (C-100). Joining records explicit consent to be contacted. When
 * seats free up (expired holds, cancellations, capacity increase) the earliest
 * waiting entries that fit are offered the seats for OFFER_HOURS; the offer is
 * a notification, not a reservation — the customer books through the normal
 * checkout, which re-checks inventory. Called by the sweeper.
 */

const OFFER_HOURS = 2;

export async function joinWaitlist(userId: string, departureId: string, seats: number): Promise<{ id: string; position: number }> {
  if (!userId) throw fail.auth();
  requireUuid(departureId, "departure_not_found");
  if (!Number.isInteger(seats) || seats < 1 || seats > 50) throw fail.validation("invalid_seats");
  const [d] = await db<any[]>`
    select d.capacity, d.booked_count, d.held_count, d.status, d.is_active, d.is_blocked, d.starts_at, t.status as tour_status, t.max_participants,
           d.service_provider_id::text
      from tour.departures d join tour.tours t on t.id = d.tour_id where d.id = ${departureId}::uuid`;
  if (!d || d.tour_status !== "published") throw fail.notFound("departure_not_found");
  if (!d.is_active || d.is_blocked || !["scheduled", "delayed"].includes(d.status) || new Date(d.starts_at).getTime() <= Date.now()) throw fail.conflict("departure_unavailable");
  if (d.max_participants && seats > d.max_participants) throw fail.validation("invalid_seats");
  if (d.capacity - d.booked_count - d.held_count >= seats) throw fail.conflict("seats_available");
  try {
    return await db.begin(async (tx) => {
      const [existing] = await tx<any[]>`select id::text, status from tour.waitlist where departure_id = ${departureId}::uuid and user_id = ${userId}::uuid for update`;
      let id: string;
      if (existing) {
        if (["waiting", "offered"].includes(existing.status)) throw fail.conflict("already_waitlisted");
        await tx`update tour.waitlist set status = 'waiting', seats = ${seats}, consent_at = now(), offer_expires_at = null, created_at = now() where id = ${existing.id}::uuid`;
        id = existing.id;
      } else {
        const [w] = await tx<any[]>`insert into tour.waitlist (departure_id, user_id, seats, consent_at) values (${departureId}::uuid, ${userId}::uuid, ${seats}, now()) returning id::text`;
        id = w.id;
      }
      const [pos] = await tx<any[]>`
        select count(*)::int as n from tour.waitlist w
         where w.departure_id = ${departureId}::uuid and w.status = 'waiting'
           and w.created_at <= (select created_at from tour.waitlist where id = ${id}::uuid)`;
      await auditOps(tx as unknown as Tx, { userId }, "customer", d.service_provider_id, "waitlist", id, "waitlist_joined", { departureId, seats });
      return { id, position: pos.n as number };
    });
  } catch (e) {
    throw mapDbError(e, "joinWaitlist");
  }
}

export async function leaveWaitlist(userId: string, departureId: string): Promise<{ left: boolean }> {
  if (!userId) throw fail.auth();
  requireUuid(departureId, "departure_not_found");
  return db.begin(async (tx) => {
    const r = await tx<any[]>`update tour.waitlist set status = 'cancelled' where departure_id = ${departureId}::uuid and user_id = ${userId}::uuid
                               and status in ('waiting','offered') returning id::text`;
    if (r.length > 0) await auditOps(tx as unknown as Tx, { userId }, "customer", null, "waitlist", r[0].id, "waitlist_left", { departureId });
    return { left: r.length > 0 };
  });
}

export async function myWaitlistEntry(userId: string, departureId: string) {
  requireUuid(departureId, "departure_not_found");
  const [w] = await db<any[]>`select id::text, seats, status, offer_expires_at, created_at from tour.waitlist where departure_id = ${departureId}::uuid and user_id = ${userId}::uuid`;
  return w ? { id: w.id, seats: w.seats, status: w.status, offerExpiresAt: iso(w.offer_expires_at), createdAt: iso(w.created_at)! } : null;
}

/**
 * Lapses expired offers, then offers free seats FIFO to waiting entries that
 * fit. Serialized per departure by the row lock. Returns the number of new offers.
 */
export async function offerReleasedSeats(departureId: string): Promise<number> {
  requireUuid(departureId, "departure_not_found");
  const offered = await db.begin(async (tx) => {
    const [d] = await tx<any[]>`
      select d.capacity, d.booked_count, d.held_count, d.status, d.is_active, d.is_blocked, d.starts_at, d.booking_cutoff_at
        from tour.departures d where d.id = ${departureId}::uuid for update`;
    if (!d) return [];
    await tx`update tour.waitlist set status = 'expired' where departure_id = ${departureId}::uuid and status = 'offered' and offer_expires_at <= now()`;
    const open = d.is_active && !d.is_blocked && ["scheduled", "delayed"].includes(d.status)
      && new Date(d.booking_cutoff_at ?? d.starts_at).getTime() > Date.now();
    if (!open) return [];
    const [o] = await tx<any[]>`select coalesce(sum(seats), 0)::int as n from tour.waitlist where departure_id = ${departureId}::uuid and status = 'offered'`;
    let free = d.capacity - d.booked_count - d.held_count - o.n;
    if (free <= 0) return [];
    const waiting = await tx<any[]>`select id::text, user_id::text, seats from tour.waitlist where departure_id = ${departureId}::uuid and status = 'waiting' order by created_at, id`;
    const out: { id: string; userId: string; seats: number; expiresAt: Date }[] = [];
    for (const w of waiting) {
      if (free <= 0) break;
      if (w.seats > free) continue;
      const [u] = await tx<any[]>`update tour.waitlist set status = 'offered', offer_expires_at = now() + make_interval(hours => ${OFFER_HOURS})
                                   where id = ${w.id}::uuid and status = 'waiting' returning offer_expires_at`;
      if (!u) continue;
      free -= w.seats;
      out.push({ id: w.id, userId: w.user_id, seats: w.seats, expiresAt: new Date(u.offer_expires_at) });
      await auditOps(tx as unknown as Tx, { userId: null }, "system", null, "waitlist", w.id, "waitlist_offered", { departureId, seats: w.seats });
    }
    return out;
  });
  for (const o of offered) {
    await notifyUser({
      userId: o.userId, type: "booking", title: "Seats are available", body: `${o.seats} seat(s) opened up on a tour you are waiting for. The offer is held for ${OFFER_HOURS} hours.`,
      entityType: "tour_departure", entityId: departureId,
      data: { kind: "waitlist_offer", departureId, seats: o.seats, expiresAt: o.expiresAt.toISOString(), href: `/tours/departures/${departureId}` },
    });
  }
  return offered.length;
}

/** Marks offered/waiting entries converted once the user holds a live booking on the departure. */
export async function markWaitlistConversions(): Promise<number> {
  const r = await db`
    update tour.waitlist w set status = 'converted'
     where w.status in ('offered','waiting')
       and exists (select 1 from tour.bookings tb where tb.departure_id = w.departure_id and tb.user_id = w.user_id
                     and tb.status in ('pending_payment','requested','confirmed') and tb.created_at >= w.created_at)
    returning w.id`;
  return r.length;
}
