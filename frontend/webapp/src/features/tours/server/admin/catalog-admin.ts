import "server-only";

import db from "@/config/database/db";

import { isValidTimeZone, localToInstant } from "../../domain/calendar";
import { audit } from "../platform/booking";
import { fail, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { assertAdminActor, calendarDate, intIn, LOCALE_RE, optionalUuid, requireUuid, translationsMap } from "./guard";

type Tx = typeof db;

/**
 * Admin-managed master data: taxonomy (M-002), destinations (M-003),
 * landing/editorial modules (M-004, M-009, M-012), featured placement (M-009),
 * translator assignments + glossary (M-030, S-070) and provider flags (M-023).
 * Every mutation is audited.
 */

const TERM_KINDS = ["category", "tag", "transport_mode", "difficulty", "amenity", "inclusion", "badge", "suitability", "age_rule"] as const;
const CODE_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const URL_RE = /^(https:\/\/|\/)[^\s<>"']{1,1000}$/;
/** Per-language cap for destination descriptions, sized for serialized rich text (Lexical JSON). */
const DESCRIPTION_MAX = 40_000;

// ----------------------------------------------------------------------------
// Taxonomy (M-002)
// ----------------------------------------------------------------------------

export type TermInput = { id?: string | null; kind: string; code: string; labels: Record<string, string>; icon?: string | null; sortOrder?: number; isActive?: boolean };

export async function upsertTerm(actor: Actor, input: TermInput) {
  assertAdminActor(actor);
  const id = optionalUuid(input.id);
  if (!(TERM_KINDS as readonly string[]).includes(input.kind)) throw fail.validation("invalid_kind");
  const code = String(input.code ?? "").trim().toLowerCase();
  if (!CODE_RE.test(code)) throw fail.validation("invalid_code");
  const labels = translationsMap(input.labels, 200);
  if (Object.keys(labels).length === 0) throw fail.validation("label_required");
  const sort = intIn(input.sortOrder ?? 0, -10_000, 10_000, "invalid_sort_order");
  const icon = input.icon ? String(input.icon).slice(0, 60) : null;
  try {
    return await db.begin(async (tx) => {
      let rowId = id;
      if (id) {
        const [prev] = await tx<any[]>`select kind, code from tour.taxonomy_terms where id = ${id}::uuid for update`;
        if (!prev) throw fail.notFound("term_not_found");
        // A code is a stable identifier referenced by tours; renaming it would orphan them.
        if (prev.code !== code || prev.kind !== input.kind) {
          const [used] = await tx<any[]>`select count(*)::int as n from tour.tours t where ${prev.code} = any(t.category_codes || t.tag_codes || t.transport_modes)`;
          if (used.n > 0) throw fail.conflict("term_in_use");
        }
        await tx`update tour.taxonomy_terms set kind = ${input.kind}, code = ${code}, label_translations = ${db.json(labels as never)}, icon = ${icon},
                   sort_order = ${sort}, is_active = ${input.isActive ?? true}, updated_at = now() where id = ${id}::uuid`;
      } else {
        const [row] = await tx<any[]>`insert into tour.taxonomy_terms (kind, code, label_translations, icon, sort_order, is_active)
                                      values (${input.kind}, ${code}, ${db.json(labels as never)}, ${icon}, ${sort}, ${input.isActive ?? true}) returning id::text`;
        rowId = row.id;
      }
      await audit(tx as unknown as Tx, actor, null, "taxonomy_term", rowId, id ? "updated" : "created", { kind: input.kind, code });
      return { id: rowId! };
    });
  } catch (e) {
    throw mapDbError(e, "upsertTerm");
  }
}

export async function deleteTerm(actor: Actor, termId: string) {
  assertAdminActor(actor);
  requireUuid(termId);
  await db.begin(async (tx) => {
    const [t] = await tx<any[]>`select code from tour.taxonomy_terms where id = ${termId}::uuid for update`;
    if (!t) throw fail.notFound("term_not_found");
    const [used] = await tx<any[]>`select count(*)::int as n from tour.tours where ${t.code} = any(category_codes || tag_codes || transport_modes)`;
    if (used.n > 0) throw fail.conflict("term_in_use", { tours: used.n });
    await tx`delete from tour.taxonomy_terms where id = ${termId}::uuid`;
    await audit(tx as unknown as Tx, actor, null, "taxonomy_term", termId, "deleted", { code: t.code });
  });
}

// ----------------------------------------------------------------------------
// Destinations (M-003, M-027)
// ----------------------------------------------------------------------------

export type DestinationInput = {
  id?: string | null; slug: string; names: Record<string, string>; regions?: Record<string, string>; descriptions?: Record<string, string>;
  countryCode?: string | null; latitude?: number | string | null; longitude?: number | string | null; timezone?: string | null;
  coverUrl?: string | null; coverAlts?: Record<string, string>; isPublished?: boolean; isFeatured?: boolean; sortOrder?: number;
  publishFrom?: string | null; publishUntil?: string | null; calendar?: string;
};

function coord(v: unknown, min: number, max: number): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw fail.validation("invalid_coordinates");
  return n;
}

/** A window boundary typed as a date in the admin's calendar → the start of that day in the destination's timezone. */
function windowInstant(value: unknown, calendar: unknown, tz: string): Date | null {
  const isoDay = calendarDate(value, calendar);
  return isoDay ? startOfLocalDay(isoDay, tz) : null;
}

/** 00:00 local; where midnight does not exist (a DST jump at 00:00) the first valid hour is used, never a silent day shift. */
function startOfLocalDay(isoDay: string, tz: string): Date {
  for (const time of ["00:00", "01:00", "02:00"]) {
    try { return localToInstant(isoDay, time, tz); } catch { /* try the next hour of the same day */ }
  }
  throw fail.validation("invalid_date", { value: isoDay });
}

export async function upsertDestination(actor: Actor, input: DestinationInput) {
  assertAdminActor(actor);
  const id = optionalUuid(input.id);
  const slug = String(input.slug ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw fail.validation("invalid_slug");
  const names = translationsMap(input.names, 200);
  if (Object.keys(names).length === 0) throw fail.validation("name_required");
  const lat = coord(input.latitude, -90, 90);
  const lng = coord(input.longitude, -180, 180);
  if ((lat == null) !== (lng == null)) throw fail.validation("invalid_coordinates");
  const tz = input.timezone?.trim() || "Asia/Tehran";
  if (!isValidTimeZone(tz)) throw fail.validation("invalid_timezone");
  const country = input.countryCode ? String(input.countryCode).trim().toUpperCase() : null;
  if (country && !/^[A-Z]{2}$/.test(country)) throw fail.validation("invalid_country");
  const cover = input.coverUrl?.trim() || null;
  if (cover && !URL_RE.test(cover)) throw fail.validation("invalid_media_url");
  const alts = translationsMap(input.coverAlts, 300);
  if (cover && Object.keys(alts).length === 0) throw fail.validation("cover_alt_required");
  const from = windowInstant(input.publishFrom, input.calendar, tz);
  const until = windowInstant(input.publishUntil, input.calendar, tz);
  if (from && until && until <= from) throw fail.validation("invalid_range");
  const values = {
    slug, name_translations: db.json(names as never), region_translations: db.json(translationsMap(input.regions, 200) as never),
    // Descriptions are rich text (Lexical JSON per language), far longer than the visible text.
    description_translations: db.json(translationsMap(input.descriptions, DESCRIPTION_MAX) as never), country_code: country, latitude: lat, longitude: lng,
    timezone: tz, cover_url: cover, cover_alt_translations: db.json(alts as never), is_published: Boolean(input.isPublished),
    is_featured: Boolean(input.isFeatured), sort_order: intIn(input.sortOrder ?? 0, -10_000, 10_000, "invalid_sort_order"),
    publish_from: from, publish_until: until,
    search_text: Object.values(names).join(" ").toLowerCase(),
  };
  try {
    return await db.begin(async (tx) => {
      let rowId = id;
      if (id) {
        const r = await tx`update tour.destinations set ${tx(values as never)}, updated_at = now() where id = ${id}::uuid returning id`;
        if (r.length === 0) throw fail.notFound("destination_not_found");
        // Tours of this destination carry its names in their search text.
        const tours = await tx<any[]>`select id::text from tour.tours where destination_id = ${id}::uuid`;
        for (const t of tours) await tx`select tour.refresh_search_text(${t.id}::uuid)`;
      } else {
        const [row] = await tx<any[]>`insert into tour.destinations ${tx(values as never)} returning id::text`;
        rowId = row.id;
      }
      await audit(tx as unknown as Tx, actor, null, "destination", rowId, id ? "updated" : "created",
        { slug, isPublished: values.is_published, isFeatured: values.is_featured });
      return { id: rowId! };
    });
  } catch (e) {
    throw mapDbError(e, "upsertDestination");
  }
}

export async function deleteDestination(actor: Actor, destinationId: string) {
  assertAdminActor(actor);
  requireUuid(destinationId);
  await db.begin(async (tx) => {
    const [used] = await tx<any[]>`select count(*)::int as n from tour.tours where destination_id = ${destinationId}::uuid`;
    if (used.n > 0) throw fail.conflict("destination_in_use", { tours: used.n });
    const r = await tx`delete from tour.destinations where id = ${destinationId}::uuid returning slug`;
    if (r.length === 0) throw fail.notFound("destination_not_found");
    await audit(tx as unknown as Tx, actor, null, "destination", destinationId, "deleted", { slug: r[0].slug });
  });
}

// ----------------------------------------------------------------------------
// Editorial modules (M-004, M-009, M-012)
// ----------------------------------------------------------------------------

const MODULE_KINDS = ["hero", "onboarding", "collection", "offers", "popular_destinations"];
const RULE_KEYS = new Set(["category", "family", "accessible", "sort", "maxItems"]);

export type ModuleInput = {
  id?: string | null; kind: string; code: string; titles: Record<string, string>; subtitles?: Record<string, string>; ctas?: Record<string, string>;
  imageUrl?: string | null; rules?: Record<string, unknown>; tourIds?: string[]; destinationIds?: string[]; isSponsored?: boolean;
  experiment?: { key: string; variants: string[] } | null; sortOrder?: number; status?: "draft" | "published";
  publishFrom?: string | null; publishUntil?: string | null; calendar?: string; timezone?: string;
};

export async function upsertModule(actor: Actor, input: ModuleInput) {
  assertAdminActor(actor);
  const id = optionalUuid(input.id);
  if (!MODULE_KINDS.includes(input.kind)) throw fail.validation("invalid_kind");
  const code = String(input.code ?? "").trim().toLowerCase();
  if (!CODE_RE.test(code)) throw fail.validation("invalid_code");
  const titles = translationsMap(input.titles, 200);
  if (Object.keys(titles).length === 0) throw fail.validation("title_required");
  const image = input.imageUrl?.trim() || null;
  if (image && !URL_RE.test(image)) throw fail.validation("invalid_media_url");
  const rules: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input.rules ?? {})) {
    if (!RULE_KEYS.has(k)) throw fail.validation("invalid_rule", { rule: k });
    if (v === "" || v == null || v === false) continue;
    if (k === "maxItems") rules[k] = intIn(v, 1, 20, "invalid_rule");
    else if (k === "category") { if (!CODE_RE.test(String(v))) throw fail.validation("invalid_rule", { rule: k }); rules[k] = String(v); }
    else if (k === "sort") { if (!["popularity", "rating", "price_asc", "start_date"].includes(String(v))) throw fail.validation("invalid_rule", { rule: k }); rules[k] = String(v); }
    else rules[k] = Boolean(v);
  }
  const tourIds = (input.tourIds ?? []).map((x) => requireUuid(x));
  const destinationIds = (input.destinationIds ?? []).map((x) => requireUuid(x));
  if (tourIds.length > 50 || destinationIds.length > 50) throw fail.validation("too_many_items");
  let experiment: { key: string; variants: string[] } | null = null;
  if (input.experiment && input.experiment.key) {
    const key = String(input.experiment.key).trim();
    const variants = Array.from(new Set((input.experiment.variants ?? []).map((v) => String(v).trim()).filter(Boolean)));
    if (!CODE_RE.test(key) || variants.length < 2 || variants.length > 5 || !variants.every((v) => CODE_RE.test(v))) throw fail.validation("invalid_experiment");
    experiment = { key, variants };
  }
  // Sponsored placement must always be labelled and must end (M-009).
  const tz = input.timezone && isValidTimeZone(input.timezone) ? input.timezone : "Asia/Tehran";
  const from = windowInstant(input.publishFrom, input.calendar, tz);
  const until = windowInstant(input.publishUntil, input.calendar, tz);
  if (from && until && until <= from) throw fail.validation("invalid_range");
  if (input.isSponsored && !until) throw fail.validation("sponsored_requires_end");
  const status = input.status === "published" ? "published" : "draft";
  try {
    return await db.begin(async (tx) => {
      if (tourIds.length > 0) {
        const [n] = await tx<any[]>`select count(*)::int as n from tour.tours where id = any(${tourIds}::uuid[])`;
        if (n.n !== tourIds.length) throw fail.validation("unknown_tour");
      }
      if (destinationIds.length > 0) {
        const [n] = await tx<any[]>`select count(*)::int as n from tour.destinations where id = any(${destinationIds}::uuid[])`;
        if (n.n !== destinationIds.length) throw fail.validation("unknown_destination");
      }
      const values = {
        kind: input.kind, code, title_translations: db.json(titles as never),
        subtitle_translations: db.json(translationsMap(input.subtitles, 400) as never), cta_translations: db.json(translationsMap(input.ctas, 80) as never),
        image_url: image, rules: db.json(rules as never), is_sponsored: Boolean(input.isSponsored), experiment: experiment ? db.json(experiment as never) : null,
        sort_order: intIn(input.sortOrder ?? 0, -10_000, 10_000, "invalid_sort_order"), status, publish_from: from, publish_until: until,
        updated_by: actor.userId,
      };
      let rowId = id;
      if (id) {
        const r = await tx`update tour.editorial_modules set ${tx(values as never)}, tour_ids = ${tourIds}::uuid[], destination_ids = ${destinationIds}::uuid[], updated_at = now()
                            where id = ${id}::uuid returning id`;
        if (r.length === 0) throw fail.notFound("module_not_found");
      } else {
        const [row] = await tx<any[]>`insert into tour.editorial_modules ${tx(values as never)} returning id::text`;
        rowId = row.id;
        await tx`update tour.editorial_modules set tour_ids = ${tourIds}::uuid[], destination_ids = ${destinationIds}::uuid[] where id = ${rowId}::uuid`;
      }
      await audit(tx as unknown as Tx, actor, null, "editorial_module", rowId, id ? "updated" : "created",
        { code, kind: input.kind, status, isSponsored: values.is_sponsored, publishFrom: from, publishUntil: until });
      return { id: rowId! };
    });
  } catch (e) {
    throw mapDbError(e, "upsertModule");
  }
}

export async function deleteModule(actor: Actor, moduleId: string) {
  assertAdminActor(actor);
  requireUuid(moduleId);
  await db.begin(async (tx) => {
    const r = await tx`delete from tour.editorial_modules where id = ${moduleId}::uuid returning code`;
    if (r.length === 0) throw fail.notFound("module_not_found");
    await audit(tx as unknown as Tx, actor, null, "editorial_module", moduleId, "deleted", { code: r[0].code });
  });
}

// ----------------------------------------------------------------------------
// Featured / sponsored placement of a tour (M-009)
// ----------------------------------------------------------------------------

export async function setTourPlacement(actor: Actor, tourId: string, input: { isFeatured: boolean; featuredUntil?: string | null; calendar?: string; isSponsored?: boolean }) {
  assertAdminActor(actor);
  requireUuid(tourId, "tour_not_found");
  const untilDay = calendarDate(input.featuredUntil, input.calendar);
  const sponsored = Boolean(input.isSponsored);
  if ((input.isFeatured || sponsored) && !untilDay) throw fail.validation("placement_requires_end");
  await db.begin(async (tx) => {
    const [t] = await tx<any[]>`select service_provider_id::text, timezone from tour.tours where id = ${tourId}::uuid for update`;
    if (!t) throw fail.notFound("tour_not_found");
    const until = untilDay ? startOfLocalDay(untilDay, t.timezone) : null;
    if (until && until.getTime() <= Date.now()) throw fail.validation("placement_end_in_past");
    await tx`update tour.tours set is_featured = ${Boolean(input.isFeatured)}, featured_until = ${until}, is_sponsored = ${sponsored}, updated_at = now() where id = ${tourId}::uuid`;
    await audit(tx as unknown as Tx, actor, t.service_provider_id, "tour", tourId, "placement_updated", { isFeatured: input.isFeatured, until, sponsored });
  });
}

/** Verifies (or revokes) accessibility / recovery attribute claims (S-046). */
export async function verifyTourAttributes(actor: Actor, tourId: string, verified: boolean) {
  assertAdminActor(actor);
  requireUuid(tourId, "tour_not_found");
  await db.begin(async (tx) => {
    const r = await tx<any[]>`update tour.tours set attributes_verified_at = ${verified ? new Date() : null}, attributes_verified_by = ${verified ? actor.userId : null}::uuid, updated_at = now()
                               where id = ${tourId}::uuid returning service_provider_id::text`;
    if (r.length === 0) throw fail.notFound("tour_not_found");
    await audit(tx as unknown as Tx, actor, r[0].service_provider_id, "tour", tourId, verified ? "attributes_verified" : "attributes_unverified", {});
  });
}

// ----------------------------------------------------------------------------
// Translators + glossary (M-030, S-070)
// ----------------------------------------------------------------------------

export async function searchUsers(actor: Actor, q: string) {
  assertAdminActor(actor);
  const term = String(q ?? "").trim();
  if (term.length < 3) return [];
  const like = `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = await db<any[]>`
    select id::text, trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) as name, email, phone_number
      from identity.asp_net_users
     where email ilike ${like} or phone_number ilike ${like} or (first_name || ' ' || last_name) ilike ${like}
     order by email nulls last limit 10`;
  // The picker identifies an account; it does not need the full phone number.
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone_number ? `…${String(r.phone_number).slice(-4)}` : null }));
}

export async function grantTranslator(actor: Actor, input: { userId: string; locale: string; serviceProviderId?: string | null }) {
  assertAdminActor(actor);
  const userId = requireUuid(input.userId, "user_not_found");
  if (!LOCALE_RE.test(input.locale)) throw fail.validation("invalid_locale");
  const providerId = optionalUuid(input.serviceProviderId);
  try {
    await db.begin(async (tx) => {
      const [u] = await tx<any[]>`select 1 from identity.asp_net_users where id::text = ${userId}`;
      if (!u) throw fail.notFound("user_not_found");
      await tx`insert into tour.translator_assignments (user_id, locale, service_provider_id, granted_by)
               values (${userId}::uuid, ${input.locale}, ${providerId}::uuid, ${actor.userId}::uuid)
               on conflict (user_id, locale) do update set service_provider_id = excluded.service_provider_id, granted_by = excluded.granted_by`;
      await audit(tx as unknown as Tx, actor, providerId, "translator_assignment", userId, "granted", { locale: input.locale, serviceProviderId: providerId });
    });
  } catch (e) {
    throw mapDbError(e, "grantTranslator");
  }
}

export async function revokeTranslator(actor: Actor, input: { userId: string; locale: string }) {
  assertAdminActor(actor);
  const userId = requireUuid(input.userId, "user_not_found");
  if (!LOCALE_RE.test(input.locale)) throw fail.validation("invalid_locale");
  await db.begin(async (tx) => {
    const r = await tx`delete from tour.translator_assignments where user_id = ${userId}::uuid and locale = ${input.locale} returning user_id`;
    if (r.length === 0) throw fail.notFound("assignment_not_found");
    await audit(tx as unknown as Tx, actor, null, "translator_assignment", userId, "revoked", { locale: input.locale });
  });
}

export async function upsertGlossary(actor: Actor, input: { termKey: string; locale: string; value: string; note?: string | null }) {
  assertAdminActor(actor);
  const key = String(input.termKey ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{0,80}$/.test(key)) throw fail.validation("invalid_term_key");
  if (!LOCALE_RE.test(input.locale)) throw fail.validation("invalid_locale");
  const value = String(input.value ?? "").trim();
  if (!value) throw fail.validation("value_required");
  await db.begin(async (tx) => {
    await tx`insert into tour.glossary (term_key, locale, value, note, updated_at) values (${key}, ${input.locale}, ${value.slice(0, 500)}, ${input.note?.slice(0, 1000) ?? null}, now())
             on conflict (term_key, locale) do update set value = excluded.value, note = excluded.note, updated_at = now()`;
    await audit(tx as unknown as Tx, actor, null, "glossary", null, "glossary_saved", { termKey: key, locale: input.locale });
  });
}

export async function deleteGlossary(actor: Actor, input: { termKey: string; locale: string }) {
  assertAdminActor(actor);
  await db.begin(async (tx) => {
    const r = await tx`delete from tour.glossary where term_key = ${input.termKey} and locale = ${input.locale} returning term_key`;
    if (r.length === 0) throw fail.notFound("glossary_not_found");
    await audit(tx as unknown as Tx, actor, null, "glossary", null, "glossary_deleted", { termKey: input.termKey, locale: input.locale });
  });
}

// ----------------------------------------------------------------------------
// Provider flags (M-023)
// ----------------------------------------------------------------------------

const FLAGS = ["trusted", "watch", "quality_review", "documents_missing", "listing_suspended"];

export async function setProviderFlag(actor: Actor, input: { serviceProviderId: string; flag: string; note: string }) {
  assertAdminActor(actor);
  const providerId = requireUuid(input.serviceProviderId, "provider_not_found");
  if (!FLAGS.includes(input.flag)) throw fail.validation("invalid_flag");
  const note = String(input.note ?? "").trim();
  if (note.length < 5) throw fail.validation("reason_required");
  try {
    await db.begin(async (tx) => {
      await tx`insert into tour.provider_flags (service_provider_id, flag, note, created_by) values (${providerId}::uuid, ${input.flag}, ${note.slice(0, 1000)}, ${actor.userId}::uuid)`;
      await audit(tx as unknown as Tx, actor, providerId, "provider", providerId, "flag_set", { flag: input.flag, note });
    });
  } catch (e) {
    throw mapDbError(e, "setProviderFlag");
  }
}

export async function clearProviderFlag(actor: Actor, flagId: string, note: string) {
  assertAdminActor(actor);
  requireUuid(flagId);
  const reason = String(note ?? "").trim();
  if (reason.length < 5) throw fail.validation("reason_required");
  await db.begin(async (tx) => {
    const r = await tx<any[]>`update tour.provider_flags set cleared_at = now(), cleared_by = ${actor.userId}::uuid where id = ${flagId}::uuid and cleared_at is null
                               returning service_provider_id::text, flag`;
    if (r.length === 0) throw fail.notFound("flag_not_found");
    await audit(tx as unknown as Tx, actor, r[0].service_provider_id, "provider", r[0].service_provider_id, "flag_cleared", { flag: r[0].flag, note: reason });
  });
}
