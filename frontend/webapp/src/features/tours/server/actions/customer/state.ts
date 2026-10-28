import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import db from "@/config/database/db";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";

import { defaultCalendarForLocale, isCalendarId, type CalendarId } from "../../../domain/calendar";
import { contentLocaleFor, pickTranslation } from "../../../domain/content";
import { GUEST_COOKIE, ownerKey, type Actor } from "../../platform/access";
import { fail } from "../../platform/errors";
import { getTourSettings } from "../../platform/settings";

/**
 * Customer-side state of the Tours app that is not part of the catalog/booking
 * core: intro completion, display preferences, packing checklist, share links,
 * address book, data export/deletion (C-004, C-018, C-058, C-097, C-107,
 * C-109, C-110, S-047). Every function is scoped to the acting user (or the
 * device's guest cookie) — never to an id the client supplies.
 */

export const INTRO_COOKIE = "tours_intro_done";
export const PREFS_COOKIE = "tours_prefs";
const YEAR = 60 * 60 * 24 * 365;

export type NotificationChannels = { in_app: boolean; email: boolean; sms: boolean; push: boolean };

export type CustomerState = {
  introCompletedAt: string | null;
  displayCalendar: CalendarId | null;
  currencyCode: string | null;
  personalizationOptIn: boolean;
  historyOptIn: boolean;
  marketingOptIn: boolean;
  notificationChannels: NotificationChannels;
};

const DEFAULT_CHANNELS: NotificationChannels = { in_app: true, email: true, sms: false, push: true };

export async function getCustomerState(userId: string): Promise<CustomerState | null> {
  const [r] = await db<any[]>`
    select intro_completed_at, display_calendar, currency_code, personalization_opt_in, history_opt_in, marketing_opt_in, notification_channels
      from tour.customer_state where user_id = ${userId}::uuid`;
  if (!r) return null;
  return {
    introCompletedAt: r.intro_completed_at ? new Date(r.intro_completed_at).toISOString() : null,
    displayCalendar: isCalendarId(r.display_calendar) ? r.display_calendar : null,
    currencyCode: r.currency_code ?? null,
    personalizationOptIn: Boolean(r.personalization_opt_in),
    historyOptIn: r.history_opt_in !== false,
    marketingOptIn: Boolean(r.marketing_opt_in),
    notificationChannels: { ...DEFAULT_CHANNELS, ...(r.notification_channels ?? {}) },
  };
}

type StatePatch = Partial<{
  intro_completed_at: Date;
  display_calendar: CalendarId | null;
  currency_code: string | null;
  personalization_opt_in: boolean;
  history_opt_in: boolean;
  marketing_opt_in: boolean;
  notification_channels: NotificationChannels;
}>;

async function upsertState(userId: string, patch: StatePatch) {
  const p = patch;
  await db`
    insert into tour.customer_state (user_id, intro_completed_at, display_calendar, currency_code, personalization_opt_in, history_opt_in, marketing_opt_in, notification_channels)
    values (${userId}::uuid, ${p.intro_completed_at ?? null}, ${p.display_calendar ?? null}::tour.calendar_id, ${p.currency_code ?? null},
            ${p.personalization_opt_in ?? false}, ${p.history_opt_in ?? true}, ${p.marketing_opt_in ?? false},
            ${db.json((p.notification_channels ?? DEFAULT_CHANNELS) as never)})
    on conflict (user_id) do update set
      intro_completed_at = coalesce(tour.customer_state.intro_completed_at, excluded.intro_completed_at),
      display_calendar = case when ${"display_calendar" in p} then excluded.display_calendar else tour.customer_state.display_calendar end,
      currency_code = case when ${"currency_code" in p} then excluded.currency_code else tour.customer_state.currency_code end,
      personalization_opt_in = case when ${"personalization_opt_in" in p} then excluded.personalization_opt_in else tour.customer_state.personalization_opt_in end,
      history_opt_in = case when ${"history_opt_in" in p} then excluded.history_opt_in else tour.customer_state.history_opt_in end,
      marketing_opt_in = case when ${"marketing_opt_in" in p} then excluded.marketing_opt_in else tour.customer_state.marketing_opt_in end,
      notification_channels = case when ${"notification_channels" in p} then excluded.notification_channels else tour.customer_state.notification_channels end,
      updated_at = now()`;
}

// ----------------------------------------------------------------------------
// Intro (C-002..C-005): account-wide for signed-in users, per device for guests.
// ----------------------------------------------------------------------------

export async function isIntroCompleted(actor: Actor): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(INTRO_COOKIE)?.value === "1") return true;
  if (!actor.userId) return false;
  const state = await getCustomerState(actor.userId);
  return Boolean(state?.introCompletedAt);
}

/** Only callable from a server action / route handler (writes a cookie). */
export async function markIntroCompleted(actor: Actor) {
  if (actor.userId) await upsertState(actor.userId, { intro_completed_at: new Date() });
  const jar = await cookies();
  jar.set(INTRO_COOKIE, "1", { httpOnly: false, sameSite: "lax", maxAge: YEAR, path: "/" });
}

// ----------------------------------------------------------------------------
// Display preferences (C-018, C-118, S-053): calendar + display currency are
// independent of the UI language. Account-wide when signed in, cookie otherwise.
// ----------------------------------------------------------------------------

export type CustomerPrefs = { calendar: CalendarId; currency: string | null; calendarIsDefault: boolean };

function readPrefsCookie(raw: string | undefined): { c?: string; cur?: string } {
  if (!raw) return {};
  try {
    // Next.js already URL-decodes cookie values; older values may still be encoded.
    const text = raw.trim().startsWith("{") ? raw : decodeURIComponent(raw);
    const v = JSON.parse(text);
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}

export async function resolvePrefs(actor: Actor, uiLocale: string): Promise<CustomerPrefs> {
  const settings = await getTourSettings();
  const fallback = defaultCalendarForLocale(uiLocale, settings.defaultCalendarByLocale);
  const cookie = readPrefsCookie((await cookies()).get(PREFS_COOKIE)?.value);
  let calendar: CalendarId | null = isCalendarId(cookie.c) ? cookie.c : null;
  let currency: string | null = typeof cookie.cur === "string" && /^[A-Z]{3,5}$/.test(cookie.cur) ? cookie.cur : null;
  if (actor.userId) {
    const state = await getCustomerState(actor.userId).catch(() => null);
    if (state?.displayCalendar) calendar = state.displayCalendar;
    if (state?.currencyCode) currency = state.currencyCode;
  }
  if (!calendar) {
    // No choice saved yet: an Iranian visitor (phone country, else IP, else locale) reads
    // Jalali dates whatever the UI language; others get their language's default.
    // The visitor can still switch calendars in the preferences sheet.
    const iranian = await resolveIsIranianVisitor().catch(() => false);
    if (iranian) return { calendar: "persian", currency, calendarIsDefault: true };
  }
  return { calendar: calendar ?? fallback, currency, calendarIsDefault: !calendar };
}

export async function savePrefs(actor: Actor, patch: { calendar?: string | null; currency?: string | null }) {
  const update: StatePatch = {};
  if (patch.calendar !== undefined) {
    if (patch.calendar !== null && !isCalendarId(patch.calendar)) throw fail.validation("invalid_calendar");
    update.display_calendar = patch.calendar as CalendarId | null;
  }
  if (patch.currency !== undefined) {
    if (patch.currency !== null) {
      const [row] = await db<{ ok: boolean }[]>`select exists (select 1 from finance.currencies where code = ${patch.currency}) as ok`;
      if (!row?.ok) throw fail.validation("invalid_value");
    }
    update.currency_code = patch.currency;
  }
  if (actor.userId) await upsertState(actor.userId, update);
  // The cookie is kept for signed-in users too, so the choice survives sign-out on this device.
  const jar = await cookies();
  const current = readPrefsCookie(jar.get(PREFS_COOKIE)?.value);
  const next = {
    c: "display_calendar" in update ? update.display_calendar ?? undefined : current.c,
    cur: "currency_code" in update ? update.currency_code ?? undefined : current.cur,
  };
  jar.set(PREFS_COOKIE, JSON.stringify(next), { httpOnly: false, sameSite: "lax", maxAge: YEAR, path: "/" });
}

/** Currencies the platform enables for display (finance.currencies.is_display_enabled). */
export async function listDisplayCurrencies(): Promise<string[]> {
  const rows = await db<{ code: string }[]>`
    select code from finance.currencies
     where is_active and is_display_enabled and deleted_at is null and coalesce(asset_class, 'fiat') = 'fiat'
     order by sort_order, code`;
  return rows.map((r) => r.code);
}

export async function saveCommunicationPrefs(
  userId: string,
  patch: Partial<{ channels: NotificationChannels; marketingOptIn: boolean; personalizationOptIn: boolean; historyOptIn: boolean }>,
) {
  const update: StatePatch = {};
  if (patch.channels) {
    const c = patch.channels;
    // In-app delivery of booking status is transactional and cannot be switched off (C-107).
    update.notification_channels = { in_app: true, email: Boolean(c.email), sms: Boolean(c.sms), push: Boolean(c.push) };
  }
  if (patch.marketingOptIn !== undefined) update.marketing_opt_in = Boolean(patch.marketingOptIn);
  if (patch.personalizationOptIn !== undefined) update.personalization_opt_in = Boolean(patch.personalizationOptIn);
  if (patch.historyOptIn !== undefined) update.history_opt_in = Boolean(patch.historyOptIn);
  await upsertState(userId, update);
}

/** Recent-view recording honours the account's history opt-out (C-103, C-110). */
export async function historyAllowed(actor: Actor): Promise<boolean> {
  if (!actor.userId) return true;
  const state = await getCustomerState(actor.userId);
  return state?.historyOptIn !== false;
}

// ----------------------------------------------------------------------------
// Taxonomy labels for chips/filters (admin-managed master data).
// ----------------------------------------------------------------------------

export type TaxonomyTerm = { code: string; label: string; icon: string | null };

export async function listTaxonomy(locale: string): Promise<Record<string, TaxonomyTerm[]>> {
  const rows = await db<{ kind: string; code: string; label_translations: Record<string, string>; icon: string | null }[]>`
    select kind, code, label_translations, icon from tour.taxonomy_terms where is_active order by kind, sort_order, code`;
  const content = contentLocaleFor(locale);
  const out: Record<string, TaxonomyTerm[]> = {};
  for (const r of rows) {
    (out[r.kind] ??= []).push({ code: r.code, label: pickTranslation(r.label_translations, content)?.value ?? r.code, icon: r.icon });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Packing checklist (C-058), bound to one of the user's own bookings.
// ----------------------------------------------------------------------------

export type ChecklistItem = { key: string; label: string; done: boolean };

async function assertOwnBooking(userId: string, bookingId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) throw fail.notFound("booking_not_found");
  const [b] = await db<{ ok: boolean }[]>`select true as ok from tour.bookings where booking_id = ${bookingId}::uuid and user_id = ${userId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
}

export async function listChecklist(userId: string, bookingId: string, seed: string[]): Promise<ChecklistItem[]> {
  await assertOwnBooking(userId, bookingId);
  const rows = await db<{ item_key: string; label: string; done: boolean }[]>`
    select item_key, label, done from tour.checklist_items where booking_id = ${bookingId}::uuid order by sort_order, item_key`;
  if (rows.length > 0) return rows.map((r) => ({ key: r.item_key, label: r.label, done: r.done }));
  // First open: start from the operator's own "what to bring" list (never invented items).
  return seed.slice(0, 30).map((label, i) => ({ key: `op-${i + 1}`, label, done: false }));
}

export async function setChecklistItem(userId: string, bookingId: string, item: { key: string; label: string; done: boolean; sortOrder: number }) {
  await assertOwnBooking(userId, bookingId);
  const label = item.label.trim().slice(0, 120);
  if (!label || !/^[a-z0-9:_-]{1,60}$/i.test(item.key)) throw fail.validation("invalid_value");
  await db`
    insert into tour.checklist_items (booking_id, item_key, label, done, sort_order)
    values (${bookingId}::uuid, ${item.key}, ${label}, ${item.done}, ${item.sortOrder})
    on conflict (booking_id, item_key) do update set done = excluded.done, label = excluded.label, updated_at = now()`;
}

export async function removeChecklistItem(userId: string, bookingId: string, key: string) {
  await assertOwnBooking(userId, bookingId);
  await db`delete from tour.checklist_items where booking_id = ${bookingId}::uuid and item_key = ${key}`;
}

// ----------------------------------------------------------------------------
// Share-safe itinerary links (C-109, S-047): expiring, revocable, no PII.
// ----------------------------------------------------------------------------

export type ShareLink = { id: string; token: string; expiresAt: string; revokedAt: string | null; createdAt: string };

export async function listShareLinks(userId: string, bookingId: string): Promise<ShareLink[]> {
  await assertOwnBooking(userId, bookingId);
  const rows = await db<any[]>`
    select id::text, token, expires_at, revoked_at, created_at from tour.share_links
     where booking_id = ${bookingId}::uuid and created_by = ${userId}::uuid order by created_at desc limit 20`;
  return rows.map((r) => ({
    id: r.id, token: r.token, expiresAt: new Date(r.expires_at).toISOString(),
    revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null, createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function createShareLink(userId: string, bookingId: string, days: number): Promise<ShareLink> {
  await assertOwnBooking(userId, bookingId);
  if (!Number.isInteger(days) || days < 1 || days > 30) throw fail.validation("invalid_value");
  const [b] = await db<{ status: string }[]>`select status from tour.bookings where booking_id = ${bookingId}::uuid`;
  if (!b || !["confirmed", "requested", "pending_payment", "completed"].includes(b.status)) throw fail.conflict("not_shareable");
  const token = randomBytes(18).toString("base64url");
  const [r] = await db<any[]>`
    insert into tour.share_links (booking_id, token, created_by, expires_at)
    values (${bookingId}::uuid, ${token}, ${userId}::uuid, now() + make_interval(days => ${days}))
    returning id::text, token, expires_at, revoked_at, created_at`;
  return { id: r.id, token: r.token, expiresAt: new Date(r.expires_at).toISOString(), revokedAt: null, createdAt: new Date(r.created_at).toISOString() };
}

export async function revokeShareLink(userId: string, linkId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) throw fail.notFound();
  const res = await db`update tour.share_links set revoked_at = now() where id = ${linkId}::uuid and created_by = ${userId}::uuid and revoked_at is null returning id`;
  if (res.length === 0) throw fail.notFound();
}

/** What a share link may reveal: tour, departure, itinerary and meeting point — no names, contacts or documents. */
export async function resolveShareToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [r] = await db<any[]>`
    select s.booking_id::text, s.expires_at, s.revoked_at, tb.tour_id::text, tb.status, tb.content_snapshot, tb.display_calendar,
           d.starts_on, d.local_start_time::text, d.starts_at, d.timezone, d.status as dep_status, d.delay_minutes
      from tour.share_links s
      join tour.bookings tb on tb.booking_id = s.booking_id
      join tour.departures d on d.id = tb.departure_id
     where s.token = ${token}`;
  if (!r) return null;
  if (r.revoked_at || new Date(r.expires_at).getTime() <= Date.now()) return { state: "expired" as const };
  if (["cancelled", "declined", "expired"].includes(r.status)) return { state: "expired" as const };
  return {
    state: "ok" as const,
    tourId: r.tour_id as string,
    expiresAt: new Date(r.expires_at).toISOString(),
    snapshot: r.content_snapshot as { title?: unknown; meetingInstructions?: unknown; meeting?: { lat: number; lng: number } | null },
    calendar: (isCalendarId(r.display_calendar) ? r.display_calendar : "gregory") as CalendarId,
    departure: {
      localDate: r.starts_on instanceof Date ? r.starts_on.toISOString().slice(0, 10) : String(r.starts_on).slice(0, 10),
      localTime: r.local_start_time ? String(r.local_start_time).slice(0, 5) : null,
      startsAt: new Date(r.starts_at).toISOString(),
      timezone: r.timezone as string,
      status: r.dep_status as string,
      delayMinutes: Number(r.delay_minutes ?? 0),
    },
  };
}

// ----------------------------------------------------------------------------
// Address book (C-097): travelers from the user's own previous bookings.
// ----------------------------------------------------------------------------

export type SavedTraveler = { firstName: string; lastName: string; nationality: string | null; travelerClass: string };

export async function addressBook(userId: string): Promise<SavedTraveler[]> {
  const rows = await db<any[]>`
    select distinct on (lower(p.first_name), lower(p.last_name)) p.first_name, p.last_name, p.nationality, p.traveler_class
      from tour.booking_participants p
      join tour.bookings b on b.booking_id = p.booking_id
     where b.user_id = ${userId}::uuid
     order by lower(p.first_name), lower(p.last_name), b.created_at desc
     limit 20`;
  return rows.map((r) => ({ firstName: r.first_name, lastName: r.last_name, nationality: r.nationality, travelerClass: r.traveler_class }));
}

// ----------------------------------------------------------------------------
// Data export / deletion of browsing data and preferences (C-110).
// Bookings are kept: they are transactional records with legal retention.
// ----------------------------------------------------------------------------

export async function exportMyData(actor: Actor) {
  const owners = [actor.userId ? `u:${actor.userId}` : null, await ownerKey(actor)].filter(Boolean) as string[];
  const uniqueOwners = [...new Set(owners)];
  const views = await db<any[]>`
    select rv.tour_id::text, t.slug, rv.viewed_at, rv.view_count from tour.recent_views rv join tour.tours t on t.id = rv.tour_id
     where rv.owner_key = any(${uniqueOwners}::text[]) order by rv.viewed_at desc`;
  const searches = await db<any[]>`
    select query, filters, created_at from tour.recent_searches where owner_key = any(${uniqueOwners}::text[]) order by created_at desc`;
  const wishlist = actor.userId
    ? await db<any[]>`select w.tour_id::text, t.slug, w.created_at from tour.wishlist w join tour.tours t on t.id = w.tour_id where w.user_id = ${actor.userId}::uuid`
    : [];
  const state = actor.userId ? await getCustomerState(actor.userId) : null;
  return {
    exportedAt: new Date().toISOString(),
    recentViews: views.map((v) => ({ tourId: v.tour_id, slug: v.slug, viewedAt: new Date(v.viewed_at).toISOString(), viewCount: v.view_count })),
    recentSearches: searches.map((s) => ({ query: s.query, filters: s.filters, createdAt: new Date(s.created_at).toISOString() })),
    wishlist: wishlist.map((w) => ({ tourId: w.tour_id, slug: w.slug, addedAt: new Date(w.created_at).toISOString() })),
    preferences: state,
  };
}

export async function deleteMyData(actor: Actor) {
  const owners = [actor.userId ? `u:${actor.userId}` : null, await ownerKey(actor)].filter(Boolean) as string[];
  await db.begin(async (tx) => {
    await tx`delete from tour.recent_views where owner_key = any(${owners}::text[])`;
    await tx`delete from tour.recent_searches where owner_key = any(${owners}::text[])`;
    if (actor.userId) {
      await tx`delete from tour.wishlist where user_id = ${actor.userId}::uuid`;
      // Personalization data goes; the consent choices themselves (history opt-out,
      // channels) and intro completion stay, so deleting data never re-enables tracking.
      await tx`update tour.customer_state set display_calendar = null, currency_code = null, interests = '{}',
                 personalization_opt_in = false, updated_at = now() where user_id = ${actor.userId}::uuid`;
    }
  });
  const jar = await cookies();
  jar.delete(PREFS_COOKIE);
  jar.delete(GUEST_COOKIE);
}
