import "server-only";

import { isCalendarId, type CalendarId } from "../../domain/calendar";
import { dateFromCalendar } from "../platform/authoring";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";

/**
 * Every admin server function takes the actor explicitly and checks it here,
 * so the rule holds no matter who calls it (a server action, a route handler,
 * a test). Server actions additionally resolve the actor from the session with
 * requireAdmin() — an action id is a public POST endpoint.
 */
export type AdminActor = Actor & { userId: string };

export function assertAdminActor(actor: Actor): asserts actor is AdminActor {
  if (!actor?.userId) throw fail.auth();
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;

export function requireUuid(value: unknown, code = "invalid_id"): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) throw fail.validation(code);
  return value;
}

export function optionalUuid(value: unknown, code = "invalid_id"): string | null {
  if (value == null || value === "") return null;
  return requireUuid(value, code);
}

export function requireReason(value: unknown, min = 5): string {
  const reason = String(value ?? "").trim();
  if (reason.length < min) throw fail.validation("reason_required", { min });
  return reason.slice(0, 1000);
}

/** A date the admin typed in their chosen calendar → canonical ISO (M-027). Empty → null. */
export function calendarDate(value: unknown, calendar: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cal: CalendarId = isCalendarId(calendar) ? calendar : "gregory";
  return dateFromCalendar(raw, cal);
}

export function requireCalendar(value: unknown): CalendarId {
  if (!isCalendarId(value)) throw fail.validation("invalid_calendar");
  return value;
}

/** Cleans a `{ "fa-IR": "…", "en-US": "…" }` map: valid BCP 47 keys, trimmed, empties dropped. */
export function translationsMap(input: unknown, maxLength = 2000): Record<string, string> {
  if (input == null) return {};
  if (typeof input !== "object" || Array.isArray(input)) throw fail.validation("invalid_translations");
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!LOCALE_RE.test(k)) throw fail.validation("invalid_locale", { locale: k });
    const s = String(v ?? "").trim();
    if (s) out[k] = s.slice(0, maxLength);
  }
  return out;
}

export function intIn(value: unknown, min: number, max: number, code: string): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(n) || n < min || n > max) throw fail.validation(code, { min, max });
  return n;
}

export function numberIn(value: unknown, min: number, max: number, code: string): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(n) || n < min || n > max) throw fail.validation(code, { min, max });
  return n;
}
