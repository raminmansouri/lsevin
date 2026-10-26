import "server-only";

import db from "@/config/database/db";

import { audit } from "../platform/booking";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { assertAdminActor, requireReason, requireUuid } from "./guard";
import { maskedBuyer } from "./queries";

/**
 * Customer-support view of one tour booking (M-016, M-020).
 *
 * Least privilege: the default view masks contact details, initials-only
 * participant surnames, hides document digits and assistance text (S-038,
 * S-044). Revealing them requires a written reason and is recorded in
 * tour.audit_log ("pii_revealed") with the reason and the admin's id.
 * There is no account impersonation.
 */
export async function supportBooking(actor: Actor, bookingId: string) {
  assertAdminActor(actor);
  requireUuid(bookingId, "booking_not_found");
  const [b] = await db<any[]>`
    select tb.booking_id::text, tb.voucher_code, tb.status, tb.seats, tb.travelers, tb.currency_code, tb.total_amount, tb.commission_percent,
           tb.price_snapshot, tb.policy_snapshot, tb.policy_locale, tb.policy_accepted_at, tb.ui_locale, tb.display_calendar, tb.buyer,
           tb.created_at, tb.confirmed_at, tb.cancelled_at, tb.cancel_reason, tb.refund_quote, tb.confirmation_mode, tb.option_id::text,
           tb.tour_id::text, t.slug, t.source_locale, tb.departure_id::text, d.starts_on::text, d.local_start_time::text, d.timezone, d.starts_at,
           d.status as departure_status, tb.service_provider_id::text,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name,
           bb.payment_status, bb.booking_status, bb.paid_amount, bb.payment_method,
           tb.content_snapshot
      from tour.bookings tb
      join tour.tours t on t.id = tb.tour_id
      join tour.departures d on d.id = tb.departure_id
      join booking.bookings bb on bb.id = tb.booking_id
      join category.service_providers sp on sp.id = tb.service_provider_id
     where tb.booking_id = ${bookingId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  const [participants, events, refunds, payouts, disputes, checkins, payments] = await Promise.all([
    db<any[]>`select position, traveler_class, first_name, last_name, nationality, age, (id_document_last4 is not null) as has_document,
                     (assistance_request is not null and btrim(assistance_request) <> '') as has_assistance
                from tour.booking_participants where booking_id = ${bookingId}::uuid order by position`,
    db<any[]>`select event_type, payload, created_at from tour.booking_events where booking_id = ${bookingId}::uuid order by created_at`,
    db<any[]>`select id::text, status, refund_scope, reason, admin_note, created_at from commercial.refund_requests where booking_id = ${bookingId}::uuid order by created_at desc`,
    db<any[]>`select entry_type, status, amount, currency_code, created_at from commercial.provider_ledgers where booking_id = ${bookingId}::uuid order by created_at`,
    db<any[]>`select id::text, kind, reason_code, status, amount, approval_level, required_level, created_at from tour.disputes where booking_id = ${bookingId}::uuid order by created_at desc`,
    db<any[]>`select result, seats, scanned_at from tour.checkins where booking_id = ${bookingId}::uuid order by scanned_at`,
    db<any[]>`select status, amount, currency, gateway, payment_method, created_at from booking.payments where booking_id = ${bookingId}::uuid order by created_at`,
  ]);
  const isoOf = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  return {
    bookingId: b.booking_id, voucher: b.voucher_code, status: b.status, seats: b.seats, travelers: b.travelers,
    currency: b.currency_code, total: Number(b.total_amount), commissionPercent: b.commission_percent == null ? null : Number(b.commission_percent),
    priceSnapshot: b.price_snapshot, policy: { version: b.policy_snapshot?.version ?? null, locale: b.policy_locale, acceptedAt: isoOf(b.policy_accepted_at), rules: b.policy_snapshot?.cancellationRules ?? [] },
    uiLocale: b.ui_locale, displayCalendar: b.display_calendar, createdAt: isoOf(b.created_at), confirmedAt: isoOf(b.confirmed_at),
    cancelledAt: isoOf(b.cancelled_at), cancelReason: b.cancel_reason, refundQuote: b.refund_quote, confirmationMode: b.confirmation_mode,
    tour: { id: b.tour_id, slug: b.slug, title: b.content_snapshot?.title?.value ?? null },
    departure: { id: b.departure_id, localDate: b.starts_on, localTime: b.local_start_time ? String(b.local_start_time).slice(0, 5) : null, timezone: b.timezone, startsAt: isoOf(b.starts_at), status: b.departure_status },
    provider: { id: b.service_provider_id, name: b.provider_name },
    payment: { status: b.payment_status, bookingStatus: b.booking_status, paid: Number(b.paid_amount ?? 0), method: b.payment_method },
    payments: payments.map((p) => ({ ...p, amount: Number(p.amount), created_at: isoOf(p.created_at) })),
    refunds: refunds.map((r) => ({ ...r, created_at: isoOf(r.created_at) })),
    payouts: payouts.map((p) => ({ ...p, amount: Number(p.amount), created_at: isoOf(p.created_at) })),
    disputes: disputes.map((d) => ({ ...d, amount: d.amount == null ? null : Number(d.amount), created_at: isoOf(d.created_at) })),
    checkins: checkins.map((c) => ({ ...c, scanned_at: isoOf(c.scanned_at) })),
    events: events.map((e) => ({ type: e.event_type, at: isoOf(e.created_at) })),
    buyer: maskedBuyer(b.buyer),
    participants: participants.map((p) => ({
      position: p.position, travelerClass: p.traveler_class, firstName: p.first_name, lastName: p.last_name ? `${String(p.last_name).slice(0, 1)}.` : "",
      nationality: p.nationality, age: p.age, hasDocument: p.has_document, hasAssistance: p.has_assistance,
    })),
  };
}

export type SupportBooking = Awaited<ReturnType<typeof supportBooking>>;

/** Unmasked contact + participant details, only with a recorded reason (M-020). */
export async function revealBookingContact(actor: Actor, input: { bookingId: string; reason: string }) {
  assertAdminActor(actor);
  const bookingId = requireUuid(input.bookingId, "booking_not_found");
  const reason = requireReason(input.reason, 10);
  return db.begin(async (tx) => {
    const [b] = await tx<any[]>`select buyer, service_provider_id::text from tour.bookings where booking_id = ${bookingId}::uuid`;
    if (!b) throw fail.notFound("booking_not_found");
    const participants = await tx<any[]>`
      select position, first_name, last_name, id_document_last4, assistance_request from tour.booking_participants
       where booking_id = ${bookingId}::uuid order by position`;
    await audit(tx as unknown as typeof db, actor, b.service_provider_id, "booking", bookingId, "pii_revealed", { reason, fields: ["buyer", "participants"] });
    return {
      buyer: { firstName: b.buyer?.firstName ?? "", lastName: b.buyer?.lastName ?? "", email: b.buyer?.email ?? null, phone: b.buyer?.phone ?? null },
      participants: participants.map((p) => ({
        position: p.position, firstName: p.first_name, lastName: p.last_name,
        documentLast4: p.id_document_last4 ?? null, assistance: p.assistance_request ?? null,
      })),
    };
  });
}

