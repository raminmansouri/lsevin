import "server-only";

import db from "@/config/database/db";

import { audit } from "../platform/booking";
import { fail, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { assertAdminActor, requireReason, requireUuid } from "./guard";

type Tx = typeof db;

/**
 * Rebooks a customer onto another departure of the SAME tour (M-015).
 *
 * Design choice (documented in IMPLEMENTATION terms): the reservation keeps its
 * identity. The same booking.bookings row (payment, refunds, accounting, "my
 * bookings") and the same tour.bookings row (voucher, QR, accepted policy and
 * price snapshot) are moved by updating tour.bookings.departure_id. Nothing is
 * re-charged or re-quoted: the customer keeps the price and policy they
 * accepted (AT-13). Inventory moves through the shared SQL invariants, in one
 * transaction:
 *
 *   1. both departures are locked in a stable order (no deadlock with a
 *      concurrent checkout or a second rebook),
 *   2. tour.place_hold() on the target — the same capacity / blackout / cutoff /
 *      availability checks a customer faces (INSUFFICIENT_CAPACITY etc.),
 *   3. tour.convert_hold() turns those held seats into booked seats,
 *   4. the old departure's booked_count is decreased by exactly the seats moved.
 *
 * If any step fails the transaction rolls back and both departures are unchanged.
 */
export async function rebookBooking(actor: Actor, input: { bookingId: string; targetDepartureId: string; reason: string }) {
  assertAdminActor(actor);
  const bookingId = requireUuid(input.bookingId, "booking_not_found");
  const targetId = requireUuid(input.targetDepartureId, "departure_not_found");
  const reason = requireReason(input.reason);
  try {
    return await db.begin(async (tx) => {
      const [b] = await tx<any[]>`
        select booking_id::text, tour_id::text, departure_id::text, option_id::text, user_id::text, service_provider_id::text, status, seats
          from tour.bookings where booking_id = ${bookingId}::uuid for update`;
      if (!b) throw fail.notFound("booking_not_found");
      if (!["pending_payment", "requested", "confirmed"].includes(b.status)) throw fail.conflict("not_rebookable", { status: b.status });
      if (b.departure_id === targetId) throw fail.validation("same_departure");
      const [checked] = await tx<any[]>`select 1 from tour.checkins where booking_id = ${bookingId}::uuid and result = 'accepted' limit 1`;
      if (checked) throw fail.conflict("already_checked_in");

      await tx`select id from tour.departures where id in (${b.departure_id}::uuid, ${targetId}::uuid) order by id for update`;
      const [target] = await tx<any[]>`
        select id::text, tour_id::text, option_id::text, starts_on::text, local_start_time::text, starts_at
          from tour.departures where id = ${targetId}::uuid`;
      if (!target) throw fail.notFound("departure_not_found");
      if (target.tour_id !== b.tour_id) throw fail.validation("different_tour");
      if (target.option_id && b.option_id && target.option_id !== b.option_id) throw fail.validation("option_not_offered_on_departure");

      const key = `rebook_${bookingId.replace(/-/g, "")}_${crypto.randomUUID().replace(/-/g, "")}`;
      const [hold] = await tx<any[]>`select id::text, seats from tour.place_hold(${targetId}::uuid, ${b.user_id}::uuid, ${b.seats}, 5, ${key})`;
      await tx`select tour.convert_hold(${hold.id}::uuid, ${b.user_id}::uuid, ${bookingId}::uuid)`;
      const released = await tx`
        update tour.departures set booked_count = booked_count - ${b.seats}, last_modified_date = now()
         where id = ${b.departure_id}::uuid and booked_count >= ${b.seats} returning id`;
      if (released.length === 0) throw fail.conflict("inventory_inconsistent");

      const localTime = target.local_start_time ? String(target.local_start_time).slice(0, 5) : null;
      const startsAt = new Date(target.starts_at).toISOString();
      await tx`
        update tour.bookings
           set departure_id = ${targetId}::uuid, hold_id = ${hold.id}::uuid, updated_at = now(),
               content_snapshot = content_snapshot || ${db.json({ localDate: target.starts_on, localTime, startsAt } as never)}
         where booking_id = ${bookingId}::uuid`;
      await tx`
        update booking.bookings
           set selected_date = ${target.starts_on}::date, selected_time = ${target.local_start_time}::time,
               metadata = coalesce(metadata, '{}'::jsonb) || ${db.json({ tourDepartureId: targetId } as never)}, last_modified_date = now()
         where id = ${bookingId}::uuid`;
      await tx`
        insert into tour.booking_events (booking_id, event_type, payload, actor_user_id)
        values (${bookingId}::uuid, 'rebooked', ${db.json({ from: b.departure_id, to: targetId, reason } as never)}, ${actor.userId}::uuid)`;
      await audit(tx as unknown as Tx, actor, b.service_provider_id, "booking", bookingId, "rebooked",
        { from: b.departure_id, to: targetId, seats: b.seats, reason, tourId: b.tour_id });
      return { bookingId, from: b.departure_id as string, to: targetId, seats: b.seats as number };
    });
  } catch (e) {
    throw mapDbError(e, "rebookBooking");
  }
}

/** Departures of the same tour a booking can be moved to (enough free seats, bookable). */
export async function rebookTargets(actor: Actor, bookingId: string) {
  assertAdminActor(actor);
  requireUuid(bookingId, "booking_not_found");
  return db<any[]>`
    select d.id::text, d.starts_on::text, d.local_start_time::text, d.timezone, d.starts_at, d.capacity - d.booked_count - d.held_count as remaining
      from tour.bookings b
      join tour.departures d on d.tour_id = b.tour_id and d.id <> b.departure_id
     where b.booking_id = ${bookingId}::uuid
       and d.status in ('scheduled','delayed') and d.is_active and not d.is_blocked
       and coalesce(d.booking_cutoff_at, d.starts_at) > now()
       and d.capacity - d.booked_count - d.held_count >= b.seats
       and (d.option_id is null or b.option_id is null or d.option_id = b.option_id)
     order by d.starts_at limit 60`;
}
