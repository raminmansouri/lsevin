import "server-only";

import db from "@/config/database/db";

import { contentForEditor, publishRequirements } from "../platform/authoring";
import { fail } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";

import { iso, isoDateOf, requireUuid } from "./common";

/** Read models for the provider portal (internal RPC). */

export async function meContext(actor: Actor) {
  if (!actor.userId) throw fail.auth();
  const providers = await db<any[]>`
    select m.service_provider_id::text as id, sp.name_translations, m.role::text as role
      from provider_portal.provider_members m join category.service_providers sp on sp.id = m.service_provider_id
     where m.user_id = ${actor.userId}::uuid and m.status = 'active'
     order by sp.name_translations->>'en-US'`;
  const [guide] = await db<any[]>`select id::text, status from tour.guides where user_id = ${actor.userId}::uuid`;
  const locales = await db<any[]>`select locale, service_provider_id::text from tour.translator_assignments where user_id = ${actor.userId}::uuid order by locale`;
  return {
    userId: actor.userId,
    isAdmin: actor.isAdmin,
    providers: providers.map((p) => ({ id: p.id, name: p.name_translations ?? {}, role: p.role })),
    guide: guide ? { id: guide.id as string, status: guide.status as string } : null,
    translatorLocales: locales.map((l) => ({ locale: l.locale as string, serviceProviderId: (l.service_provider_id as string | null) ?? null })),
  };
}

export async function listProviderTours(actor: Actor, serviceProviderId: string, status?: string | null) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "viewer");
  const rows = await db<any[]>`
    select t.id::text, t.slug, t.status, t.source_locale, t.tour_type, t.currency_code, t.from_price, t.rating_avg, t.review_count,
           t.draft_revision, t.published_revision, t.updated_at, t.review_note,
           (select coalesce(c.draft_value, c.published_value) from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select json_build_object('id', d.id, 'startsAt', d.starts_at, 'remaining', d.capacity - d.booked_count - d.held_count)
              from tour.departures d where d.tour_id = t.id and d.starts_at > now() and d.status in ('scheduled','delayed')
             order by d.starts_at limit 1) as next_departure,
           (select count(*)::int from tour.publish_requirements(t.id) r where r.severity = 'error') as requirement_errors
      from tour.tours t
     where t.service_provider_id = ${serviceProviderId}::uuid
       and (${status ?? null}::text is null or t.status = ${status ?? null})
     order by t.updated_at desc limit 500`;
  return rows.map((t) => ({
    id: t.id, slug: t.slug, status: t.status, sourceLocale: t.source_locale, tourType: t.tour_type, title: t.title ?? null,
    currency: t.currency_code, fromPrice: t.from_price == null ? null : Number(t.from_price),
    rating: { avg: t.rating_avg == null ? null : Number(t.rating_avg), count: t.review_count },
    hasUnpublishedChanges: t.published_revision != null && t.draft_revision !== t.published_revision,
    reviewNote: t.review_note, updatedAt: iso(t.updated_at),
    nextDeparture: t.next_departure ? { id: t.next_departure.id, startsAt: iso(t.next_departure.startsAt), remaining: t.next_departure.remaining } : null,
    requirementErrors: t.requirement_errors,
  }));
}

/** Everything the portal's tour editor needs, in one call. */
export async function tourEditorBundle(actor: Actor, tourId: string) {
  requireUuid(tourId, "tour_not_found");
  const content = await contentForEditor(actor, tourId); // authorizes: provider viewer+ or translator of that provider
  const [core] = await db<any[]>`
    select t.*, t.id::text as id, t.service_provider_id::text as service_provider_id, t.destination_id::text as destination_id,
           t.provider_service_id::text as provider_service_id, t.duplicated_from::text as duplicated_from
      from tour.tours t where t.id = ${tourId}::uuid`;
  const tid = tourId;
  const [media, stops, options, addons, policies, rules, blackouts, priceRules, departures, revisions, requirements] = await Promise.all([
    db<any[]>`select id::text, kind, url, thumbnail_url, album, sort_order, is_cover, width, height, mime_type, alt_translations, caption_translations, moderation_status, moderation_note
                from tour.media where tour_id = ${tid}::uuid order by album, sort_order`,
    db<any[]>`select id::text, day_number, position, stop_type, latitude, longitude, location_exact, start_time::text, duration_minutes, transport_mode,
                     travel_minutes_from_prev, distance_km_from_prev, image_url, included
                from tour.itinerary_stops where tour_id = ${tid}::uuid order by day_number, position`,
    db<any[]>`select o.id::text, o.code, o.kind, o.pickup_included, o.guide_language, o.min_group, o.max_group, o.private_group_price, o.is_active, o.sort_order,
                     coalesce(json_agg(json_build_object('travelerClass', p.traveler_class, 'amount', p.amount, 'minAge', p.min_age, 'maxAge', p.max_age))
                              filter (where p.id is not null), '[]') as tiers
                from tour.options o left join tour.price_tiers p on p.option_id = o.id
               where o.tour_id = ${tid}::uuid group by o.id order by o.sort_order, o.code`,
    db<any[]>`select id::text, code, pricing, amount, max_qty, is_active, sort_order from tour.addons where tour_id = ${tid}::uuid order by sort_order`,
    db<any[]>`select id::text, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts, created_at
                from tour.policy_versions where tour_id = ${tid}::uuid order by version desc`,
    db<any[]>`select id::text, option_id::text, calendar, kind, weekdays, month_day, local_time::text, start_date::text, end_date::text, capacity, is_active
                from tour.schedule_rules where tour_id = ${tid}::uuid order by created_at`,
    db<any[]>`select id::text, date_from::text, date_to::text, reason, entered_calendar from tour.blackouts where tour_id = ${tid}::uuid order by date_from`,
    db<any[]>`select id::text, option_id::text, date_from::text, date_to::text, kind, value, entered_calendar, note from tour.price_rules where tour_id = ${tid}::uuid order by date_from`,
    db<any[]>`select id::text, option_id::text, starts_on, local_start_time::text, starts_at, ends_at, timezone, capacity, booked_count, held_count, status,
                     delay_minutes, is_blocked, min_to_operate
                from tour.departures where tour_id = ${tid}::uuid and starts_at > now() - interval '1 day' order by starts_at limit 200`,
    db<any[]>`select revision, material_change, change_summary, created_at from tour.revisions where tour_id = ${tid}::uuid order by revision desc limit 50`,
    publishRequirements(tid),
  ]);
  return {
    core: {
      ...core,
      search_text: undefined,
      published_snapshot: undefined,
      meeting_lat: core.meeting_lat == null ? null : Number(core.meeting_lat),
      meeting_lng: core.meeting_lng == null ? null : Number(core.meeting_lng),
      end_lat: core.end_lat == null ? null : Number(core.end_lat),
      end_lng: core.end_lng == null ? null : Number(core.end_lng),
      from_price: core.from_price == null ? null : Number(core.from_price),
    },
    content,
    media,
    stops: stops.map((s) => ({ ...s, latitude: s.latitude == null ? null : Number(s.latitude), longitude: s.longitude == null ? null : Number(s.longitude) })),
    options: options.map((o) => ({ ...o, private_group_price: o.private_group_price == null ? null : Number(o.private_group_price), tiers: (o.tiers as any[]).map((t) => ({ ...t, amount: Number(t.amount) })) })),
    addons: addons.map((a) => ({ ...a, amount: Number(a.amount) })),
    policyVersions: policies,
    scheduleRules: rules,
    blackouts,
    priceRules: priceRules.map((p) => ({ ...p, value: Number(p.value) })),
    departures: departures.map((d) => ({ ...d, starts_on: isoDateOf(d.starts_on), starts_at: iso(d.starts_at), ends_at: iso(d.ends_at) })),
    requirements,
    revisions,
  };
}
