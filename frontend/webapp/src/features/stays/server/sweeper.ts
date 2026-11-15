import "server-only";

import db from "@/config/database/db";

import { sweepStayDeadlines } from "./booking";
import { logUnexpected } from "./errors";

/**
 * Stays housekeeping: lapsed holds, unpaid bookings, unanswered requests and
 * finished stays. One process per tick (transaction-scoped advisory lock, safe
 * behind PgBouncer); every step is an idempotent status transition.
 * STAYS_SWEEPER=off disables the in-process loop.
 */
export const STAYS_SWEEP_LOCK_ID = 7_041_778_202;

export async function runStaysSweep(): Promise<{ ran: boolean; result?: Awaited<ReturnType<typeof sweepStayDeadlines>>; error?: string }> {
  return db.begin(async (lockTx) => {
    const [l] = await lockTx<{ ok: boolean }[]>`select pg_try_advisory_xact_lock(${STAYS_SWEEP_LOCK_ID}) as ok`;
    if (!l?.ok) return { ran: false };
    try {
      return { ran: true, result: await sweepStayDeadlines() };
    } catch (e) {
      logUnexpected("staysSweep", e);
      return { ran: true, error: "deadlines" };
    }
  });
}

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

export function startStaysSweeper(intervalMs = 60_000) {
  if (process.env.STAYS_SWEEPER === "off" || timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      // The stay schema arrives with migration 0107; before it exists there is nothing to sweep.
      const [t] = await db<{ ok: boolean }[]>`select to_regclass('stay.bookings') is not null as ok`;
      if (t?.ok) await runStaysSweep();
    } catch (e) {
      logUnexpected("staysSweep", e);
    } finally {
      running = false;
    }
  };
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
}

export function stopStaysSweeper() {
  if (timer) clearInterval(timer);
  timer = null;
}
