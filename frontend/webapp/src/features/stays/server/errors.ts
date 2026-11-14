import "server-only";

import { fail, logUnexpected, mapDbError, ToursError, type ActionResult } from "@/features/tours/server/platform/errors";

/**
 * Stays reuse the tours error categories (validation / authentication /
 * authorization / not_found / conflict / infrastructure / unexpected). Only the
 * codes raised on purpose by the stay.* SQL functions (0102) are mapped to
 * conflict / not-found / validation; everything else goes through the shared
 * classifier, so a database outage surfaces as `infrastructure`, never as
 * "invalid input".
 */
const STAY_RAISED: Record<string, ToursError["kind"]> = {
  ROOM_TYPE_NOT_FOUND: "not_found",
  PROPERTY_NOT_FOUND: "not_found",
  BOOKING_NOT_FOUND: "not_found",
  HOLD_NOT_FOUND: "not_found",
  PROPERTY_UNAVAILABLE: "conflict",
  INSUFFICIENT_INVENTORY: "conflict",
  STOP_SELL: "conflict",
  CLOSED_TO_ARRIVAL: "conflict",
  HOLD_EXPIRED: "conflict",
  UNITS_BELOW_BOOKED: "conflict",
  IDEMPOTENCY_KEY_CONFLICT: "conflict",
  MIN_NIGHTS: "validation",
  MAX_NIGHTS: "validation",
  INVALID_DATES: "validation",
  INVALID_TERMINAL_STATUS: "validation",
};

export function mapStayError(error: unknown, context: string): ToursError {
  if (error instanceof ToursError) return error;
  const message = String((error as { message?: string })?.message ?? "");
  const code = Object.keys(STAY_RAISED).find((c) => message === c || message.startsWith(`${c}`));
  if (code) return new ToursError(STAY_RAISED[code], code.toLowerCase());
  // Some databases still carry booking-pro's "one pending checkout per user" index
  // (the .NET migration DropOnePendingCheckoutIndex removes it). Where it exists, a
  // guest with another unpaid/requested booking gets a clear answer, not "duplicate".
  const e = error as { code?: string; constraint_name?: string; constraint?: string };
  if (e?.code === "23505" && (e.constraint_name ?? e.constraint) === "ux_bookings_one_pending_checkout_per_user") {
    return new ToursError("conflict", "pending_booking_exists");
  }
  return mapDbError(error, `stays.${context}`);
}

export async function runStayAction<T>(context: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const mapped = mapStayError(error, context);
    return { ok: false, error: { kind: mapped.kind, code: mapped.code, details: mapped.details } };
  }
}

export { fail, logUnexpected, ToursError as StayError, type ActionResult };
