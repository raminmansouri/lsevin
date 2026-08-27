import "server-only";

import { dispatchQueuedDeliveries } from "./dispatch";

const INTERVAL_MS = 20_000;

let started = false;

/**
 * The webapp runs as a single long-lived Node process in docker-compose (no cron
 * sidecar), so the queued-delivery worker lives in-process: an interval started once
 * from instrumentation.ts's register() hook. dispatchQueuedDeliveries() claims rows
 * with `for update skip locked`, so this stays safe even if the app is ever scaled to
 * multiple instances -- two ticks racing just split the queue instead of double-sending.
 */
export function startNotificationDispatchLoop(): void {
  if (started) return;
  started = true;

  const tick = async () => {
    try {
      await dispatchQueuedDeliveries();
    } catch (error) {
      console.error("Notification dispatch tick failed", error);
    }
  };

  void tick();
  setInterval(tick, INTERVAL_MS);
}
