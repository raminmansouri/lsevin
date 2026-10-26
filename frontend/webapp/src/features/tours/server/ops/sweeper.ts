import "server-only";

import db from "@/config/database/db";

import { sweepTourDeadlines } from "../platform/booking";
import { logUnexpected } from "../platform/errors";
import { getTourSettings } from "../platform/settings";

import { markWaitlistConversions, offerReleasedSeats } from "./waitlist";

/**
 * Background housekeeping for tours. Safe to run from every app instance:
 * a session-level advisory lock lets exactly one process work per tick, and
 * every step is itself idempotent (status transitions are the guards).
 *
 *   1. booking deadlines: lapsed holds, unpaid bookings, unanswered requests
 *   2. tracking sessions whose departure ended > 6 h ago → ended ('expired')
 *   3. tracking points past retention_until → purged (AT-19 retention)
 *   4. recent views past retention → purged
 *   5. departures that ended → 'completed'; their confirmed bookings → 'completed'
 *   6. waitlist: conversions, then offers for departures with free seats
 */

/** Exported for the exclusivity test; not part of the public API. */
export const SWEEP_LOCK_ID = 7_041_778_201;
const LOCK_ID = SWEEP_LOCK_ID;

export type SweepResult = {
  ran: boolean;
  deadlines?: { holds: number; unpaid: number; requests: number };
  trackingEnded?: number;
  pointsPurged?: number;
  recentViewsPurged?: number;
  departuresCompleted?: number;
  bookingsCompleted?: number;
  waitlistConverted?: number;
  waitlistOffers?: number;
  errors: string[];
};

async function step<T>(name: string, errors: string[], fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    logUnexpected(`toursSweep.${name}`, e);
    errors.push(name);
    return undefined;
  }
}

export async function runToursSweep(): Promise<SweepResult> {
  const errors: string[] = [];
  // pg_try_advisory_XACT_lock held by one open transaction for the duration of
  // the sweep: it is released by commit/rollback or when the connection dies,
  // so it can never leak — also behind a transaction-pooling PgBouncer, where a
  // session-level lock/unlock pair may land on different backends. The sweep
  // body runs sequentially on the pool (one statement in flight), so this
  // holder plus one working connection is all it ever needs.
  return db.begin(async (lockTx) => {
    const [l] = await lockTx<{ ok: boolean }[]>`select pg_try_advisory_xact_lock(${LOCK_ID}) as ok`;
    if (!l?.ok) return { ran: false, errors };
    {
      const settings = await getTourSettings({ fresh: true });
      const retentionDays = Number(settings.trackingRetentionDays ?? 30);
      const out: SweepResult = { ran: true, errors };

      out.deadlines = await step("deadlines", errors, () => sweepTourDeadlines());

      out.trackingEnded = await step("trackingExpired", errors, async () => {
        const r = await db`
          update tour.tracking_sessions s
             set ended_at = now(), end_reason = 'expired', retention_until = now() + make_interval(days => ${retentionDays})
            from tour.departures d
           where s.departure_id = d.id and s.ended_at is null
             and (coalesce(d.ends_at, d.starts_at) + make_interval(mins => d.delay_minutes) + interval '6 hours' < now()
                  or d.status = 'cancelled')
          returning s.id`;
        return r.length;
      });

      out.pointsPurged = await step("trackingPurge", errors, async () => {
        const r = await db`
          delete from tour.tracking_points p using tour.tracking_sessions s
           where p.session_id = s.id and s.ended_at is not null and s.retention_until <= now()
          returning p.id`;
        return r.length;
      });

      out.recentViewsPurged = await step("recentViews", errors, async () => {
        const days = Number(settings.recentViewsRetentionDays ?? 180);
        const r = await db`delete from tour.recent_views where viewed_at < now() - make_interval(days => ${days}) returning tour_id`;
        return r.length;
      });

      const completed = await step("completeDepartures", errors, async () => {
        const deps = await db<{ id: string }[]>`
          select id::text from tour.departures
           where tour_id is not null and status in ('scheduled','delayed','in_progress')
             and coalesce(ends_at, starts_at) + make_interval(mins => delay_minutes) < now()
           order by ends_at limit 200`;
        let bookings = 0;
        for (const d of deps) {
          bookings += await db.begin(async (tx) => {
            const u = await tx`update tour.departures set status = 'completed', last_modified_date = now()
                                where id = ${d.id}::uuid and status in ('scheduled','delayed','in_progress') returning id`;
            if (u.length === 0) return 0;
            const confirmed = await tx<{ booking_id: string }[]>`select booking_id::text from tour.bookings where departure_id = ${d.id}::uuid and status = 'confirmed' for update`;
            for (const b of confirmed) {
              await tx`select tour.close_booking(${b.booking_id}::uuid, 'completed', null)`;
              await tx`update booking.bookings set booking_status = 'Completed', last_modified_date = now() where id = ${b.booking_id}::uuid`;
            }
            await tx`insert into tour.audit_log (actor_scope, service_provider_id, entity_type, entity_id, action, detail)
                     select 'system', service_provider_id, 'departure', id, 'departure_completed', ${db.json({ bookings: confirmed.length } as never)}
                       from tour.departures where id = ${d.id}::uuid`;
            return confirmed.length;
          });
        }
        return { departures: deps.length, bookings };
      });
      out.departuresCompleted = completed?.departures;
      out.bookingsCompleted = completed?.bookings;

      out.waitlistConverted = await step("waitlistConversions", errors, () => markWaitlistConversions());
      out.waitlistOffers = await step("waitlistOffers", errors, async () => {
        const deps = await db<{ id: string }[]>`
          select distinct w.departure_id::text as id
            from tour.waitlist w join tour.departures d on d.id = w.departure_id
           where w.status in ('waiting','offered') and d.status in ('scheduled','delayed') and d.starts_at > now()
           limit 200`;
        let n = 0;
        for (const d of deps) n += await offerReleasedSeats(d.id);
        return n;
      });
      return out;
    }
  });
}

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/** Starts the in-process sweep loop (every 60 s). TOURS_SWEEPER=off disables it. */
export function startToursSweeper(intervalMs = 60_000) {
  if (process.env.TOURS_SWEEPER === "off" || timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await runToursSweep();
      if (r.errors.length) console.warn("[tours] sweep finished with errors", { steps: r.errors });
    } catch (e) {
      logUnexpected("toursSweep", e);
    } finally {
      running = false;
    }
  };
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
}

export function stopToursSweeper() {
  if (timer) clearInterval(timer);
  timer = null;
}
