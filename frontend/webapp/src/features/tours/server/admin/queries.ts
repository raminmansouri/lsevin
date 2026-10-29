import "server-only";

import db from "@/config/database/db";

import { coverage, REQUIRED_TOUR_FIELDS, type ContentRow } from "../../domain/content";
import { maskContact } from "../../domain/text";
import { contentForEditor, publishRequirements } from "../platform/authoring";
import { fail } from "../platform/errors";
import type { Actor } from "../platform/roles";
import { getTourSettings } from "../platform/settings";

import { assertAdminActor, calendarDate, optionalUuid, requireUuid } from "./guard";

/**
 * Read side of the administration panel. Admins see every provider (M-013);
 * still, personal data is masked here and revealed only through
 * support.revealBookingContact (M-020).
 */

const iso = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString());
const isoDate = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

// ----------------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------------

export type DashboardData = {
  toursByStatus: Record<string, number>;
  reviewQueue: number;
  departuresNext7Days: number;
  bookingsByStatus: Record<string, number>;
  openIncidents: number;
  criticalIncidents: number;
  openDisputes: number;
  pendingMedia: number;
  pendingReviews: number;
  expiringQualifications: number;
  coverage: { locale: string; complete: number; total: number; outdated: number }[];
};

export async function dashboard(actor: Actor): Promise<DashboardData> {
  assertAdminActor(actor);
  const settings = await getTourSettings();
  const [row] = await db<any[]>`
    select
      coalesce((select json_object_agg(status, n) from (select status, count(*)::int as n from tour.tours group by status) x), '{}') as tours_by_status,
      (select count(*)::int from tour.tours where status = 'submitted' or (status = 'published' and submitted_at > coalesce(approved_at, 'epoch'::timestamptz))) as review_queue,
      (select count(*)::int from tour.departures where tour_id is not null and status <> 'cancelled'
          and starts_at >= now() and starts_at < now() + interval '7 days') as departures_next7,
      coalesce((select json_object_agg(status, n) from (select status, count(*)::int as n from tour.bookings group by status) y), '{}') as bookings_by_status,
      (select count(*)::int from tour.incidents where status <> 'resolved') as open_incidents,
      (select count(*)::int from tour.incidents where status <> 'resolved' and severity = 'critical') as critical_incidents,
      (select count(*)::int from tour.disputes where status in ('open','pending_approval')) as open_disputes,
      (select count(*)::int from tour.media where moderation_status = 'pending') as pending_media,
      (select count(*)::int from tour.reviews where status = 'pending' or reply_status = 'pending') as pending_reviews,
      (select count(*)::int from tour.guide_qualifications where expires_on is not null and expires_on < current_date + 60
          and verification_status <> 'rejected') as expiring_qualifications
  `;
  return {
    toursByStatus: row.tours_by_status,
    reviewQueue: row.review_queue,
    departuresNext7Days: row.departures_next7,
    bookingsByStatus: row.bookings_by_status,
    openIncidents: row.open_incidents,
    criticalIncidents: row.critical_incidents,
    openDisputes: row.open_disputes,
    pendingMedia: row.pending_media,
    pendingReviews: row.pending_reviews,
    expiringQualifications: row.expiring_qualifications,
    coverage: await coverageByLocale(settings.enabledLocales),
  };
}

/** Per enabled locale: live/in-review tours with every required field present, and outdated rows (M-007). */
async function coverageByLocale(locales: string[]) {
  if (locales.length === 0) return [];
  const rows = await db<any[]>`
    with t as (select id from tour.tours where status in ('submitted','approved','published','paused')),
    l as (select unnest(${locales}::text[]) as locale)
    select l.locale,
           (select count(*)::int from t
             where (select count(distinct c.field_key) from tour.content c
                     where c.entity_type = 'tour' and c.entity_id = t.id and c.locale = l.locale
                       and c.field_key = any(${[...REQUIRED_TOUR_FIELDS]}::text[])
                       and nullif(btrim(coalesce(c.draft_value, c.published_value, '')), '') is not null) = ${REQUIRED_TOUR_FIELDS.length}) as complete,
           (select count(*)::int from t) as total,
           (select count(*)::int from tour.content c join t on t.id = c.tour_id where c.locale = l.locale and c.status = 'outdated') as outdated
      from l
  `;
  return rows.map((r) => ({ locale: r.locale, complete: r.complete, total: r.total, outdated: r.outdated }));
}

// ----------------------------------------------------------------------------
// Tours catalog + review queue (M-005, M-008)
// ----------------------------------------------------------------------------

export type TourListFilters = {
  q?: string;
  providerId?: string;
  country?: string;
  destinationId?: string;
  category?: string;
  status?: string;
  verification?: "verified" | "unverified" | "attributes_unverified";
  publishedFrom?: string;
  publishedTo?: string;
  calendar?: string;
  queue?: boolean;
  page?: number;
};

export type TourListRow = {
  id: string; slug: string; title: string | null; status: string; providerId: string; providerName: string | null;
  providerVerified: boolean; destination: string | null; country: string | null; categories: string[];
  providerNames: Record<string, string> | null; destinationNames: Record<string, string> | null;
  submittedAt: string | null; publishedAt: string | null; updatedAt: string; requirementErrors: number;
  pendingChanges: boolean; isFeatured: boolean; isSponsored: boolean; sourceLocale: string;
};

const STATUSES = ["draft", "submitted", "approved", "published", "paused", "retired", "rejected"];

export async function listTours(actor: Actor, f: TourListFilters): Promise<{ rows: TourListRow[]; total: number; page: number; pageSize: number; range: { from: string | null; to: string | null } }> {
  assertAdminActor(actor);
  const pageSize = 50;
  const page = Math.max(1, Math.floor(f.page ?? 1));
  const providerId = optionalUuid(f.providerId);
  const destinationId = optionalUuid(f.destinationId);
  const status = f.status && STATUSES.includes(f.status) ? f.status : null;
  const category = f.category && /^[a-z0-9_-]{1,62}$/.test(f.category) ? f.category : null;
  const country = f.country && /^[A-Za-z]{2}$/.test(f.country) ? f.country.toUpperCase() : null;
  const from = calendarDate(f.publishedFrom, f.calendar);
  const to = calendarDate(f.publishedTo, f.calendar);
  if (from && to && to < from) throw fail.validation("invalid_range");
  const q = f.q?.trim().toLowerCase().slice(0, 120) || null;
  const rows = await db<any[]>`
    select t.id::text, t.slug, t.status, t.service_provider_id::text as provider_id, t.source_locale,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name, sp.name_translations as provider_names,
           coalesce(sp.accredited, false) as provider_verified,
           coalesce(ds.name_translations->>'en-US', ds.name_translations->>'fa-IR', ds.slug) as destination, ds.name_translations as destination_names,
           coalesce(ds.country_code, sp.country) as country, t.category_codes, t.submitted_at, t.published_at, t.updated_at,
           t.is_featured, t.is_sponsored,
           (select coalesce(c.draft_value, c.published_value) from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select count(*)::int from tour.publish_requirements(t.id) r where r.severity = 'error') as requirement_errors,
           (t.status = 'published' and t.submitted_at > coalesce(t.approved_at, 'epoch'::timestamptz)) as pending_changes,
           count(*) over ()::int as total
      from tour.tours t
      join category.service_providers sp on sp.id = t.service_provider_id
      left join tour.destinations ds on ds.id = t.destination_id
     where (${providerId}::uuid is null or t.service_provider_id = ${providerId}::uuid)
       and (${destinationId}::uuid is null or t.destination_id = ${destinationId}::uuid)
       and (${status}::text is null or t.status = ${status})
       and (${category}::text is null or ${category} = any(t.category_codes))
       and (${country}::text is null or upper(coalesce(ds.country_code, sp.country)) = ${country})
       and (${from}::date is null or t.published_at >= ${from}::date)
       and (${to}::date is null or t.published_at < ${to}::date + 1)
       and (${f.verification === "verified"} = false or sp.accredited)
       and (${f.verification === "unverified"} = false or not coalesce(sp.accredited, false))
       and (${f.verification === "attributes_unverified"} = false or
            ((t.wheelchair_accessible or t.low_mobility_friendly or t.recovery_friendly) and t.attributes_verified_at is null))
       and (${Boolean(f.queue)} = false or t.status = 'submitted' or (t.status = 'published' and t.submitted_at > coalesce(t.approved_at, 'epoch'::timestamptz)))
       and (${q}::text is null or t.slug ilike '%' || ${q} || '%' or coalesce(t.search_text, '') like '%' || ${q} || '%')
     order by case when t.status = 'submitted' then 0 else 1 end, t.submitted_at desc nulls last, t.updated_at desc, t.id
     limit ${pageSize} offset ${(page - 1) * pageSize}
  `;
  return {
    rows: rows.map((r) => ({
      id: r.id, slug: r.slug, title: r.title, status: r.status, providerId: r.provider_id, providerName: r.provider_name,
      providerVerified: r.provider_verified, destination: r.destination, country: r.country, categories: r.category_codes,
      providerNames: r.provider_names ?? null, destinationNames: r.destination_names ?? null,
      submittedAt: iso(r.submitted_at), publishedAt: iso(r.published_at), updatedAt: iso(r.updated_at)!,
      requirementErrors: r.requirement_errors, pendingChanges: r.pending_changes, isFeatured: r.is_featured, isSponsored: r.is_sponsored,
      sourceLocale: r.source_locale,
    })),
    total: rows[0]?.total ?? 0,
    page,
    pageSize,
    range: { from, to },
  };
}

export async function filterLookups(actor: Actor) {
  assertAdminActor(actor);
  const providers = await db<any[]>`
    select sp.id::text, coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR', sp.id::text) as name, sp.name_translations as names
      from category.service_providers sp
     -- Tourism providers, so a provider can get its first tour; plus any provider that already has tours.
     where exists (select 1 from tour.tours t where t.service_provider_id = sp.id)
        or (sp.is_active and exists (select 1 from category.provider_types pt
                                      where pt.id = sp.provider_type_id and pt.name_translations->>'en-US' ilike 'tourism'))
     order by 2 limit 500`;
  const destinations = await db<any[]>`
    select id::text, slug, coalesce(name_translations->>'en-US', name_translations->>'fa-IR', slug) as name, country_code, name_translations as names
      from tour.destinations order by sort_order, slug limit 500`;
  const categories = await db<any[]>`
    select code, coalesce(label_translations->>'en-US', code) as label, label_translations
      from tour.taxonomy_terms where kind = 'category' and is_active order by sort_order, code`;
  // Options for the admin selectors only; the actions still validate every value.
  const currencies = await db<{ code: string }[]>`select code from finance.currencies where is_active order by code`;
  const { enabledLocales } = await getTourSettings();
  return { providers, destinations, categories, currencies: currencies.map((c) => c.code), enabledLocales: enabledLocales as string[] };
}

// ----------------------------------------------------------------------------
// Tour editor bundle (any tour, any provider)
// ----------------------------------------------------------------------------

export async function tourBundle(actor: Actor, tourId: string) {
  assertAdminActor(actor);
  requireUuid(tourId, "tour_not_found");
  const [core] = await db<any[]>`
    select t.*, t.id::text as id, t.service_provider_id::text as service_provider_id, t.destination_id::text as destination_id,
           t.provider_service_id::text as provider_service_id,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name, sp.accredited as provider_verified,
           sp.is_active as provider_active
      from tour.tours t join category.service_providers sp on sp.id = t.service_provider_id
     where t.id = ${tourId}::uuid`;
  if (!core) throw fail.notFound("tour_not_found");
  const settings = await getTourSettings();
  const [content, media, stops, options, addons, policies, rules, blackouts, priceRules, departures, requirements, revisions, auditRows, glossary] = await Promise.all([
    contentForEditor(actor, tourId),
    db<any[]>`select id::text, kind, url, thumbnail_url, album, sort_order, is_cover, width, height, mime_type, alt_translations, caption_translations,
                     moderation_status, moderation_note, created_at from tour.media where tour_id = ${tourId}::uuid order by album, sort_order, created_at`,
    db<any[]>`select id::text, day_number, position, stop_type, latitude, longitude, location_exact, start_time::text, duration_minutes, transport_mode,
                     travel_minutes_from_prev, distance_km_from_prev, image_url, included from tour.itinerary_stops where tour_id = ${tourId}::uuid order by day_number, position`,
    db<any[]>`select o.id::text, o.code, o.kind, o.pickup_included, o.guide_language, o.min_group, o.max_group, o.private_group_price, o.is_active, o.sort_order,
                     coalesce(json_agg(json_build_object('travelerClass', p.traveler_class, 'amount', p.amount, 'minAge', p.min_age, 'maxAge', p.max_age)
                              order by p.traveler_class) filter (where p.id is not null), '[]') as tiers
                from tour.options o left join tour.price_tiers p on p.option_id = o.id
               where o.tour_id = ${tourId}::uuid group by o.id order by o.sort_order, o.code`,
    db<any[]>`select id::text, code, pricing, amount, max_qty, is_active, sort_order from tour.addons where tour_id = ${tourId}::uuid order by sort_order, code`,
    db<any[]>`select id::text, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts, created_by::text, created_at
                from tour.policy_versions where tour_id = ${tourId}::uuid order by version desc`,
    db<any[]>`select id::text, option_id::text, calendar, kind, weekdays, month_day, local_time::text, start_date::text, end_date::text, capacity, is_active, created_at
                from tour.schedule_rules where tour_id = ${tourId}::uuid order by created_at desc`,
    db<any[]>`select id::text, date_from::text, date_to::text, reason, entered_calendar, created_at from tour.blackouts where tour_id = ${tourId}::uuid order by date_from`,
    db<any[]>`select id::text, option_id::text, date_from::text, date_to::text, kind, value, entered_calendar, note from tour.price_rules where tour_id = ${tourId}::uuid order by date_from`,
    db<any[]>`select d.id::text, d.starts_on::text, d.local_start_time::text, d.starts_at, d.timezone, d.capacity, d.booked_count, d.held_count, d.status,
                     d.is_blocked, d.is_active, d.delay_minutes, d.status_reason, d.option_id::text
                from tour.departures d where d.tour_id = ${tourId}::uuid and d.starts_at > now() - interval '30 days' order by d.starts_at limit 200`,
    publishRequirements(tourId),
    db<any[]>`select revision, material_change, change_summary, created_by::text, created_at from tour.revisions where tour_id = ${tourId}::uuid order by revision desc limit 50`,
    db<any[]>`select id::text, actor_user_id::text, actor_scope, entity_type, entity_id::text, action, detail, created_at
                from tour.audit_log
               where entity_id = ${tourId}::uuid or detail->>'tourId' = ${tourId}
               order by created_at desc limit 100`,
    db<any[]>`select term_key, locale, value, note from tour.glossary order by term_key, locale limit 500`,
  ]);
  const editorRows: ContentRow[] = content
    .filter((c) => c.entity_type === "tour")
    .map((c) => ({ fieldKey: c.field_key, locale: c.locale, publishedValue: c.published_value, draftValue: c.draft_value, status: c.status }));
  const locales = Array.from(new Set([core.source_locale, ...settings.enabledLocales]));
  return {
    core: {
      ...core,
      created_at: iso(core.created_at), updated_at: iso(core.updated_at), submitted_at: iso(core.submitted_at),
      approved_at: iso(core.approved_at), published_at: iso(core.published_at), featured_until: iso(core.featured_until),
      attributes_verified_at: iso(core.attributes_verified_at), published_snapshot: undefined, search_text: undefined,
    },
    content: content.map((c) => ({ ...c, updated_at: iso(c.updated_at), approved_at: iso(c.approved_at) })),
    coverage: coverage(editorRows, locales),
    media: media.map((m) => ({ ...m, created_at: iso(m.created_at) })),
    stops,
    options: options.map((o) => ({ ...o, private_group_price: o.private_group_price == null ? null : Number(o.private_group_price) })),
    addons: addons.map((a) => ({ ...a, amount: Number(a.amount) })),
    policies: policies.map((p) => ({ ...p, created_at: iso(p.created_at) })),
    rules: rules.map((r) => ({ ...r, created_at: iso(r.created_at) })),
    blackouts: blackouts.map((b) => ({ ...b, created_at: iso(b.created_at) })),
    priceRules: priceRules.map((r) => ({ ...r, value: Number(r.value) })),
    departures: departures.map((d) => ({ ...d, starts_at: iso(d.starts_at) })),
    requirements,
    revisions: revisions.map((r) => ({ ...r, created_at: iso(r.created_at) })),
    audit: auditRows.map((a) => ({ ...a, created_at: iso(a.created_at) })),
    glossary,
    locales,
    enabledLocales: settings.enabledLocales,
  };
}

export type TourBundle = Awaited<ReturnType<typeof tourBundle>>;

/** Translation coverage report across tours (M-007, M-029). */
export async function coverageReport(actor: Actor, opts: { status?: string } = {}) {
  assertAdminActor(actor);
  const settings = await getTourSettings();
  const status = opts.status && STATUSES.includes(opts.status) ? opts.status : null;
  const tours = await db<any[]>`
    select t.id::text, t.slug, t.status, t.source_locale,
           (select coalesce(c.draft_value, c.published_value) from tour.content c where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title
      from tour.tours t where (${status}::text is null or t.status = ${status}) and t.status <> 'retired'
     order by t.updated_at desc limit 200`;
  const ids = tours.map((t) => t.id);
  const content = ids.length === 0 ? [] : await db<any[]>`
    select tour_id::text, field_key, locale, draft_value, published_value, status from tour.content
     where entity_type = 'tour' and tour_id = any(${ids}::uuid[])`;
  const byTour = new Map<string, ContentRow[]>();
  for (const c of content) {
    const list = byTour.get(c.tour_id) ?? [];
    list.push({ fieldKey: c.field_key, locale: c.locale, publishedValue: c.published_value, draftValue: c.draft_value, status: c.status });
    byTour.set(c.tour_id, list);
  }
  return {
    locales: settings.enabledLocales,
    required: settings.requiredPublishLocales,
    tours: tours.map((t) => ({ ...t, coverage: coverage(byTour.get(t.id) ?? [], settings.enabledLocales) })),
  };
}

// ----------------------------------------------------------------------------
// Departures board (M-013, M-014)
// ----------------------------------------------------------------------------

export type DepartureBoardFilters = { from?: string; to?: string; calendar?: string; providerId?: string; tourId?: string; status?: string; page?: number };

export async function departuresBoard(actor: Actor, f: DepartureBoardFilters) {
  assertAdminActor(actor);
  const from = calendarDate(f.from, f.calendar);
  const to = calendarDate(f.to, f.calendar);
  if (from && to && to < from) throw fail.validation("invalid_range");
  const providerId = optionalUuid(f.providerId);
  const tourId = optionalUuid(f.tourId);
  const status = f.status && ["scheduled", "delayed", "in_progress", "completed", "cancelled", "blocked"].includes(f.status) ? f.status : null;
  const page = Math.max(1, Math.floor(f.page ?? 1));
  const rows = await db<any[]>`
    select d.id::text, d.tour_id::text, t.slug, d.starts_on::text, d.local_start_time::text, d.starts_at, d.timezone, d.capacity, d.booked_count, d.held_count,
           d.status, d.is_blocked, d.is_active, d.delay_minutes, d.status_reason, d.min_to_operate,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name, d.service_provider_id::text as provider_id,
           (select coalesce(c.published_value, c.draft_value) from tour.content c where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select count(*)::int from tour.waitlist w where w.departure_id = d.id and w.status in ('waiting','offered')) as waitlist,
           (select coalesce(sum(c.seats), 0)::int from tour.checkins c where c.departure_id = d.id and c.result = 'accepted') as checked_in,
           (select coalesce(json_agg(json_build_object('role', a.role, 'name', coalesce(g.display_name, r.name), 'status', a.status)), '[]')
              from tour.departure_assignments a left join tour.guides g on g.id = a.guide_id left join tour.resources r on r.id = a.resource_id
             where a.departure_id = d.id and a.status in ('assigned','accepted')) as assignments,
           exists (select 1 from tour.tracking_sessions s where s.departure_id = d.id and s.ended_at is null) as tracking_active,
           count(*) over ()::int as total
      from tour.departures d
      join tour.tours t on t.id = d.tour_id
      join category.service_providers sp on sp.id = d.service_provider_id
     where d.tour_id is not null
       and (${from}::date is null or d.starts_on >= ${from}::date)
       and (${to}::date is null or d.starts_on <= ${to}::date)
       and (${from}::date is not null or ${to}::date is not null or d.starts_at > now() - interval '1 day')
       and (${providerId}::uuid is null or d.service_provider_id = ${providerId}::uuid)
       and (${tourId}::uuid is null or d.tour_id = ${tourId}::uuid)
       and (${status}::text is null or (${status} = 'blocked' and d.is_blocked) or d.status = ${status})
     order by d.starts_at
     limit 100 offset ${(page - 1) * 100}`;
  return {
    rows: rows.map((r) => ({ ...r, starts_at: iso(r.starts_at) })),
    total: rows[0]?.total ?? 0,
    page,
    range: { from, to },
  };
}

// ----------------------------------------------------------------------------
// Bookings explorer (M-016) — booking, payment, refund and payout states side by side
// ----------------------------------------------------------------------------

export type BookingFilters = { q?: string; status?: string; paymentStatus?: string; providerId?: string; departureId?: string; from?: string; to?: string; calendar?: string; page?: number };

export async function listBookings(actor: Actor, f: BookingFilters) {
  assertAdminActor(actor);
  const from = calendarDate(f.from, f.calendar);
  const to = calendarDate(f.to, f.calendar);
  const providerId = optionalUuid(f.providerId);
  const departureId = optionalUuid(f.departureId);
  const status = f.status && /^[a-z_]{3,20}$/.test(f.status) ? f.status : null;
  const paymentStatus = f.paymentStatus && /^[A-Za-z]{3,20}$/.test(f.paymentStatus) ? f.paymentStatus : null;
  const q = f.q?.trim().slice(0, 60) || null;
  const page = Math.max(1, Math.floor(f.page ?? 1));
  const rows = await db<any[]>`
    select tb.booking_id::text, tb.voucher_code, tb.status, tb.seats, tb.currency_code, tb.total_amount, tb.commission_percent,
           tb.created_at, tb.buyer, tb.tour_id::text, t.slug, tb.departure_id::text, d.starts_on::text, d.local_start_time::text, d.timezone, d.starts_at,
           bb.payment_status, bb.paid_amount,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name,
           (select rr.status from commercial.refund_requests rr where rr.booking_id = tb.booking_id order by rr.created_at desc limit 1) as refund_state,
           (select string_agg(distinct pl.entry_type || ':' || pl.status, ', ') from commercial.provider_ledgers pl where pl.booking_id = tb.booking_id) as payout_state,
           (select count(*)::int from tour.disputes x where x.booking_id = tb.booking_id and x.status in ('open','pending_approval')) as open_disputes,
           count(*) over ()::int as total
      from tour.bookings tb
      join tour.tours t on t.id = tb.tour_id
      join tour.departures d on d.id = tb.departure_id
      join booking.bookings bb on bb.id = tb.booking_id
      join category.service_providers sp on sp.id = tb.service_provider_id
     where (${status}::text is null or tb.status = ${status})
       and (${paymentStatus}::text is null or bb.payment_status = ${paymentStatus})
       and (${providerId}::uuid is null or tb.service_provider_id = ${providerId}::uuid)
       and (${departureId}::uuid is null or tb.departure_id = ${departureId}::uuid)
       and (${from}::date is null or d.starts_on >= ${from}::date)
       and (${to}::date is null or d.starts_on <= ${to}::date)
       and (${q}::text is null or tb.voucher_code ilike '%' || ${q} || '%' or tb.booking_id::text = ${q})
     order by tb.created_at desc
     limit 50 offset ${(page - 1) * 50}`;
  return {
    rows: rows.map((r) => ({
      bookingId: r.booking_id, voucher: r.voucher_code, status: r.status, seats: r.seats, currency: r.currency_code,
      total: Number(r.total_amount), paid: Number(r.paid_amount ?? 0), commissionPercent: r.commission_percent == null ? null : Number(r.commission_percent),
      createdAt: iso(r.created_at), tourId: r.tour_id, slug: r.slug, departureId: r.departure_id, localDate: isoDate(r.starts_on),
      localTime: r.local_start_time ? String(r.local_start_time).slice(0, 5) : null, timezone: r.timezone, startsAt: iso(r.starts_at),
      paymentStatus: r.payment_status, refundState: r.refund_state ?? null, payoutState: r.payout_state ?? null, providerName: r.provider_name,
      openDisputes: r.open_disputes,
      buyer: maskedBuyer(r.buyer),
    })),
    total: rows[0]?.total ?? 0,
    page,
  };
}

export function maskedBuyer(buyer: any) {
  const b = (buyer ?? {}) as { firstName?: string; lastName?: string; email?: string | null; phone?: string | null };
  return {
    name: `${b.firstName ?? ""} ${b.lastName ? `${b.lastName.slice(0, 1)}.` : ""}`.trim(),
    email: b.email ? maskContact(b.email) : null,
    phone: b.phone ? maskContact(b.phone) : null,
  };
}

// ----------------------------------------------------------------------------
// Compliance (M-023)
// ----------------------------------------------------------------------------

export async function complianceQueue(actor: Actor) {
  assertAdminActor(actor);
  const [qualifications, unverifiedProviders, flags, unverifiedAttributes] = await Promise.all([
    db<any[]>`
      select q.id::text, q.kind, q.issuer, q.country_code, q.expires_on::text, q.verification_status, g.id::text as guide_id, g.display_name, g.status as guide_status,
             (q.expires_on < current_date) as expired
        from tour.guide_qualifications q join tour.guides g on g.id = q.guide_id
       where (q.expires_on is not null and q.expires_on < current_date + 60) or q.verification_status = 'pending'
       order by q.expires_on nulls last limit 200`,
    db<any[]>`
      select sp.id::text, coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as name, sp.is_active,
             (select count(*)::int from tour.tours t where t.service_provider_id = sp.id and t.status = 'published') as published_tours,
             (select count(*)::int from tour.tours t where t.service_provider_id = sp.id) as tours
        from category.service_providers sp
       where not coalesce(sp.accredited, false) and exists (select 1 from tour.tours t where t.service_provider_id = sp.id)
       order by 4 desc limit 200`,
    db<any[]>`
      select f.id::text, f.service_provider_id::text, f.flag, f.note, f.created_at,
             coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name
        from tour.provider_flags f join category.service_providers sp on sp.id = f.service_provider_id
       where f.cleared_at is null order by f.created_at desc limit 200`,
    db<any[]>`
      select t.id::text, t.slug, t.wheelchair_accessible, t.low_mobility_friendly, t.recovery_friendly
        from tour.tours t
       where (t.wheelchair_accessible or t.low_mobility_friendly or t.recovery_friendly) and t.attributes_verified_at is null and t.status <> 'retired'
       order by t.updated_at desc limit 200`,
  ]);
  return {
    qualifications,
    unverifiedProviders,
    flags: flags.map((f) => ({ ...f, created_at: iso(f.created_at) })),
    unverifiedAttributes,
  };
}

// ----------------------------------------------------------------------------
// Reviews moderation queue (M-034)
// ----------------------------------------------------------------------------

export async function reviewQueue(actor: Actor, opts: { status?: string } = {}) {
  assertAdminActor(actor);
  const status = opts.status && ["pending", "published", "rejected", "hidden", "reported", "reply_pending"].includes(opts.status) ? opts.status : "pending";
  const rows = await db<any[]>`
    select r.id::text, r.tour_id::text, t.slug, r.rating, r.guide_rating, r.body, r.locale, r.status, r.moderation_note, r.provider_reply, r.reply_status,
           r.created_at,
           coalesce((select json_agg(json_build_object('locale', tr.locale, 'body', tr.body, 'isMachine', tr.is_machine)) from tour.review_translations tr where tr.review_id = r.id), '[]') as translations,
           coalesce((select json_agg(json_build_object('reason', rp.reason, 'status', rp.status, 'createdAt', rp.created_at)) from tour.review_reports rp where rp.review_id = r.id), '[]') as reports
      from tour.reviews r join tour.tours t on t.id = r.tour_id
     where case ${status}
             when 'reported' then exists (select 1 from tour.review_reports rp where rp.review_id = r.id and rp.status = 'open')
             when 'reply_pending' then r.reply_status = 'pending'
             else r.status = ${status} end
     order by r.created_at desc limit 100`;
  return rows.map((r) => ({ ...r, created_at: iso(r.created_at) }));
}

// ----------------------------------------------------------------------------
// Taxonomy / destinations / editorial lists
// ----------------------------------------------------------------------------

export async function listTaxonomy(actor: Actor) {
  assertAdminActor(actor);
  return db<any[]>`
    select id::text, kind, code, label_translations, icon, sort_order, is_active,
           (select count(*)::int from tour.tours t where tt.code = any(case tt.kind when 'category' then t.category_codes when 'tag' then t.tag_codes
              when 'transport_mode' then t.transport_modes else '{}'::text[] end)) as usage
      from tour.taxonomy_terms tt order by kind, sort_order, code`;
}

export async function listAllDestinations(actor: Actor) {
  assertAdminActor(actor);
  const rows = await db<any[]>`
    select d.id::text, d.slug, d.name_translations, d.description_translations, d.region_translations, d.country_code, d.latitude, d.longitude,
           d.timezone, d.cover_url, d.cover_alt_translations, d.is_published, d.is_featured, d.sort_order, d.publish_from, d.publish_until,
           (select count(*)::int from tour.tours t where t.destination_id = d.id) as tours,
           (select count(*)::int from tour.tours t where t.destination_id = d.id and t.status = 'published') as published_tours
      from tour.destinations d order by d.sort_order, d.slug`;
  return rows.map((r) => ({
    ...r, latitude: r.latitude == null ? null : Number(r.latitude), longitude: r.longitude == null ? null : Number(r.longitude),
    publish_from: iso(r.publish_from), publish_until: iso(r.publish_until),
  }));
}

export async function listModules(actor: Actor) {
  assertAdminActor(actor);
  const rows = await db<any[]>`
    select id::text, kind, code, title_translations, subtitle_translations, cta_translations, image_url, rules, tour_ids::text[] as tour_ids,
           destination_ids::text[] as destination_ids, is_sponsored, experiment, sort_order, status, publish_from, publish_until, updated_at
      from tour.editorial_modules order by sort_order, code`;
  return rows.map((r) => ({ ...r, publish_from: iso(r.publish_from), publish_until: iso(r.publish_until), updated_at: iso(r.updated_at) }));
}

export async function publishedTourOptions(actor: Actor) {
  assertAdminActor(actor);
  return db<any[]>`
    select t.id::text, t.slug, t.status,
           (select coalesce(c.published_value, c.draft_value) from tour.content c where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select coalesce(jsonb_object_agg(c.locale, coalesce(c.published_value, c.draft_value)) filter (where coalesce(c.published_value, c.draft_value) is not null), '{}'::jsonb)
              from tour.content c where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title') as title_translations
      from tour.tours t where t.status in ('published','paused','approved','submitted') order by t.updated_at desc limit 500`;
}

export async function listTranslatorsAndGlossary(actor: Actor) {
  assertAdminActor(actor);
  const [assignments, glossary] = await Promise.all([
    db<any[]>`
      select a.user_id::text, a.locale, a.service_provider_id::text, a.created_at,
             trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as name, u.email,
             coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name
        from tour.translator_assignments a
        left join identity.asp_net_users u on u.id::text = a.user_id::text
        left join category.service_providers sp on sp.id = a.service_provider_id
       order by a.created_at desc limit 500`,
    db<any[]>`select term_key, locale, value, note, updated_at from tour.glossary order by term_key, locale limit 2000`,
  ]);
  return {
    assignments: assignments.map((a) => ({ ...a, email: a.email ? maskContact(a.email) : null, created_at: iso(a.created_at) })),
    glossary: glossary.map((g) => ({ ...g, updated_at: iso(g.updated_at) })),
  };
}

export async function auditTrail(actor: Actor, opts: { entityType?: string; action?: string; limit?: number } = {}) {
  assertAdminActor(actor);
  const rows = await db<any[]>`
    select id::text, actor_user_id::text, actor_scope, service_provider_id::text, entity_type, entity_id::text, action, detail, created_at
      from tour.audit_log
     where (${opts.entityType ?? null}::text is null or entity_type = ${opts.entityType ?? null})
       and (${opts.action ?? null}::text is null or action = ${opts.action ?? null})
     order by created_at desc limit ${Math.min(opts.limit ?? 100, 500)}`;
  return rows.map((r) => ({ ...r, created_at: iso(r.created_at) }));
}
