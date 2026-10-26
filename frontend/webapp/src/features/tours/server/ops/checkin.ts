import "server-only";

import db from "@/config/database/db";

import { maskContact } from "../../domain/text";
import { fail, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import type { ManifestRow, ScanResult } from "./contract";
import { auditOps, authorizeDeparture, iso, isStaffAccess, type DepartureAccess, type Tx } from "./common";

/**
 * Check-in (V-039, AT-18). The token is a booking's qr_token or voucher code.
 * Every scan is recorded in tour.checkins; the partial unique index
 * ux_checkins_one_accept guarantees one 'accepted' row per booking no matter
 * how many devices scan concurrently or replay an offline queue, and
 * client_event_id makes a replayed scan return its original result.
 */

export type ScanInput = { departureId: string; token: string; clientEventId: string; scannedAt: string; deviceId?: string | null };

const EVENT_ID_RE = /^[A-Za-z0-9_.:-]{8,100}$/;
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

function validateScan(input: ScanInput): Date {
  if (!EVENT_ID_RE.test(String(input.clientEventId ?? ""))) throw fail.validation("invalid_client_event_id");
  const token = String(input.token ?? "").trim();
  if (token.length < 4 || token.length > 200) throw fail.validation("invalid_token");
  const at = new Date(String(input.scannedAt));
  if (Number.isNaN(at.getTime())) throw fail.validation("invalid_scanned_at");
  if (at.getTime() - Date.now() > MAX_FUTURE_SKEW_MS) throw fail.validation("scanned_at_in_future");
  if (input.deviceId != null && String(input.deviceId).length > 100) throw fail.validation("invalid_device_id");
  return at;
}

async function resultForEvent(q: Tx, clientEventId: string, departureId: string): Promise<ScanResult | null> {
  const [c] = await q<any[]>`
    select c.result, c.booking_id::text, c.seats, c.departure_id::text, b.departure_id::text as booking_departure,
           (select scanned_at from tour.checkins a where a.booking_id = c.booking_id and a.result = 'accepted') as accepted_at,
           (select p.first_name || ' ' || p.last_name from tour.booking_participants p where p.booking_id = c.booking_id order by p.position limit 1) as lead
      from tour.checkins c left join tour.bookings b on b.booking_id = c.booking_id
     where c.client_event_id = ${clientEventId}`;
  if (!c) return null;
  // The same client event id reused for another departure is a client bug, not a replay.
  if (c.departure_id !== departureId) throw fail.conflict("client_event_id_reused");
  const sameDeparture = c.booking_departure === departureId;
  return {
    result: c.result, bookingId: sameDeparture ? c.booking_id : null, seats: c.seats,
    leadTraveler: sameDeparture ? c.lead ?? null : null, checkedInAt: sameDeparture ? iso(c.accepted_at) : null,
  };
}

async function scanAuthorized(actor: Actor, access: DepartureAccess, input: ScanInput): Promise<ScanResult> {
  const scannedAt = validateScan(input);
  const token = String(input.token).trim();
  const departureId = access.dep.id;
  try {
    const replay = await resultForEvent(db, input.clientEventId, departureId);
    if (replay) return replay;

    return await db.begin(async (tx) => {
      const q = tx as unknown as Tx;
      const [b] = await q<any[]>`
        select tb.booking_id::text, tb.departure_id::text, tb.status, tb.seats, tb.service_provider_id::text,
               (select p.first_name || ' ' || p.last_name from tour.booking_participants p where p.booking_id = tb.booking_id order by p.position limit 1) as lead
          from tour.bookings tb
         where tb.qr_token = ${token} or tb.voucher_code = ${token.toUpperCase()}
         limit 1`;
      let result: ScanResult["result"];
      if (!b) result = "invalid";
      else if (b.departure_id !== departureId) result = "wrong_departure";
      else if (["cancelled", "declined", "expired", "no_show"].includes(b.status)) result = "cancelled_booking";
      else if (!["confirmed", "completed"].includes(b.status)) result = "invalid"; // unpaid / unanswered request: not a ticket
      else result = "accepted";

      const bookingId = b ? b.booking_id : null;
      const ownDeparture = b && b.departure_id === departureId;
      const insert = (r: ScanResult["result"], seats: number) => q<any[]>`
        insert into tour.checkins (departure_id, booking_id, scanned_token, result, seats, scanned_by, device_id, client_event_id, scanned_at)
        values (${departureId}::uuid, ${ownDeparture ? bookingId : null}::uuid, ${token.slice(0, 200)}, ${r}, ${seats}, ${actor.userId}::uuid,
                ${input.deviceId ?? null}, ${input.clientEventId}, ${scannedAt})
        on conflict do nothing
        returning id::text, result`;

      let rows: any[] = [];
      if (result === "accepted") {
        rows = await insert("accepted", b.seats);
        if (rows.length === 0) {
          // Either this ticket was already accepted (partial unique index) or this
          // client event raced with itself; the latter returns the original.
          const again = await resultForEvent(q, input.clientEventId, departureId);
          if (again) return again;
          result = "duplicate";
          rows = await insert("duplicate", 0);
        }
      } else {
        rows = await insert(result, 0);
      }
      if (rows.length === 0) {
        const again = await resultForEvent(q, input.clientEventId, departureId);
        if (again) return again;
        throw fail.conflict("scan_not_recorded");
      }
      if (result === "accepted") {
        await auditOps(q, actor, access.scope, access.dep.serviceProviderId, "checkin", rows[0].id, "checked_in", { bookingId, departureId });
      }
      const [acc] = ownDeparture
        ? await q<any[]>`select scanned_at from tour.checkins where booking_id = ${bookingId}::uuid and result = 'accepted'`
        : [];
      return {
        result,
        bookingId: ownDeparture ? bookingId : null,
        seats: result === "accepted" ? b.seats : 0,
        leadTraveler: ownDeparture ? b.lead ?? null : null,
        checkedInAt: acc ? iso(acc.scanned_at) : null,
      };
    });
  } catch (e) {
    throw mapDbError(e, "scanTicket");
  }
}

export async function scanTicket(actor: Actor, input: ScanInput): Promise<ScanResult> {
  const access = await authorizeDeparture(actor, input.departureId, { minimum: "staff", allowGuide: true });
  return scanAuthorized(actor, access, input);
}

export type SyncEvent = Omit<ScanInput, "departureId">;
export type SyncResult = { clientEventId: string; ok: true; scan: ScanResult } | { clientEventId: string; ok: false; error: { kind: string; code: string } };

/** Offline queue replay: processed in scannedAt order, each event independently. */
export async function syncCheckins(actor: Actor, departureId: string, events: SyncEvent[]): Promise<SyncResult[]> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "staff", allowGuide: true });
  if (!Array.isArray(events)) throw fail.validation("invalid_events");
  if (events.length > 500) throw fail.validation("too_many_events");
  const ordered = [...events].sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime());
  const out: SyncResult[] = [];
  for (const ev of ordered) {
    try {
      out.push({ clientEventId: ev.clientEventId, ok: true, scan: await scanAuthorized(actor, access, { ...ev, departureId }) });
    } catch (e) {
      const err = mapDbError(e, "syncCheckins");
      out.push({ clientEventId: ev.clientEventId, ok: false, error: { kind: err.kind, code: err.code } });
    }
  }
  return out;
}

/**
 * Passenger list for staff and the assigned guide. Never id document numbers;
 * the buyer contact is masked for guides (C-109, S-038, S-044).
 */
export async function getManifest(actor: Actor, departureId: string): Promise<ManifestRow[]> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "staff", allowGuide: true });
  const staff = isStaffAccess(access);
  const rows = await db<any[]>`
    select tb.booking_id::text, tb.voucher_code, tb.status, tb.seats, tb.buyer,
           exists (select 1 from tour.checkins c where c.booking_id = tb.booking_id and c.result = 'accepted') as checked_in,
           coalesce((select json_agg(json_build_object('position', p.position, 'travelerClass', p.traveler_class, 'firstName', p.first_name,
                                                       'lastName', p.last_name, 'assistance', p.assistance_request) order by p.position)
                       from tour.booking_participants p where p.booking_id = tb.booking_id), '[]') as participants
      from tour.bookings tb
     where tb.departure_id = ${departureId}::uuid
       and tb.status in ('confirmed','completed','no_show','pending_payment','requested')
     order by tb.created_at`;
  return rows.map((r) => {
    const participants = (r.participants as any[]).map((p) => ({
      position: p.position, travelerClass: p.travelerClass, firstName: p.firstName, lastName: p.lastName,
      // Need-to-know only: the assigned guide and provider staff of this departure (both authorized above).
      assistance: p.assistance ?? null,
    }));
    const lead = participants[0];
    const phone = r.buyer?.phone ? String(r.buyer.phone) : null;
    return {
      bookingId: r.booking_id, voucherCode: r.voucher_code, status: r.status, seats: r.seats,
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : `${r.buyer?.firstName ?? ""} ${r.buyer?.lastName ?? ""}`.trim(),
      participants, checkedIn: Boolean(r.checked_in),
      contact: phone ? (staff ? phone : maskContact(phone)) : null,
    };
  });
}

/** Check-in totals for the scanner header. */
export async function checkinSummary(actor: Actor, departureId: string) {
  await authorizeDeparture(actor, departureId, { minimum: "staff", allowGuide: true });
  const [r] = await db<any[]>`
    select coalesce(sum(tb.seats) filter (where tb.status in ('confirmed','completed')), 0)::int as expected,
           coalesce(sum(c.seats), 0)::int as checked_in
      from tour.bookings tb
      left join tour.checkins c on c.booking_id = tb.booking_id and c.result = 'accepted'
     where tb.departure_id = ${departureId}::uuid`;
  return { expectedSeats: r.expected as number, checkedInSeats: r.checked_in as number };
}
