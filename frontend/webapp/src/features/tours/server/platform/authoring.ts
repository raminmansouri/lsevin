import "server-only";

import db from "@/config/database/db";

import { addDaysIso, instantToLocalIso, isCalendarId, isIsoDate, LocalTimeError, localToInstant, parseCalendarInput, type CalendarId } from "../../domain/calendar";
import { normalizeRules } from "../../domain/cancellation";
import { TOUR_TEXT_FIELDS } from "../../domain/content";
import { fromPrice, TRAVELER_CLASSES } from "../../domain/pricing";
import { expandRule } from "../../domain/recurrence";

import { requireProviderRole, translatorLocales, type Actor, type ProviderRole } from "./roles";
import { audit } from "./booking";
import { fail, mapDbError } from "./errors";
import { getTourSettings } from "./settings";

/**
 * Tour write model. Every function authorizes the actor against the tour's
 * owning provider (looked up from the database, never taken from the client)
 * and touches only an explicit whitelist of columns (no mass assignment).
 */

type Tx = typeof db;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,100}$/;
const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;

async function tourOwner(tourId: string): Promise<{ serviceProviderId: string; status: string; sourceLocale: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(tourId)) throw fail.notFound("tour_not_found");
  const [t] = await db<any[]>`select service_provider_id::text, status, source_locale from tour.tours where id = ${tourId}::uuid`;
  if (!t) throw fail.notFound("tour_not_found");
  return { serviceProviderId: t.service_provider_id, status: t.status, sourceLocale: t.source_locale };
}

export async function authorizeTour(actor: Actor, tourId: string, minimum: ProviderRole) {
  const owner = await tourOwner(tourId);
  await requireProviderRole(actor, owner.serviceProviderId, minimum);
  return owner;
}

async function bumpRevision(tx: Tx, tourId: string) {
  await tx`update tour.tours set draft_revision = draft_revision + 1, updated_at = now() where id = ${tourId}::uuid`;
}

export async function refreshFromPrice(tx: Tx, tourId: string) {
  const options = await tx<any[]>`
    select o.id::text, o.kind, o.min_group, o.max_group, o.private_group_price,
           coalesce(json_agg(json_build_object('travelerClass', p.traveler_class, 'amount', p.amount)) filter (where p.id is not null), '[]') as tiers
      from tour.options o left join tour.price_tiers p on p.option_id = o.id
     where o.tour_id = ${tourId}::uuid and o.is_active group by o.id`;
  const fp = fromPrice(options.map((o) => ({
    id: o.id, kind: o.kind, minGroup: o.min_group, maxGroup: o.max_group,
    privateGroupPrice: o.private_group_price == null ? null : Number(o.private_group_price),
    tiers: (o.tiers as any[]).map((t) => ({ travelerClass: t.travelerClass, amount: Number(t.amount) })),
  })));
  await tx`update tour.tours set from_price = ${fp?.amount ?? null} where id = ${tourId}::uuid`;
}

// ----------------------------------------------------------------------------
// Create / core fields
// ----------------------------------------------------------------------------

export type CreateTourInput = {
  serviceProviderId: string;
  slug: string;
  sourceLocale: string;
  currency: string;
  title: string;
  tourType?: string;
  timezone?: string;
  destinationId?: string | null;
};

export async function createTour(actor: Actor, input: CreateTourInput): Promise<{ id: string }> {
  await requireProviderRole(actor, input.serviceProviderId, "editor");
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw fail.validation("invalid_slug");
  if (!LOCALE_RE.test(input.sourceLocale)) throw fail.validation("invalid_locale");
  if (!input.title?.trim()) throw fail.validation("title_required");
  try {
    return await db.begin(async (tx) => {
      const [cur] = await tx<any[]>`select 1 from finance.currencies where code = ${input.currency} and is_active`;
      if (!cur) throw fail.validation("invalid_currency");
      const [t] = await tx<any[]>`
        insert into tour.tours (service_provider_id, slug, source_locale, currency_code, tour_type, timezone, destination_id, created_by)
        values (${input.serviceProviderId}::uuid, ${slug}, ${input.sourceLocale}, ${input.currency}, ${input.tourType ?? "single_day"},
                ${input.timezone ?? "Asia/Tehran"}, ${input.destinationId ?? null}, ${actor.userId}::uuid)
        returning id::text`;
      await upsertContentRows(tx as unknown as Tx, t.id, input.sourceLocale, input.sourceLocale, "tour", t.id, { title: input.title.trim() }, actor.userId);
      await tx`select tour.ensure_booking_anchor(${t.id}::uuid)`;
      await tx`select tour.refresh_search_text(${t.id}::uuid)`;
      await audit(tx as unknown as Tx, actor, input.serviceProviderId, "tour", t.id, "created", { slug });
      return { id: t.id };
    });
  } catch (e) {
    throw mapDbError(e, "createTour");
  }
}

const CORE_FIELDS = {
  destinationId: "destination_id", tourType: "tour_type", categoryCodes: "category_codes", tagCodes: "tag_codes",
  transportModes: "transport_modes", difficulty: "difficulty", activityLevel: "activity_level", durationMinutes: "duration_minutes",
  durationDays: "duration_days", nights: "nights", minParticipants: "min_participants", maxParticipants: "max_participants",
  minAge: "min_age", maxAge: "max_age", guideLanguages: "guide_languages", confirmationMode: "confirmation_mode",
  requestTimeoutHours: "request_timeout_hours", bookingCutoffMinutes: "booking_cutoff_minutes", timezone: "timezone",
  meetingLat: "meeting_lat", meetingLng: "meeting_lng", endLat: "end_lat", endLng: "end_lng",
  locationPrivacy: "location_privacy", approxRadiusM: "approx_radius_m", pickupAvailable: "pickup_available",
  privateAvailable: "private_available", wheelchairAccessible: "wheelchair_accessible", lowMobilityFriendly: "low_mobility_friendly",
  familyFriendly: "family_friendly", recoveryFriendly: "recovery_friendly",
} as const;
export type TourCorePatch = Partial<Record<keyof typeof CORE_FIELDS, unknown>>;

export async function updateTourCore(actor: Actor, tourId: string, patch: TourCorePatch) {
  const owner = await authorizeTour(actor, tourId, "editor");
  const entries = Object.entries(patch).filter(([k]) => k in CORE_FIELDS);
  if (entries.length === 0) return;
  if (patch.timezone !== undefined) {
    try { new Intl.DateTimeFormat("en", { timeZone: String(patch.timezone) }); } catch { throw fail.validation("invalid_timezone"); }
  }
  const values: Record<string, unknown> = {};
  for (const [k, v] of entries) values[CORE_FIELDS[k as keyof typeof CORE_FIELDS]] = v;
  // Changing accessibility/recovery claims voids their platform verification (S-046).
  if (["wheelchairAccessible", "lowMobilityFriendly", "recoveryFriendly"].some((k) => k in patch) && !actor.isAdmin) {
    values.attributes_verified_at = null;
  }
  try {
    await db.begin(async (tx) => {
      await tx`update tour.tours set ${tx(values)}, updated_at = now() where id = ${tourId}::uuid`;
      await bumpRevision(tx as unknown as Tx, tourId);
      await tx`select tour.refresh_search_text(${tourId}::uuid)`;
      await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", tourId, "core_updated", { fields: Object.keys(values) });
    });
  } catch (e) {
    throw mapDbError(e, "updateTourCore");
  }
}

// ----------------------------------------------------------------------------
// Localized content (V-057..V-066, M-028..M-033)
// ----------------------------------------------------------------------------

const ENTITY_FIELDS: Record<string, readonly string[]> = {
  tour: TOUR_TEXT_FIELDS,
  stop: ["title", "description", "instructions"],
  option: ["label", "notes"],
  addon: ["label"],
  faq: ["question", "answer"],
  guide: ["bio"],
};

async function upsertContentRows(
  tx: Tx, tourId: string, sourceLocale: string, locale: string, entityType: string, entityId: string,
  fields: Record<string, string | null>, userId: string | null, opts: { status?: "draft" | "submitted"; machine?: boolean } = {},
) {
  const allowed = ENTITY_FIELDS[entityType] ?? [];
  const isSource = locale === sourceLocale;
  for (const [field, raw] of Object.entries(fields)) {
    if (!allowed.includes(field)) throw fail.validation("unknown_field", { field });
    const value = raw == null ? null : String(raw).slice(0, 20_000);
    const [src] = isSource ? [] : await tx<any[]>`
      select revision from tour.content where entity_type = ${entityType} and entity_id = ${entityId}::uuid and field_key = ${field} and is_source`;
    await tx`
      insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, status, is_source, source_revision, machine_translated, updated_by)
      values (${tourId}::uuid, ${entityType}, ${entityId}::uuid, ${field}, ${locale}, ${value},
              ${value == null || value.trim() === "" ? "missing" : opts.status ?? "draft"}, ${isSource},
              ${isSource ? null : src?.revision ?? null}, ${Boolean(opts.machine)}, ${userId}::uuid)
      on conflict (entity_type, entity_id, field_key, locale) do update
        set draft_value = excluded.draft_value,
            status = case when excluded.draft_value is null or btrim(excluded.draft_value) = '' then 'missing' else excluded.status end,
            source_revision = coalesce(excluded.source_revision, tour.content.source_revision),
            machine_translated = excluded.machine_translated,
            updated_by = excluded.updated_by, updated_at = now()
    `;
  }
}

/**
 * Saves text for ONE locale. Other locales are never touched (AT-36); the
 * source-locale trigger flags dependent translations outdated (AT-37).
 * Translators may only write their assigned locales and only text (AT-38).
 */
export async function saveContent(
  actor: Actor,
  tourId: string,
  input: { locale: string; entityType?: string; entityId?: string; fields: Record<string, string | null>; submit?: boolean; machineTranslated?: boolean },
) {
  const owner = await tourOwner(tourId);
  if (!LOCALE_RE.test(input.locale)) throw fail.validation("invalid_locale");
  if (!actor.userId) throw fail.auth();
  let asTranslator = false;
  try {
    await requireProviderRole(actor, owner.serviceProviderId, "editor");
  } catch {
    const locales = await translatorLocales(actor.userId, owner.serviceProviderId);
    if (!locales.includes(input.locale) || input.locale === owner.sourceLocale) throw fail.forbidden("locale_not_assigned");
    asTranslator = true;
  }
  const settings = await getTourSettings();
  if (!settings.enabledLocales.includes(input.locale) && input.locale !== owner.sourceLocale) throw fail.validation("locale_not_enabled");
  const entityType = input.entityType ?? "tour";
  const entityId = input.entityId ?? tourId;
  if (entityType !== "tour") {
    if (!/^[0-9a-f-]{36}$/i.test(entityId)) throw fail.validation("entity_not_in_tour");
    const owned =
      entityType === "stop" ? await db`select 1 from tour.itinerary_stops where id = ${entityId}::uuid and tour_id = ${tourId}::uuid`
      : entityType === "option" ? await db`select 1 from tour.options where id = ${entityId}::uuid and tour_id = ${tourId}::uuid`
      : entityType === "addon" ? await db`select 1 from tour.addons where id = ${entityId}::uuid and tour_id = ${tourId}::uuid`
      : [];
    if (owned.length === 0) throw fail.validation("entity_not_in_tour");
  }
  // Machine translations of legal, safety, pricing or meeting instructions are
  // never auto-published: they are stored as drafts needing review (V-066).
  try {
    await db.begin(async (tx) => {
      await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, input.locale, entityType, entityId, input.fields, actor.userId,
        { status: input.submit || asTranslator ? "submitted" : "draft", machine: input.machineTranslated });
      await bumpRevision(tx as unknown as Tx, tourId);
      if (entityType === "tour") await tx`select tour.refresh_search_text(${tourId}::uuid)`;
      await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "content", tourId, "content_saved",
        { locale: input.locale, entityType, fields: Object.keys(input.fields), asTranslator });
    });
  } catch (e) {
    throw mapDbError(e, "saveContent");
  }
}

/** Approve submitted text for a locale; live immediately if the tour is published (M-028). */
export async function approveContent(actor: Actor, tourId: string, locale: string, opts: { fieldKeys?: string[] } = {}) {
  const owner = await tourOwner(tourId);
  if (!actor.userId) throw fail.auth();
  if (!actor.isAdmin) {
    const locales = await translatorLocales(actor.userId, owner.serviceProviderId);
    if (!locales.includes(locale)) throw fail.forbidden("locale_not_assigned");
  }
  await db.begin(async (tx) => {
    const published = owner.status === "published";
    await tx`
      update tour.content
         set status = ${published ? "published" : "approved"},
             published_value = case when ${published} then draft_value else published_value end,
             published_at = case when ${published} then now() else published_at end,
             approved_by = ${actor.userId}::uuid, approved_at = now(),
             source_revision = coalesce((select s.revision from tour.content s where s.entity_type = tour.content.entity_type
                                           and s.entity_id = tour.content.entity_id and s.field_key = tour.content.field_key and s.is_source), source_revision)
       where tour_id = ${tourId}::uuid and locale = ${locale}
         and status in ('draft','submitted','outdated')
         and draft_value is not null and btrim(draft_value) <> ''
         and (${opts.fieldKeys ?? null}::text[] is null or field_key = any(${opts.fieldKeys ?? null}::text[]))
    `;
    await syncPolicyTexts(tx as unknown as Tx, tourId);
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "content", tourId, "content_approved", { locale, fields: opts.fieldKeys ?? "all" });
  });
}

/**
 * Customers read cancellation text from the current policy version, but
 * translators approve it as tour.content (field cancellation_policy). Copy every
 * published translation into the current version so an approved translation
 * actually reaches customers, and clear its "outdated" mark. Existing bookings
 * are unaffected: each carries its own frozen policy_snapshot (AT-13).
 */
async function syncPolicyTexts(tx: Tx, tourId: string) {
  await tx`
    update tour.policy_versions pv
       set texts = pv.texts || coalesce((
             select jsonb_object_agg(c.locale,
                      coalesce(pv.texts -> c.locale, '{}'::jsonb)
                      || jsonb_build_object('cancellation', c.published_value, 'outdated', false))
               from tour.content c
              where c.tour_id = pv.tour_id and c.entity_type = 'tour' and c.entity_id = pv.tour_id
                and c.field_key = 'cancellation_policy' and c.status = 'published'
                and c.published_value is not null and btrim(c.published_value) <> ''), '{}'::jsonb)
     where pv.tour_id = ${tourId}::uuid
       and pv.version = (select max(version) from tour.policy_versions where tour_id = ${tourId}::uuid)
  `;
}

export async function contentForEditor(actor: Actor, tourId: string) {
  const owner = await tourOwner(tourId);
  if (!actor.isAdmin) {
    try { await requireProviderRole(actor, owner.serviceProviderId, "viewer"); }
    catch {
      const locales = actor.userId ? await translatorLocales(actor.userId, owner.serviceProviderId) : [];
      if (locales.length === 0) throw fail.forbidden();
    }
  }
  return db<any[]>`
    select entity_type, entity_id::text, field_key, locale, draft_value, published_value, status, is_source, revision, source_revision,
           machine_translated, updated_by::text, updated_at, approved_by::text, approved_at
      from tour.content where tour_id = ${tourId}::uuid order by entity_type, field_key, locale`;
}

// ----------------------------------------------------------------------------
// Media (V-014, M-006)
// ----------------------------------------------------------------------------

const MEDIA_URL_RE = /^(https:\/\/|\/)[^\s<>"']{1,1000}$/;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]);

export async function addMedia(actor: Actor, tourId: string, input: { url: string; kind?: "image" | "video" | "panorama"; album?: string; mimeType?: string; byteSize?: number; width?: number; height?: number; alt?: Record<string, string>; caption?: Record<string, string>; isCover?: boolean }) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!MEDIA_URL_RE.test(input.url)) throw fail.validation("invalid_media_url");
  if (input.mimeType && !ALLOWED_MIME.has(input.mimeType)) throw fail.validation("unsupported_media_type");
  if (input.byteSize && input.byteSize > 25 * 1024 * 1024) throw fail.validation("media_too_large");
  if ((input.kind ?? "image") === "image" && input.width && input.height && (input.width < 600 || input.height < 400)) throw fail.validation("image_too_small");
  return db.begin(async (tx) => {
    if (input.isCover) await tx`update tour.media set is_cover = false where tour_id = ${tourId}::uuid`;
    const [m] = await tx<any[]>`
      insert into tour.media (tour_id, kind, url, album, sort_order, is_cover, width, height, byte_size, mime_type, alt_translations, caption_translations,
                              moderation_status, created_by)
      values (${tourId}::uuid, ${input.kind ?? "image"}, ${input.url}, ${input.album ?? "main"},
              coalesce((select max(sort_order) + 1 from tour.media where tour_id = ${tourId}::uuid), 0), ${Boolean(input.isCover)},
              ${input.width ?? null}, ${input.height ?? null}, ${input.byteSize ?? null}, ${input.mimeType ?? null},
              ${db.json(input.alt ?? {} as never)}, ${db.json(input.caption ?? {} as never)},
              ${actor.isAdmin ? "approved" : "pending"}, ${actor.userId}::uuid)
      returning id::text`;
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "media", m.id, "media_added", { tourId });
    return { id: m.id as string };
  });
}

export async function reorderMedia(actor: Actor, tourId: string, orderedIds: string[]) {
  await authorizeTour(actor, tourId, "editor");
  await db.begin(async (tx) => {
    let i = 0;
    for (const id of orderedIds) {
      await tx`update tour.media set sort_order = ${i++} where id = ${id}::uuid and tour_id = ${tourId}::uuid`;
    }
  });
}

/** Removing an image that the published listing still relies on as its only image is refused (V-014). */
export async function removeMedia(actor: Actor, tourId: string, mediaId: string) {
  const owner = await authorizeTour(actor, tourId, "editor");
  await db.begin(async (tx) => {
    if (owner.status === "published") {
      const [c] = await tx<any[]>`select count(*)::int as n from tour.media where tour_id = ${tourId}::uuid and moderation_status = 'approved' and kind = 'image' and id <> ${mediaId}::uuid`;
      if (c.n === 0) throw fail.conflict("last_published_image");
    }
    const r = await tx`delete from tour.media where id = ${mediaId}::uuid and tour_id = ${tourId}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("media_not_found");
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "media", mediaId, "media_removed", { tourId });
  });
}

export async function moderateMedia(actor: Actor, mediaId: string, decision: "approved" | "rejected", note?: string) {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  const r = await db<any[]>`update tour.media set moderation_status = ${decision}, moderation_note = ${note ?? null} where id = ${mediaId}::uuid returning tour_id::text`;
  if (r.length === 0) throw fail.notFound("media_not_found");
  await audit(db, actor, null, "media", mediaId, `media_${decision}`, { note });
}

// ----------------------------------------------------------------------------
// Itinerary (V-016, C-055/C-056, V-021)
// ----------------------------------------------------------------------------

export type StopInput = {
  id?: string;
  day: number;
  position: number;
  type: string;
  lat?: number | null;
  lng?: number | null;
  exact?: boolean;
  startTime?: string | null;
  durationMinutes?: number | null;
  transportMode?: string | null;
  travelMinutesFromPrev?: number | null;
  distanceKmFromPrev?: number | null;
  imageUrl?: string | null;
  included?: boolean;
  text?: { title?: string; description?: string; instructions?: string }; // in `locale`
};

/** Replaces the itinerary; text is written for one locale only. Returns whether the change is material. */
export async function saveItinerary(actor: Actor, tourId: string, locale: string, stops: StopInput[], changeSummary?: string) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (stops.length > 200) throw fail.validation("too_many_stops");
  const seen = new Set<string>();
  for (const s of stops) {
    if (!Number.isInteger(s.day) || s.day < 1 || !Number.isInteger(s.position) || s.position < 1) throw fail.validation("invalid_stop_order");
    const k = `${s.day}:${s.position}`;
    if (seen.has(k)) throw fail.validation("duplicate_stop_position");
    seen.add(k);
    if ((s.lat == null) !== (s.lng == null)) throw fail.validation("invalid_coordinates");
    if (s.lat != null && (s.lat < -90 || s.lat > 90 || s.lng! < -180 || s.lng! > 180)) throw fail.validation("invalid_coordinates");
    if (s.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.startTime)) throw fail.validation("invalid_time");
  }
  try {
    return await db.begin(async (tx) => {
      const before = await tx<any[]>`select id::text, day_number, position, stop_type, latitude, longitude, start_time::text from tour.itinerary_stops where tour_id = ${tourId}::uuid order by day_number, position`;
      const keep = stops.filter((s) => s.id).map((s) => s.id!);
      await tx`delete from tour.itinerary_stops where tour_id = ${tourId}::uuid and not (id = any(${keep}::uuid[]))`;
      await tx`delete from tour.content where entity_type = 'stop' and tour_id = ${tourId}::uuid and not (entity_id = any(${keep}::uuid[]))`;
      for (const s of stops) {
        const values = {
          tour_id: tourId, day_number: s.day, position: s.position, stop_type: s.type, latitude: s.lat ?? null, longitude: s.lng ?? null,
          location_exact: s.exact ?? true, start_time: s.startTime ?? null, duration_minutes: s.durationMinutes ?? null,
          transport_mode: s.transportMode ?? null, travel_minutes_from_prev: s.travelMinutesFromPrev ?? null,
          distance_km_from_prev: s.distanceKmFromPrev ?? null, image_url: s.imageUrl ?? null, included: s.included ?? true,
        };
        let id = s.id;
        if (id) {
          const r = await tx`update tour.itinerary_stops set ${tx(values)}, updated_at = now() where id = ${id}::uuid and tour_id = ${tourId}::uuid returning id`;
          if (r.length === 0) throw fail.validation("stop_not_in_tour");
        } else {
          const [row] = await tx<any[]>`insert into tour.itinerary_stops ${tx(values)} returning id::text`;
          id = row.id;
        }
        if (s.text) {
          await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, locale, "stop", id!,
            Object.fromEntries(Object.entries(s.text).filter(([, v]) => v !== undefined)) as Record<string, string>, actor.userId);
        }
      }
      const after = await tx<any[]>`select id::text, day_number, position, stop_type, latitude, longitude, start_time::text from tour.itinerary_stops where tour_id = ${tourId}::uuid order by day_number, position`;
      const material = JSON.stringify(before.map((b) => [b.stop_type, b.latitude, b.longitude, b.start_time, b.day_number]))
        !== JSON.stringify(after.map((b) => [b.stop_type, b.latitude, b.longitude, b.start_time, b.day_number]));
      await bumpRevision(tx as unknown as Tx, tourId);
      const [rev] = await tx<any[]>`select draft_revision from tour.tours where id = ${tourId}::uuid`;
      await tx`insert into tour.revisions (tour_id, revision, snapshot, material_change, change_summary, created_by)
               values (${tourId}::uuid, ${rev.draft_revision}, ${db.json({ itinerary: after } as never)}, ${material}, ${changeSummary ?? null}, ${actor.userId}::uuid)
               on conflict (tour_id, revision) do nothing`;
      await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "itinerary", tourId, "itinerary_saved", { stops: stops.length, material });
      return { material, revision: rev.draft_revision as number };
    });
  } catch (e) {
    throw mapDbError(e, "saveItinerary");
  }
}

// ----------------------------------------------------------------------------
// Options, prices, add-ons (V-018, V-028)
// ----------------------------------------------------------------------------

export type OptionInput = {
  code: string; kind: "public" | "private"; pickupIncluded?: boolean; guideLanguage?: string | null;
  minGroup?: number; maxGroup?: number | null; privateGroupPrice?: number | null; isActive?: boolean;
  tiers: { travelerClass: string; amount: number; minAge?: number | null; maxAge?: number | null }[];
  label?: string; // in `locale`
};

export async function saveOptions(actor: Actor, tourId: string, locale: string, options: OptionInput[]) {
  const owner = await authorizeTour(actor, tourId, "editor");
  for (const o of options) {
    if (!/^[a-z0-9][a-z0-9_-]{0,40}$/.test(o.code)) throw fail.validation("invalid_option_code");
    for (const t of o.tiers) {
      if (!(TRAVELER_CLASSES as readonly string[]).includes(t.travelerClass)) throw fail.validation("invalid_traveler_class");
      if (!Number.isFinite(t.amount) || t.amount < 0) throw fail.validation("invalid_price");
    }
    if (o.kind === "private" && (o.privateGroupPrice == null || o.privateGroupPrice < 0)) throw fail.validation("private_price_required");
  }
  try {
    await db.begin(async (tx) => {
      const codes = options.map((o) => o.code);
      await tx`update tour.options set is_active = false where tour_id = ${tourId}::uuid and not (code = any(${codes}::text[]))`;
      let sort = 0;
      for (const o of options) {
        const [row] = await tx<any[]>`
          insert into tour.options (tour_id, code, kind, pickup_included, guide_language, min_group, max_group, private_group_price, is_active, sort_order)
          values (${tourId}::uuid, ${o.code}, ${o.kind}, ${Boolean(o.pickupIncluded)}, ${o.guideLanguage ?? null}, ${o.minGroup ?? 1},
                  ${o.maxGroup ?? null}, ${o.privateGroupPrice ?? null}, ${o.isActive ?? true}, ${sort++})
          on conflict (tour_id, code) do update set kind = excluded.kind, pickup_included = excluded.pickup_included,
             guide_language = excluded.guide_language, min_group = excluded.min_group, max_group = excluded.max_group,
             private_group_price = excluded.private_group_price, is_active = excluded.is_active, sort_order = excluded.sort_order
          returning id::text`;
        const classes = o.tiers.map((t) => t.travelerClass);
        await tx`delete from tour.price_tiers where option_id = ${row.id}::uuid and not (traveler_class = any(${classes}::text[]))`;
        for (const t of o.tiers) {
          await tx`
            insert into tour.price_tiers (option_id, traveler_class, amount, min_age, max_age)
            values (${row.id}::uuid, ${t.travelerClass}, ${t.amount}, ${t.minAge ?? null}, ${t.maxAge ?? null})
            on conflict (option_id, traveler_class) do update set amount = excluded.amount, min_age = excluded.min_age, max_age = excluded.max_age`;
        }
        if (o.label) await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, locale, "option", row.id, { label: o.label }, actor.userId);
      }
      await tx`update tour.tours set private_available = exists (select 1 from tour.options where tour_id = ${tourId}::uuid and kind = 'private' and is_active) where id = ${tourId}::uuid`;
      await refreshFromPrice(tx as unknown as Tx, tourId);
      await tx`select tour.ensure_booking_anchor(${tourId}::uuid)`;
      await bumpRevision(tx as unknown as Tx, tourId);
      await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "options", tourId, "options_saved", { codes });
    });
  } catch (e) {
    throw mapDbError(e, "saveOptions");
  }
}

export async function saveAddons(actor: Actor, tourId: string, locale: string, addons: { code: string; pricing: "per_person" | "per_booking"; amount: number; maxQty?: number; isActive?: boolean; label?: string }[]) {
  const owner = await authorizeTour(actor, tourId, "editor");
  await db.begin(async (tx) => {
    const codes = addons.map((a) => a.code);
    await tx`update tour.addons set is_active = false where tour_id = ${tourId}::uuid and not (code = any(${codes}::text[]))`;
    let sort = 0;
    for (const a of addons) {
      if (!Number.isFinite(a.amount) || a.amount < 0) throw fail.validation("invalid_price");
      const [row] = await tx<any[]>`
        insert into tour.addons (tour_id, code, pricing, amount, max_qty, is_active, sort_order)
        values (${tourId}::uuid, ${a.code}, ${a.pricing}, ${a.amount}, ${a.maxQty ?? 1}, ${a.isActive ?? true}, ${sort++})
        on conflict (tour_id, code) do update set pricing = excluded.pricing, amount = excluded.amount, max_qty = excluded.max_qty,
           is_active = excluded.is_active, sort_order = excluded.sort_order
        returning id::text`;
      if (a.label) await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, locale, "addon", row.id, { label: a.label }, actor.userId);
    }
    await bumpRevision(tx as unknown as Tx, tourId);
  });
}

// ----------------------------------------------------------------------------
// Policy versions (C-090, AT-13) — never edited in place
// ----------------------------------------------------------------------------

export async function createPolicyVersion(actor: Actor, tourId: string, input: {
  cancellationRules: { hoursBefore: number; refundPercent: number }[];
  noShowRefundPercent?: number; lateArrivalMinutes?: number | null;
  weatherPolicy?: "reschedule_or_refund" | "full_refund" | "operator_decides" | "no_refund";
  texts: Record<string, { cancellation?: string; rules?: string }>;
}) {
  const owner = await authorizeTour(actor, tourId, "editor");
  const rules = normalizeRules(input.cancellationRules);
  if (rules.length !== input.cancellationRules.length) throw fail.validation("invalid_cancellation_rules");
  for (const loc of Object.keys(input.texts)) if (!LOCALE_RE.test(loc)) throw fail.validation("invalid_locale");
  if (!input.texts[owner.sourceLocale]?.cancellation?.trim()) throw fail.validation("source_cancellation_text_required");
  return db.begin(async (tx) => {
    const [prev] = await tx<any[]>`select texts from tour.policy_versions where tour_id = ${tourId}::uuid order by version desc limit 1`;
    // Text for locales not supplied is carried over from the previous version,
    // but a changed source text marks those carried translations as needing review.
    const prevTexts = (prev?.texts ?? {}) as Record<string, { cancellation?: string; rules?: string; outdated?: boolean }>;
    const sourceChanged = prevTexts[owner.sourceLocale]?.cancellation !== input.texts[owner.sourceLocale]?.cancellation
      || prevTexts[owner.sourceLocale]?.rules !== input.texts[owner.sourceLocale]?.rules;
    const merged: Record<string, unknown> = {};
    for (const [loc, v] of Object.entries(prevTexts)) merged[loc] = sourceChanged && loc !== owner.sourceLocale ? { ...v, outdated: true } : v;
    for (const [loc, v] of Object.entries(input.texts)) merged[loc] = { ...v, outdated: false };
    const [pv] = await tx<any[]>`
      insert into tour.policy_versions (tour_id, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts, created_by)
      values (${tourId}::uuid, coalesce((select max(version) from tour.policy_versions where tour_id = ${tourId}::uuid), 0) + 1,
              ${db.json(rules as never)}, ${input.noShowRefundPercent ?? 0}, ${input.lateArrivalMinutes ?? null},
              ${input.weatherPolicy ?? "reschedule_or_refund"}, ${db.json(merged as never)}, ${actor.userId}::uuid)
      returning id::text, version`;
    await tx`update tour.tours set current_policy_version = ${pv.version}, updated_at = now() where id = ${tourId}::uuid`;
    // Mirror the source cancellation text into tour.content so publish checks see it.
    await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, owner.sourceLocale, "tour", tourId,
      { cancellation_policy: input.texts[owner.sourceLocale]!.cancellation! }, actor.userId);
    for (const [loc, v] of Object.entries(input.texts)) {
      if (loc !== owner.sourceLocale && v.cancellation) {
        await upsertContentRows(tx as unknown as Tx, tourId, owner.sourceLocale, loc, "tour", tourId, { cancellation_policy: v.cancellation }, actor.userId);
      }
    }
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "policy", tourId, "policy_version_created", { version: pv.version, sourceChanged });
    return { id: pv.id as string, version: pv.version as number };
  });
}

// ----------------------------------------------------------------------------
// Schedules, departures, blackouts, price rules (V-025..V-029, V-061, S-065)
// ----------------------------------------------------------------------------

/** A date typed in any supported calendar → canonical ISO (or a validation error). */
export function dateFromCalendar(value: string, calendar: CalendarId): string {
  if (isIsoDate(value) && calendar === "gregory") return value;
  const iso = parseCalendarInput(value, calendar);
  if (!iso) throw fail.validation("invalid_date", { value, calendar });
  return iso;
}

export async function addScheduleRule(actor: Actor, tourId: string, input: {
  optionId?: string | null; calendar: string; kind: "once" | "weekly" | "monthly_day"; weekdays?: number[]; monthDay?: number | null;
  localTime: string; startDate: string; endDate?: string | null; capacity: number;
}) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!isCalendarId(input.calendar)) throw fail.validation("invalid_calendar");
  const start = dateFromCalendar(input.startDate, input.calendar);
  const end = input.endDate ? dateFromCalendar(input.endDate, input.calendar) : null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.localTime)) throw fail.validation("invalid_time");
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 10_000) throw fail.validation("invalid_capacity");
  try {
    const [r] = await db<any[]>`
      insert into tour.schedule_rules (tour_id, option_id, calendar, kind, weekdays, month_day, local_time, start_date, end_date, capacity, created_by)
      values (${tourId}::uuid, ${input.optionId ?? null}, ${input.calendar}, ${input.kind}, ${input.weekdays ?? []}::smallint[], ${input.monthDay ?? null},
              ${input.localTime}::time, ${start}::date, ${end}::date, ${input.capacity}, ${actor.userId}::uuid)
      returning id::text`;
    await audit(db, actor, owner.serviceProviderId, "schedule_rule", r.id, "created", { calendar: input.calendar, kind: input.kind });
    const materialized = await materializeDepartures(actor, tourId);
    return { id: r.id as string, ...materialized };
  } catch (e) {
    throw mapDbError(e, "addScheduleRule");
  }
}

/**
 * Turns active rules into concrete departures for the next `horizonDays`.
 * Idempotent (unique slot index). Local times that do not exist / repeat in
 * the tour's timezone are reported, not silently shifted (S-066).
 */
export async function materializeDepartures(actor: Actor, tourId: string, horizonDays = 180) {
  const owner = await authorizeTour(actor, tourId, "editor");
  const [t] = await db<any[]>`select timezone, booking_cutoff_minutes from tour.tours where id = ${tourId}::uuid`;
  const today = instantToLocalIso(new Date(), t.timezone);
  const window = { from: today, to: addDaysIso(today, horizonDays) };
  const rules = await db<any[]>`select id::text, option_id::text, calendar, kind, weekdays, month_day, local_time::text, start_date::text, end_date::text, capacity
                                  from tour.schedule_rules where tour_id = ${tourId}::uuid and is_active`;
  const blackouts = (await db<any[]>`select date_from::text, date_to::text from tour.blackouts where tour_id = ${tourId}::uuid`)
    .map((b) => ({ from: b.date_from, to: b.date_to }));
  let created = 0;
  const rejected: { date: string; time: string; reason: string }[] = [];
  for (const rule of rules) {
    const dates = expandRule({ kind: rule.kind, calendar: rule.calendar, startDate: rule.start_date, endDate: rule.end_date, weekdays: rule.weekdays, monthDay: rule.month_day }, window, blackouts);
    const time = String(rule.local_time).slice(0, 5);
    for (const date of dates) {
      let startsAt: Date;
      try { startsAt = localToInstant(date, time, t.timezone); }
      catch (e) { rejected.push({ date, time, reason: e instanceof LocalTimeError ? e.code : "invalid" }); continue; }
      if (startsAt.getTime() <= Date.now()) continue;
      const r = await db`
        insert into tour.departures (tour_id, option_id, schedule_rule_id, service_provider_id, provider_service_id, starts_on, ends_on, local_start_time, timezone, starts_at, capacity)
        select ${tourId}::uuid, ${rule.option_id}::uuid, ${rule.id}::uuid, t.service_provider_id, t.provider_service_id, ${date}::date,
               ${date}::date + (t.duration_days - 1), ${time}::time, t.timezone, ${startsAt}, ${rule.capacity}
          from tour.tours t where t.id = ${tourId}::uuid
        on conflict do nothing returning id`;
      created += r.length;
    }
  }
  await audit(db, actor, owner.serviceProviderId, "departures", tourId, "materialized", { created, rejected: rejected.length });
  return { created, rejected };
}

export async function addBlackout(actor: Actor, tourId: string, input: { from: string; to: string; calendar: string; reason?: string }) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!isCalendarId(input.calendar)) throw fail.validation("invalid_calendar");
  const from = dateFromCalendar(input.from, input.calendar);
  const to = dateFromCalendar(input.to, input.calendar);
  if (to < from) throw fail.validation("invalid_range");
  return db.begin(async (tx) => {
    const [b] = await tx<any[]>`insert into tour.blackouts (tour_id, date_from, date_to, reason, entered_calendar, created_by)
                                values (${tourId}::uuid, ${from}::date, ${to}::date, ${input.reason ?? null}, ${input.calendar}, ${actor.userId}::uuid) returning id::text`;
    // Unsold departures in the range are blocked; sold ones need an explicit operator cancellation.
    const blocked = await tx`update tour.departures set is_blocked = true, status_reason = 'blackout', last_modified_date = now()
                              where tour_id = ${tourId}::uuid and starts_on between ${from}::date and ${to}::date and booked_count = 0 and held_count = 0
                              returning id`;
    const conflicts = await tx<any[]>`select id::text from tour.departures where tour_id = ${tourId}::uuid and starts_on between ${from}::date and ${to}::date and booked_count > 0 and status <> 'cancelled'`;
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "blackout", b.id, "created", { from, to, calendar: input.calendar });
    return { id: b.id as string, from, to, blockedDepartures: blocked.length, departuresWithBookings: conflicts.map((c) => c.id) };
  });
}

export async function addPriceRule(actor: Actor, tourId: string, input: { optionId?: string | null; from: string; to: string; calendar: string; kind: "percent" | "amount_delta"; value: number; note?: string }) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!isCalendarId(input.calendar)) throw fail.validation("invalid_calendar");
  const from = dateFromCalendar(input.from, input.calendar);
  const to = dateFromCalendar(input.to, input.calendar);
  if (to < from) throw fail.validation("invalid_range");
  if (!Number.isFinite(input.value) || (input.kind === "percent" && input.value <= -100)) throw fail.validation("invalid_value");
  const [r] = await db<any[]>`
    insert into tour.price_rules (tour_id, option_id, date_from, date_to, kind, value, entered_calendar, note, created_by)
    values (${tourId}::uuid, ${input.optionId ?? null}, ${from}::date, ${to}::date, ${input.kind}, ${input.value}, ${input.calendar}, ${input.note ?? null}, ${actor.userId}::uuid)
    returning id::text`;
  await audit(db, actor, owner.serviceProviderId, "price_rule", r.id, "created", { from, to, kind: input.kind, value: input.value, calendar: input.calendar });
  return { id: r.id as string, from, to };
}

// ----------------------------------------------------------------------------
// Publication workflow (V-012, V-019, M-005, AT-16)
// ----------------------------------------------------------------------------

export type Requirement = { code: string; severity: "error" | "warning"; detail: string | null };

export async function publishRequirements(tourId: string): Promise<Requirement[]> {
  return db<Requirement[]>`select code, severity, detail from tour.publish_requirements(${tourId}::uuid)`;
}

export async function submitForReview(actor: Actor, tourId: string) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!["draft", "rejected", "paused", "published", "approved"].includes(owner.status)) throw fail.conflict("invalid_status_transition");
  const reqs = await publishRequirements(tourId);
  const errors = reqs.filter((r) => r.severity === "error");
  if (errors.length > 0) throw fail.validation("publish_requirements_unmet", { requirements: errors });
  await db.begin(async (tx) => {
    // A published tour stays live while its changes wait for review.
    if (owner.status !== "published") {
      await tx`update tour.tours set status = 'submitted', submitted_at = now(), review_note = null, updated_at = now() where id = ${tourId}::uuid`;
    } else {
      await tx`update tour.tours set submitted_at = now(), updated_at = now() where id = ${tourId}::uuid`;
    }
    await tx`update tour.content set status = 'submitted' where tour_id = ${tourId}::uuid and status = 'draft'`;
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", tourId, "submitted", { warnings: reqs.filter((r) => r.severity === "warning").map((r) => r.code) });
  });
}

/** Admin approval publishes: drafts become live, media approved, anchor activated. */
export async function approveAndPublish(actor: Actor, tourId: string, note?: string) {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  const owner = await tourOwner(tourId);
  if (!["submitted", "approved", "published"].includes(owner.status)) throw fail.conflict("not_submitted");
  const errors = (await publishRequirements(tourId)).filter((r) => r.severity === "error");
  if (errors.length > 0) throw fail.validation("publish_requirements_unmet", { requirements: errors });
  await db.begin(async (tx) => {
    await tx`
      update tour.content set published_value = draft_value, status = 'published', published_at = now(), approved_by = ${actor.userId}::uuid, approved_at = now()
       where tour_id = ${tourId}::uuid and status in ('draft','submitted','approved') and draft_value is not null and btrim(draft_value) <> ''`;
    await tx`update tour.media set moderation_status = 'approved' where tour_id = ${tourId}::uuid and moderation_status = 'pending'`;
    const [t] = await tx<any[]>`
      update tour.tours set status = 'published', approved_at = now(), approved_by = ${actor.userId}::uuid,
             published_at = coalesce(published_at, now()), published_revision = draft_revision, review_note = ${note ?? null}, updated_at = now()
       where id = ${tourId}::uuid returning draft_revision`;
    await tx`insert into tour.revisions (tour_id, revision, snapshot, created_by)
             values (${tourId}::uuid, ${t.draft_revision}, ${db.json({ published: true } as never)}, ${actor.userId}::uuid)
             on conflict (tour_id, revision) do nothing`;
    await tx`select tour.ensure_booking_anchor(${tourId}::uuid)`;
    await tx`select tour.refresh_search_text(${tourId}::uuid)`;
    await syncPolicyTexts(tx as unknown as Tx, tourId);
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", tourId, "published", { note });
  });
}

export async function rejectSubmission(actor: Actor, tourId: string, note: string) {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  if (!note?.trim()) throw fail.validation("rejection_note_required");
  const owner = await tourOwner(tourId);
  await db.begin(async (tx) => {
    if (owner.status === "published") {
      // Rejecting pending edits of a live tour keeps the live version untouched.
      await tx`update tour.content set status = 'draft' where tour_id = ${tourId}::uuid and status = 'submitted'`;
      await tx`update tour.tours set review_note = ${note}, updated_at = now() where id = ${tourId}::uuid`;
    } else {
      await tx`update tour.tours set status = 'rejected', review_note = ${note}, updated_at = now() where id = ${tourId}::uuid`;
    }
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", tourId, "rejected", { note });
  });
}

export async function setTourVisibility(actor: Actor, tourId: string, target: "paused" | "published" | "retired") {
  const owner = await authorizeTour(actor, tourId, "manager");
  const allowed: Record<string, string[]> = {
    paused: ["published"],
    published: ["paused"],
    retired: ["draft", "rejected", "paused", "published", "approved", "submitted"],
  };
  if (!allowed[target].includes(owner.status)) throw fail.conflict("invalid_status_transition");
  if (target === "published" && !actor.isAdmin) {
    // Un-pausing is allowed for the provider only if nothing changed since approval.
    const [t] = await db<any[]>`select draft_revision = published_revision as same from tour.tours where id = ${tourId}::uuid`;
    if (!t?.same) throw fail.conflict("changes_need_review");
  }
  await db.begin(async (tx) => {
    await tx`update tour.tours set status = ${target}, updated_at = now() where id = ${tourId}::uuid`;
    await tx`select tour.ensure_booking_anchor(${tourId}::uuid)`;
    await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", tourId, `status_${target}`, {});
  });
}

/** New unpublished draft; ratings, reviews, bookings and departures are not copied (V-022). */
export async function duplicateTour(actor: Actor, tourId: string, newSlug: string) {
  const owner = await authorizeTour(actor, tourId, "editor");
  if (!SLUG_RE.test(newSlug)) throw fail.validation("invalid_slug");
  try {
    return await db.begin(async (tx) => {
      const [n] = await tx<any[]>`
        insert into tour.tours (service_provider_id, destination_id, slug, tour_type, category_codes, tag_codes, transport_modes, difficulty, activity_level,
          duration_minutes, duration_days, nights, min_participants, max_participants, min_age, max_age, guide_languages, confirmation_mode,
          request_timeout_hours, booking_cutoff_minutes, timezone, currency_code, meeting_lat, meeting_lng, end_lat, end_lng, location_privacy,
          approx_radius_m, pickup_available, private_available, wheelchair_accessible, low_mobility_friendly, family_friendly, recovery_friendly,
          source_locale, duplicated_from, created_by)
        select service_provider_id, destination_id, ${newSlug}, tour_type, category_codes, tag_codes, transport_modes, difficulty, activity_level,
          duration_minutes, duration_days, nights, min_participants, max_participants, min_age, max_age, guide_languages, confirmation_mode,
          request_timeout_hours, booking_cutoff_minutes, timezone, currency_code, meeting_lat, meeting_lng, end_lat, end_lng, location_privacy,
          approx_radius_m, pickup_available, private_available, wheelchair_accessible, low_mobility_friendly, family_friendly, recovery_friendly,
          source_locale, id, ${actor.userId}::uuid
          from tour.tours where id = ${tourId}::uuid returning id::text`;
      await tx`insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, status, is_source, source_revision, updated_by)
               select ${n.id}::uuid, 'tour', ${n.id}::uuid, field_key, locale, coalesce(draft_value, published_value), 'draft', is_source, source_revision, ${actor.userId}::uuid
                 from tour.content where tour_id = ${tourId}::uuid and entity_type = 'tour'`;
      await tx`insert into tour.media (tour_id, kind, url, thumbnail_url, album, sort_order, is_cover, width, height, alt_translations, caption_translations, moderation_status, created_by)
               select ${n.id}::uuid, kind, url, thumbnail_url, album, sort_order, is_cover, width, height, alt_translations, caption_translations, 'pending', ${actor.userId}::uuid
                 from tour.media where tour_id = ${tourId}::uuid and moderation_status <> 'rejected'`;
      const opts = await tx<any[]>`select id::text, code, kind, pickup_included, guide_language, min_group, max_group, private_group_price, sort_order from tour.options where tour_id = ${tourId}::uuid and is_active`;
      for (const o of opts) {
        const [no] = await tx<any[]>`insert into tour.options (tour_id, code, kind, pickup_included, guide_language, min_group, max_group, private_group_price, sort_order)
                                     values (${n.id}::uuid, ${o.code}, ${o.kind}, ${o.pickup_included}, ${o.guide_language}, ${o.min_group}, ${o.max_group}, ${o.private_group_price}, ${o.sort_order}) returning id::text`;
        await tx`insert into tour.price_tiers (option_id, traveler_class, amount, min_age, max_age) select ${no.id}::uuid, traveler_class, amount, min_age, max_age from tour.price_tiers where option_id = ${o.id}::uuid`;
      }
      await tx`insert into tour.policy_versions (tour_id, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts, created_by)
               select ${n.id}::uuid, 1, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts, ${actor.userId}::uuid
                 from tour.policy_versions where tour_id = ${tourId}::uuid order by version desc limit 1`;
      await tx`update tour.tours set current_policy_version = 1 where id = ${n.id}::uuid and exists (select 1 from tour.policy_versions where tour_id = ${n.id}::uuid)`;
      await refreshFromPrice(tx as unknown as Tx, n.id);
      await tx`select tour.ensure_booking_anchor(${n.id}::uuid)`;
      await tx`select tour.refresh_search_text(${n.id}::uuid)`;
      await audit(tx as unknown as Tx, actor, owner.serviceProviderId, "tour", n.id, "duplicated", { from: tourId });
      return { id: n.id as string };
    });
  } catch (e) {
    throw mapDbError(e, "duplicateTour");
  }
}
