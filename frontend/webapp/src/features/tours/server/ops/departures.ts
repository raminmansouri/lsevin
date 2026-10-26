import "server-only";

import db from "@/config/database/db";

import { isIsoDate } from "../../domain/calendar";
import { refundQuote } from "../../domain/cancellation";
import { authorizeTour } from "../platform/authoring";
import { fail, logUnexpected, mapDbError } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import type { NoticeInput } from "./contract";
import { auditOps, authorizeDeparture, iso, isoDateOf, requireUuid, scopeFor, type Tx } from "./common";
import { endTrackingTx } from "./live";
import { deliverNotice, insertNotice, SYSTEM_NOTICE_TEXTS, validateNoticeTexts } from "./notices";

/**
 * Departure operations for providers (V-031..V-045): capacity, block, delay,
 * operator cancellation with full refunds, booking lists.
 */

export type NoticeTexts = { sourceLocale: string; texts: Record<string, { title: string; body: string }> };

export type ProviderDepartureRow = {
  id: string; tourId: string; tourSlug: string; tourTitle: string | null; optionId: string | null;
  localDate: string; localTime: string | null; startsAt: string; endsAt: string | null; timezone: string;
  capacity: number; booked: number; held: number; remaining: number; status: string; delayMinutes: number;
  isBlocked: boolean; minToOperate: number | null; meetingOverride: unknown; statusReason: string | null;
  checkedInSeats: number;
  assignments: { id: string; guideId: string | null; resourceId: string | null; role: string; status: string; name: string | null }[];
};

export async function listProviderDepartures(actor: Actor, serviceProviderId: string, filters: { tourId?: string | null; from?: string | null; to?: string | null } = {}): Promise<ProviderDepartureRow[]> {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "viewer");
  if (filters.tourId) requireUuid(filters.tourId, "tour_not_found");
  if (filters.from && !isIsoDate(filters.from)) throw fail.validation("invalid_date");
  if (filters.to && !isIsoDate(filters.to)) throw fail.validation("invalid_date");
  const rows = await db<any[]>`
    select d.id::text, d.tour_id::text, t.slug, d.option_id::text, d.starts_on, d.local_start_time::text, d.starts_at, d.ends_at, d.timezone,
           d.capacity, d.booked_count, d.held_count, d.status, d.delay_minutes, d.is_blocked, d.min_to_operate, d.meeting_override, d.status_reason,
           (select coalesce(c.published_value, c.draft_value) from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select coalesce(sum(ci.seats), 0)::int from tour.checkins ci where ci.departure_id = d.id and ci.result = 'accepted') as checked_in,
           coalesce((select json_agg(json_build_object('id', a.id, 'guideId', a.guide_id, 'resourceId', a.resource_id, 'role', a.role,
                                                       'status', a.status, 'name', coalesce(g.display_name, r.name)) order by a.assigned_at)
                       from tour.departure_assignments a
                       left join tour.guides g on g.id = a.guide_id
                       left join tour.resources r on r.id = a.resource_id
                      where a.departure_id = d.id and a.status in ('assigned','accepted')), '[]') as assignments
      from tour.departures d join tour.tours t on t.id = d.tour_id
     where t.service_provider_id = ${serviceProviderId}::uuid
       and (${filters.tourId ?? null}::uuid is null or d.tour_id = ${filters.tourId ?? null}::uuid)
       and (${filters.from ?? null}::date is null or d.starts_on >= ${filters.from ?? null}::date)
       and (${filters.to ?? null}::date is null or d.starts_on <= ${filters.to ?? null}::date)
       and (${filters.from ?? null}::date is not null or d.starts_at > now() - interval '7 days')
     order by d.starts_at
     limit 500`;
  return rows.map((d) => ({
    id: d.id, tourId: d.tour_id, tourSlug: d.slug, tourTitle: d.title ?? null, optionId: d.option_id,
    localDate: isoDateOf(d.starts_on), localTime: d.local_start_time ? String(d.local_start_time).slice(0, 5) : null,
    startsAt: iso(d.starts_at)!, endsAt: iso(d.ends_at), timezone: d.timezone,
    capacity: d.capacity, booked: d.booked_count, held: d.held_count, remaining: Math.max(0, d.capacity - d.booked_count - d.held_count),
    status: d.status, delayMinutes: d.delay_minutes, isBlocked: d.is_blocked, minToOperate: d.min_to_operate,
    meetingOverride: d.meeting_override ?? null, statusReason: d.status_reason ?? null, checkedInSeats: d.checked_in,
    assignments: d.assignments,
  }));
}

export type DepartureUpdate = {
  capacity?: number;
  block?: boolean;
  minToOperate?: number | null;
  meetingOverride?: { lat: number; lng: number; note?: string | null } | null;
};

export async function updateDeparture(actor: Actor, departureId: string, patch: DepartureUpdate): Promise<void> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "manager" });
  if (patch.capacity !== undefined && !(Number.isInteger(patch.capacity) && patch.capacity >= 1 && patch.capacity <= 10_000)) throw fail.validation("invalid_capacity");
  if (patch.minToOperate != null && !(Number.isInteger(patch.minToOperate) && patch.minToOperate >= 1 && patch.minToOperate <= 10_000)) throw fail.validation("invalid_min_to_operate");
  const mo = patch.meetingOverride;
  if (mo) {
    if (!(Number.isFinite(mo.lat) && Number.isFinite(mo.lng) && mo.lat >= -90 && mo.lat <= 90 && mo.lng >= -180 && mo.lng <= 180)) throw fail.validation("invalid_coordinates");
    if (mo.note != null && String(mo.note).length > 500) throw fail.validation("note_too_long");
  }
  try {
    await db.begin(async (tx) => {
      const [d] = await tx<any[]>`select capacity, booked_count, held_count, status from tour.departures where id = ${departureId}::uuid for update`;
      if (d.status === "cancelled" || d.status === "completed") throw fail.conflict("departure_not_editable");
      if (patch.capacity !== undefined && patch.capacity < d.booked_count + d.held_count) {
        throw fail.conflict("capacity_below_booked", { booked: d.booked_count, held: d.held_count });
      }
      const values: Record<string, unknown> = {};
      if (patch.capacity !== undefined) values.capacity = patch.capacity;
      if (patch.block !== undefined) { values.is_blocked = Boolean(patch.block); values.status_reason = patch.block ? "blocked_by_provider" : null; }
      if (patch.minToOperate !== undefined) values.min_to_operate = patch.minToOperate;
      if (patch.meetingOverride !== undefined) {
        values.meeting_override = mo ? db.json({ lat: mo.lat, lng: mo.lng, note: mo.note ?? null } as never) : null;
      }
      if (Object.keys(values).length === 0) return;
      await tx`update tour.departures set ${tx(values as never)}, last_modified_date = now() where id = ${departureId}::uuid`;
      await auditOps(tx as unknown as Tx, actor, access.scope, access.dep.serviceProviderId, "departure", departureId, "departure_updated",
        { fields: Object.keys(values), capacity: patch.capacity ?? null, block: patch.block ?? null });
    });
  } catch (e) {
    throw mapDbError(e, "updateDeparture");
  }
}

export async function delayDeparture(actor: Actor, departureId: string, minutes: number, notice: NoticeTexts): Promise<{ notified: number; fellBack: number }> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "manager" });
  if (!(Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440)) throw fail.validation("invalid_delay_minutes");
  validateNoticeTexts(notice.sourceLocale, notice.texts);
  const { dep } = access;
  let noticeId: string;
  try {
    noticeId = await db.begin(async (tx) => {
      const [d] = await tx<any[]>`select status from tour.departures where id = ${departureId}::uuid for update`;
      if (["cancelled", "completed"].includes(d.status)) throw fail.conflict("departure_not_operating");
      await tx`update tour.departures set status = case when status = 'in_progress' then status else 'delayed' end,
                      delay_minutes = ${minutes}, last_modified_date = now() where id = ${departureId}::uuid`;
      await tx`insert into tour.milestones (departure_id, kind, delay_minutes, created_by) values (${departureId}::uuid, 'delayed', ${minutes}, ${actor.userId}::uuid)`;
      const input: NoticeInput = {
        departureId, kind: "delay", effectiveAt: new Date(dep.startsAt.getTime() + minutes * 60_000).toISOString(),
        sourceLocale: notice.sourceLocale, texts: notice.texts, payload: { delayMinutes: minutes },
      };
      const id = await insertNotice(tx as unknown as Tx, actor.userId!, input);
      await auditOps(tx as unknown as Tx, actor, access.scope, dep.serviceProviderId, "departure", departureId, "departure_delayed", { minutes, noticeId: id });
      return id;
    });
  } catch (e) {
    throw mapDbError(e, "delayDeparture");
  }
  const r = await deliverNotice(noticeId);
  return { notified: r.recipients, fellBack: r.fellBack };
}

/**
 * Operator cancellation: every live booking is closed through
 * tour.close_booking (seats back to inventory exactly once), quoted a full
 * operator-cancel refund, and — when money was captured — handed to the
 * platform refund workflow. Then the notice goes to exactly those travelers.
 */
export async function cancelDeparture(actor: Actor, departureId: string, reasonCode: string, notice: NoticeTexts): Promise<{ notified: number; cancelledBookings: number; refundRequests: number }> {
  const access = await authorizeDeparture(actor, departureId, { minimum: "manager" });
  if (!/^[a-z0-9_]{2,60}$/.test(String(reasonCode ?? ""))) throw fail.validation("invalid_reason_code");
  validateNoticeTexts(notice.sourceLocale, notice.texts);
  const settings = await getTourSettings();
  const { dep } = access;
  let result: { noticeId: string; closed: { bookingId: string; userId: string; paid: number; currency: string; refund: ReturnType<typeof refundQuote> }[] };
  try {
    result = await db.begin(async (tx) => {
      const q = tx as unknown as Tx;
      const [d] = await q<any[]>`select status, starts_at from tour.departures where id = ${departureId}::uuid for update`;
      if (d.status === "cancelled") throw fail.conflict("already_cancelled");
      if (d.status === "completed") throw fail.conflict("departure_not_operating");
      const live = await q<any[]>`
        select tb.booking_id::text, tb.user_id::text, tb.currency_code, coalesce(bb.paid_amount, 0) as paid_amount
          from tour.bookings tb join booking.bookings bb on bb.id = tb.booking_id
         where tb.departure_id = ${departureId}::uuid and tb.status in ('pending_payment','requested','confirmed')
         for update of tb`;
      const closed: { bookingId: string; userId: string; paid: number; currency: string; refund: ReturnType<typeof refundQuote> }[] = [];
      for (const b of live) {
        const [cur] = await q<{ d: number }[]>`select decimal_digits as d from finance.currencies where code = ${b.currency_code}`;
        const refund = refundQuote({ rules: [], departureAt: new Date(d.starts_at), now: new Date(), paidAmount: Number(b.paid_amount), currencyDecimals: cur ? Number(cur.d) : 2, operatorCancelled: true });
        const [r] = await q<{ n: number }[]>`select tour.close_booking(${b.booking_id}::uuid, 'cancelled', ${`operator_cancelled:${reasonCode}`}) as n`;
        await q`update tour.bookings set refund_quote = ${db.json(refund as never)} where booking_id = ${b.booking_id}::uuid`;
        await q`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${b.booking_id}::uuid`;
        await q`update booking.payments set status = 'Cancelled', updated_at = now() where booking_id = ${b.booking_id}::uuid and status = 'Pending'`;
        await q`insert into tour.booking_events (booking_id, event_type, dedupe_key, payload, actor_user_id)
                values (${b.booking_id}::uuid, 'cancelled', ${`cancelled:${b.booking_id}`}, ${db.json({ by: "operator", reasonCode, refund } as never)}, ${actor.userId}::uuid)
                on conflict (dedupe_key) do nothing`;
        if (r.n >= 0) closed.push({ bookingId: b.booking_id, userId: b.user_id, paid: Number(b.paid_amount), currency: b.currency_code, refund });
      }
      // Seats held by checkouts in progress go back too; those customers see the departure as unavailable.
      const released = await q<any[]>`
        update tour.holds set status = 'released', closed_at = now()
         where departure_id = ${departureId}::uuid and status = 'active' returning seats`;
      const heldBack = released.reduce((a, h) => a + Number(h.seats), 0);
      await q`update tour.departures set status = 'cancelled', status_reason = ${reasonCode}, held_count = greatest(held_count - ${heldBack}, 0),
                     last_modified_date = now() where id = ${departureId}::uuid`;
      await endTrackingTx(q, departureId, "cancelled", Number(settings.trackingRetentionDays ?? 30));
      await q`update tour.waitlist set status = 'cancelled' where departure_id = ${departureId}::uuid and status in ('waiting','offered')`;
      await q`update tour.departure_assignments set status = 'revoked' where departure_id = ${departureId}::uuid and status in ('assigned','accepted')`;
      const noticeId = await insertNotice(q, actor.userId!, {
        departureId, kind: "cancellation", reasonCode, effectiveAt: new Date().toISOString(),
        sourceLocale: notice.sourceLocale, texts: notice.texts, payload: { refundPercent: 100 },
      });
      await auditOps(q, actor, access.scope, dep.serviceProviderId, "departure", departureId, "departure_cancelled",
        { reasonCode, bookings: closed.length, noticeId });
      return { noticeId, closed };
    });
  } catch (e) {
    throw mapDbError(e, "cancelDeparture");
  }

  // Money side after commit: the platform refund workflow (admin-approved).
  let refundRequests = 0;
  const { requestBookingRefund } = await import("@/features/refunds/server/repository");
  for (const b of result.closed) {
    if (b.paid <= 0) continue;
    const res = await requestBookingRefund({
      bookingId: b.bookingId, userId: b.userId, reason: "tour_operator_cancellation",
      customerNote: `Operator cancelled the departure (${reasonCode}): full refund ${b.refund.refundAmount} ${b.currency}`, refundScope: "full",
    }).catch((e) => { logUnexpected("cancelDeparture.requestBookingRefund", e); return null; });
    if (res?.refundRequestId) refundRequests += 1;
  }
  const delivered = await deliverNotice(result.noticeId, { bookingIds: result.closed.map((c) => c.bookingId) });
  return { notified: delivered.recipients, cancelledBookings: result.closed.length, refundRequests };
}

export type ProviderBookingRow = {
  bookingId: string; voucherCode: string; status: string; seats: number; travelers: unknown;
  currency: string; totalAmount: number; paidAmount: number; paymentStatus: string;
  tourId: string; tourTitle: string | null; departureId: string; startsAt: string; timezone: string;
  leadName: string; buyerPhone: string | null; assistanceCount: number; checkedIn: boolean;
  createdAt: string; requestExpiresAt: string | null; cancelledAt: string | null;
};

export async function listProviderBookings(actor: Actor, filters: { serviceProviderId: string; status?: string | null; departureId?: string | null; from?: string | null; to?: string | null }): Promise<ProviderBookingRow[]> {
  requireUuid(filters.serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, filters.serviceProviderId, "staff");
  if (filters.departureId) requireUuid(filters.departureId, "departure_not_found");
  if (filters.from && !isIsoDate(filters.from)) throw fail.validation("invalid_date");
  if (filters.to && !isIsoDate(filters.to)) throw fail.validation("invalid_date");
  const statuses = ["pending_payment", "requested", "confirmed", "declined", "cancelled", "completed", "no_show", "expired"];
  if (filters.status && !statuses.includes(filters.status)) throw fail.validation("invalid_status");
  const rows = await db<any[]>`
    select tb.booking_id::text, tb.voucher_code, tb.status, tb.seats, tb.travelers, tb.currency_code, tb.total_amount,
           coalesce(bb.paid_amount, 0) as paid_amount, bb.payment_status, tb.tour_id::text, tb.content_snapshot, tb.departure_id::text,
           d.starts_at, d.timezone, tb.buyer, tb.created_at, tb.request_expires_at, tb.cancelled_at,
           (select p.first_name || ' ' || p.last_name from tour.booking_participants p where p.booking_id = tb.booking_id order by p.position limit 1) as lead,
           (select count(*)::int from tour.booking_participants p where p.booking_id = tb.booking_id and p.assistance_request is not null) as assistance,
           exists (select 1 from tour.checkins c where c.booking_id = tb.booking_id and c.result = 'accepted') as checked_in
      from tour.bookings tb
      join tour.departures d on d.id = tb.departure_id
      join booking.bookings bb on bb.id = tb.booking_id
     where tb.service_provider_id = ${filters.serviceProviderId}::uuid
       and (${filters.status ?? null}::text is null or tb.status = ${filters.status ?? null})
       and (${filters.departureId ?? null}::uuid is null or tb.departure_id = ${filters.departureId ?? null}::uuid)
       and (${filters.from ?? null}::date is null or d.starts_on >= ${filters.from ?? null}::date)
       and (${filters.to ?? null}::date is null or d.starts_on <= ${filters.to ?? null}::date)
     order by d.starts_at desc, tb.created_at desc
     limit 500`;
  return rows.map((r) => ({
    bookingId: r.booking_id, voucherCode: r.voucher_code, status: r.status, seats: r.seats, travelers: r.travelers,
    currency: r.currency_code, totalAmount: Number(r.total_amount), paidAmount: Number(r.paid_amount), paymentStatus: r.payment_status,
    tourId: r.tour_id, tourTitle: r.content_snapshot?.title?.value ?? null, departureId: r.departure_id,
    startsAt: iso(r.starts_at)!, timezone: r.timezone,
    leadName: r.lead ?? `${r.buyer?.firstName ?? ""} ${r.buyer?.lastName ?? ""}`.trim(),
    buyerPhone: r.buyer?.phone ?? null, assistanceCount: r.assistance, checkedIn: Boolean(r.checked_in),
    createdAt: iso(r.created_at)!, requestExpiresAt: iso(r.request_expires_at), cancelledAt: iso(r.cancelled_at),
  }));
}

/**
 * C-056 / V-021: a material itinerary change notifies every traveler with a
 * live booking on a future departure. One notice per departure per revision.
 */
export async function notifyItineraryChange(actor: Actor, tourId: string, revision: number): Promise<{ notices: number; recipients: number }> {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!Number.isInteger(revision) || revision < 1) throw fail.validation("invalid_revision");
  const [rev] = await db<any[]>`select material_change from tour.revisions where tour_id = ${tourId}::uuid and revision = ${revision}`;
  if (!rev) throw fail.notFound("revision_not_found");
  if (!rev.material_change) return { notices: 0, recipients: 0 };
  const deps = await db<any[]>`
    select d.id::text from tour.departures d
     where d.tour_id = ${tourId}::uuid and d.starts_at > now() and d.status <> 'cancelled'
       and exists (select 1 from tour.bookings tb where tb.departure_id = d.id and tb.status in ('confirmed','pending_payment','requested'))
       and not exists (select 1 from tour.notices n where n.departure_id = d.id and n.kind = 'itinerary_change' and n.payload->>'revision' = ${String(revision)})`;
  let notices = 0;
  let recipients = 0;
  for (const d of deps) {
    const id = await db.begin(async (tx) => {
      const nid = await insertNotice(tx as unknown as Tx, actor.userId!, {
        departureId: d.id, kind: "itinerary_change", effectiveAt: new Date().toISOString(), sourceLocale: "en-US",
        texts: SYSTEM_NOTICE_TEXTS.itinerary_change, payload: { revision },
      });
      await auditOps(tx as unknown as Tx, actor, scopeFor(actor, owner.serviceProviderId), owner.serviceProviderId, "notice", nid, "itinerary_change_notice", { tourId, revision, departureId: d.id });
      return nid;
    });
    notices += 1;
    recipients += (await deliverNotice(id)).recipients;
  }
  return { notices, recipients };
}
