import "server-only";

import db from "@/config/database/db";

import { isIsoDate } from "../../domain/calendar";
import { currencyDecimals } from "../platform/catalog";
import { fail } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import { requireUuid } from "./common";

/**
 * Provider reports (V-044/V-045, M-018). Aggregates only — no traveler PII and
 * no payment instrument data. Bookings are attributed to their departure date.
 */

export async function providerAnalytics(actor: Actor, serviceProviderId: string, range: { from: string; to: string }) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "manager");
  if (!isIsoDate(range.from) || !isIsoDate(range.to) || range.to < range.from) throw fail.validation("invalid_range");
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000;
  if (days > 366) throw fail.validation("range_too_long");

  const [occ] = await db<any[]>`
    select count(*)::int as departures, coalesce(sum(capacity), 0)::int as capacity, coalesce(sum(booked_count), 0)::int as booked,
           count(*) filter (where status = 'cancelled')::int as cancelled_departures
      from tour.departures
     where service_provider_id = ${serviceProviderId}::uuid and tour_id is not null
       and starts_on between ${range.from}::date and ${range.to}::date`;
  const byStatus = await db<any[]>`
    select tb.status, count(*)::int as n, coalesce(sum(tb.seats), 0)::int as seats
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.service_provider_id = ${serviceProviderId}::uuid and d.starts_on between ${range.from}::date and ${range.to}::date
     group by tb.status`;
  const revenue = await db<any[]>`
    select tb.currency_code, coalesce(sum(bb.paid_amount), 0)::numeric as paid, count(*)::int as bookings
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id join booking.bookings bb on bb.id = tb.booking_id
     where tb.service_provider_id = ${serviceProviderId}::uuid and d.starts_on between ${range.from}::date and ${range.to}::date
       and tb.status in ('confirmed','completed','no_show')
     group by tb.currency_code order by tb.currency_code`;
  const weekdays = await db<any[]>`
    select extract(isodow from d.starts_on)::int as weekday, count(*)::int as bookings, coalesce(sum(tb.seats), 0)::int as seats
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.service_provider_id = ${serviceProviderId}::uuid and d.starts_on between ${range.from}::date and ${range.to}::date
       and tb.status in ('confirmed','completed','no_show')
     group by 1 order by 2 desc, 1`;
  const topTours = await db<any[]>`
    select tb.tour_id::text, count(*)::int as bookings, coalesce(sum(tb.seats), 0)::int as seats
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.service_provider_id = ${serviceProviderId}::uuid and d.starts_on between ${range.from}::date and ${range.to}::date
       and tb.status in ('confirmed','completed','no_show')
     group by 1 order by 2 desc limit 10`;

  const statusCounts = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>;
  const total = byStatus.reduce((a, r) => a + r.n, 0);
  const cancelled = (statusCounts.cancelled ?? 0);
  return {
    range,
    departures: occ.departures,
    cancelledDepartures: occ.cancelled_departures,
    capacity: occ.capacity,
    bookedSeats: occ.booked,
    occupancy: occ.capacity > 0 ? Math.round((occ.booked / occ.capacity) * 1000) / 1000 : null,
    bookingsByStatus: statusCounts,
    totalBookings: total,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 1000) / 1000 : null,
    revenueByCurrency: revenue.map((r) => ({ currency: r.currency_code, paid: Number(r.paid), bookings: r.bookings })),
    popularWeekdays: weekdays.map((w) => ({ isoWeekday: w.weekday, bookings: w.bookings, seats: w.seats })),
    topTours: topTours.map((t) => ({ tourId: t.tour_id, bookings: t.bookings, seats: t.seats })),
  };
}

/**
 * Settlement summary per currency: gross captured, refunds paid and pending,
 * commission (per-booking snapshot, else provider agreement → platform
 * agreement → setting), net. Owner/provider-admin only; no payment instrument data.
 */
export async function providerPayoutSummary(actor: Actor, serviceProviderId: string) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "admin");
  const settings = await getTourSettings();
  const [agreement] = await db<any[]>`
    select commission_percent, service_provider_id is not null as specific from tour.commission_agreements
     where (service_provider_id = ${serviceProviderId}::uuid or service_provider_id is null)
       and effective_from <= current_date and (effective_to is null or effective_to >= current_date)
     order by (service_provider_id is not null) desc, effective_from desc limit 1`;
  const percent = agreement ? Number(agreement.commission_percent) : Number(settings.platformCommissionPercent ?? 10);
  // Commission per booking uses the snapshot recorded at booking time when the
  // schema has one (0081 tour.bookings.commission_percent, M-017); otherwise the
  // agreement in force today. Read through to_jsonb so this works either way.
  const rows = await db<any[]>`
    with per as (
      select tb.currency_code, tb.status, coalesce(bb.paid_amount, 0)::numeric as paid,
             coalesce((select sum(rl.payment_refund_amount) from commercial.refund_lines rl where rl.booking_id = tb.booking_id), 0)::numeric as refunded,
             case when tb.status = 'cancelled' and exists (select 1 from commercial.refund_requests rr
                                                           where rr.booking_id = tb.booking_id and rr.status in ('requested','approved','processing'))
                  then coalesce((tb.refund_quote->>'refundAmount')::numeric, 0) else 0 end as pending,
             coalesce((to_jsonb(tb)->>'commission_percent')::numeric, ${percent}) as pct
        from tour.bookings tb join booking.bookings bb on bb.id = tb.booking_id
       where tb.service_provider_id = ${serviceProviderId}::uuid
         and tb.status in ('confirmed','completed','no_show','cancelled')
    )
    select currency_code,
           sum(paid) as gross,
           sum(paid) filter (where status in ('completed','no_show')) as delivered,
           count(*) filter (where status <> 'cancelled')::int as bookings,
           sum(refunded) as refunded,
           sum(pending) as refunds_pending,
           sum(greatest(paid - refunded - pending, 0) * pct / 100) as commission
      from per group by currency_code order by currency_code`;
  const currencies = [];
  for (const r of rows) {
    const scale = 10 ** (await currencyDecimals(r.currency_code));
    const round = (n: number) => Math.round(n * scale) / scale;
    const gross = Number(r.gross ?? 0);
    const refunded = Number(r.refunded ?? 0);
    const pending = Number(r.refunds_pending ?? 0);
    const base = Math.max(gross - refunded - pending, 0);
    const commission = round(Number(r.commission ?? 0));
    currencies.push({
      currency: r.currency_code as string, bookings: r.bookings as number, gross, delivered: Number(r.delivered ?? 0), refunded, refundsPending: pending,
      commission, net: round(base - commission),
    });
  }
  return {
    commissionPercent: percent,
    commissionSource: agreement ? (agreement.specific ? "provider_agreement" : "platform_agreement") : "platform_setting",
    currencies,
  };
}
