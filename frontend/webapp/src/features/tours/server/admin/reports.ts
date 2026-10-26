import "server-only";

import db from "@/config/database/db";

import { isoToParts, isValidTimeZone, type CalendarId } from "../../domain/calendar";
import { audit } from "../platform/booking";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { toCsv } from "./csv";
import { assertAdminActor, calendarDate, optionalUuid, requireCalendar } from "./guard";

/**
 * Operational KPIs (M-021) and exports (M-022). Every figure is computed from
 * canonical values (ISO dates, instants, amounts per currency) — the selected
 * calendar and timezone only change how dates are labelled, never what is counted.
 * Amounts are never summed across currencies.
 */
export type ReportRange = { from: string; to: string; calendar: CalendarId; timezone: string; providerId: string | null };

export function parseRange(input: { from?: string; to?: string; calendar?: string; timezone?: string; providerId?: string }): ReportRange {
  const calendar = requireCalendar(input.calendar ?? "gregory");
  const timezone = input.timezone && isValidTimeZone(input.timezone) ? input.timezone : "Asia/Tehran";
  if (input.timezone && !isValidTimeZone(input.timezone)) throw fail.validation("invalid_timezone");
  const today = new Date().toISOString().slice(0, 10);
  const from = calendarDate(input.from, calendar) ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const to = calendarDate(input.to, calendar) ?? today;
  if (to < from) throw fail.validation("invalid_range");
  return { from, to, calendar, timezone, providerId: optionalUuid(input.providerId, "provider_not_found") };
}

export async function kpis(actor: Actor, r: ReportRange) {
  assertAdminActor(actor);
  const [k] = await db<any[]>`
    with b as (
      select tb.*, bb.paid_amount, bb.payment_status from tour.bookings tb join booking.bookings bb on bb.id = tb.booking_id
       where (tb.created_at at time zone ${r.timezone})::date between ${r.from}::date and ${r.to}::date
         and (${r.providerId}::uuid is null or tb.service_provider_id = ${r.providerId}::uuid)
    ), d as (
      select * from tour.departures where tour_id is not null and starts_on between ${r.from}::date and ${r.to}::date
         and (${r.providerId}::uuid is null or service_provider_id = ${r.providerId}::uuid)
    ), h as (
      select h.* from tour.holds h join tour.departures dd on dd.id = h.departure_id
       where (h.created_at at time zone ${r.timezone})::date between ${r.from}::date and ${r.to}::date
         and (${r.providerId}::uuid is null or dd.service_provider_id = ${r.providerId}::uuid)
    )
    select
      (select count(*)::int from b) as bookings,
      coalesce((select json_object_agg(status, n) from (select status, count(*)::int as n from b group by status) x), '{}') as by_status,
      (select count(*)::int from b where status in ('cancelled','declined','expired')) as cancelled,
      (select count(*)::int from h) as holds,
      (select count(*)::int from h where status = 'converted') as converted_holds,
      (select coalesce(sum(booked_count), 0)::int from d where status <> 'cancelled') as seats_booked,
      (select coalesce(sum(capacity), 0)::int from d where status <> 'cancelled') as seats_offered,
      (select count(*)::int from d) as departures,
      (select count(*)::int from d where status = 'cancelled') as departures_cancelled,
      (select count(*)::int from d where status in ('in_progress','completed')) as departures_operated,
      (select count(*)::int from d where status in ('in_progress','completed') and delay_minutes = 0) as departures_on_time,
      coalesce((select json_agg(json_build_object('currency', currency_code, 'booked', booked, 'paid', paid, 'refundQuoted', refunded))
                  from (select currency_code, sum(total_amount) filter (where status in ('confirmed','completed','no_show')) as booked,
                               sum(coalesce(paid_amount, 0)) as paid,
                               sum(coalesce((refund_quote->>'refundAmount')::numeric, 0)) as refunded
                          from b group by currency_code) y), '[]') as revenue,
      coalesce((select json_object_agg(status, n) from (
                  select rr.status, count(*)::int as n from commercial.refund_requests rr join b on b.booking_id = rr.booking_id group by rr.status) z), '{}') as refunds,
      (select avg(extract(epoch from (a.created_at - b.created_at)) / 3600.0)
         from b join tour.audit_log a on a.entity_id = b.booking_id and a.action in ('request_accepted','request_declined')
        where b.confirmation_mode = 'request') as supplier_response_hours
  `;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);
  return {
    range: r,
    bookings: k.bookings as number,
    byStatus: k.by_status as Record<string, number>,
    cancellationRate: pct(k.cancelled, k.bookings),
    conversion: { holds: k.holds as number, converted: k.converted_holds as number, rate: pct(k.converted_holds, k.holds) },
    utilization: { booked: k.seats_booked as number, offered: k.seats_offered as number, rate: pct(k.seats_booked, k.seats_offered) },
    departures: { total: k.departures as number, cancelled: k.departures_cancelled as number, operated: k.departures_operated as number, onTimeRate: pct(k.departures_on_time, k.departures_operated) },
    revenue: (k.revenue as any[]).map((x) => ({ currency: x.currency, booked: Number(x.booked ?? 0), paid: Number(x.paid ?? 0), refundQuoted: Number(x.refundQuoted ?? 0) })),
    refunds: k.refunds as Record<string, number>,
    supplierResponseHours: k.supplier_response_hours == null ? null : Math.round(Number(k.supplier_response_hours) * 10) / 10,
  };
}

/** Calendar date as zero-padded numbers in the chosen calendar (unambiguous, sortable within that calendar). */
export function calendarDateLabel(iso: string, calendar: CalendarId): string {
  const p = isoToParts(iso, calendar);
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function localInstant(instant: Date, timeZone: string): string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(f.formatToParts(instant).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/** Bookings export: explicit currency, calendar and timezone columns, ISO date beside the calendar date. No personal data (S-038). */
export async function bookingsCsv(actor: Actor, r: ReportRange): Promise<{ filename: string; body: string; rows: number }> {
  assertAdminActor(actor);
  const rows = await db<any[]>`
    select tb.booking_id::text, tb.voucher_code, tb.status, bb.payment_status, tb.seats, tb.currency_code, tb.total_amount, bb.paid_amount,
           tb.commission_percent, t.slug, coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider,
           d.starts_on::text as local_date, d.local_start_time::text, d.timezone, d.starts_at, tb.created_at,
           (select rr.status from commercial.refund_requests rr where rr.booking_id = tb.booking_id order by rr.created_at desc limit 1) as refund_state,
           (select string_agg(distinct pl.entry_type || ':' || pl.status, ' ') from commercial.provider_ledgers pl where pl.booking_id = tb.booking_id) as payout_state
      from tour.bookings tb
      join booking.bookings bb on bb.id = tb.booking_id
      join tour.departures d on d.id = tb.departure_id
      join tour.tours t on t.id = tb.tour_id
      join category.service_providers sp on sp.id = tb.service_provider_id
     where d.starts_on between ${r.from}::date and ${r.to}::date
       and (${r.providerId}::uuid is null or tb.service_provider_id = ${r.providerId}::uuid)
     order by d.starts_at, tb.created_at
     limit 50000`;
  const header = [
    "booking_id", "voucher", "status", "payment_status", "refund_state", "payout_state", "tour_slug", "provider",
    "departure_date_iso", `departure_date_${r.calendar}`, "calendar", "departure_local_time", "tour_timezone", "departure_instant_utc",
    "booked_at_report_tz", "report_timezone", "seats", "currency", "total_amount", "paid_amount", "commission_percent",
  ];
  const data = rows.map((x) => [
    x.booking_id, x.voucher_code, x.status, x.payment_status, x.refund_state ?? "", x.payout_state ?? "", x.slug, x.provider,
    x.local_date, calendarDateLabel(x.local_date, r.calendar), r.calendar, x.local_start_time ? String(x.local_start_time).slice(0, 5) : "",
    x.timezone, new Date(x.starts_at).toISOString(), localInstant(new Date(x.created_at), r.timezone), r.timezone, x.seats as number,
    x.currency_code, Number(x.total_amount), Number(x.paid_amount ?? 0), x.commission_percent == null ? null : Number(x.commission_percent),
  ]);
  await audit(db, actor, r.providerId, "report", null, "bookings_exported", { from: r.from, to: r.to, calendar: r.calendar, timezone: r.timezone, rows: data.length });
  return { filename: `tour-bookings_${r.from}_${r.to}_${r.calendar}.csv`, body: toCsv(header, data), rows: data.length };
}
