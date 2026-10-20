import "server-only";

import db from "@/config/database/db";

import { formatInstant, isCalendarId, type CalendarId } from "../../domain/calendar";
import { isolate } from "../../domain/text";
import { fail, logUnexpected, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import type { NoticeInput, NoticeView } from "./contract";
import { auditOps, authorizeDeparture, iso, notifyUser, requireUuid, type Tx } from "./common";

/**
 * Operator notices (V-042/V-043/V-068, C-077, AT-21, AT-46).
 *
 * Recipients are the live bookings of THAT departure only. Each traveler gets
 * the text in their booking language when the operator supplied it, otherwise
 * the source text with fellBack = true. Placeholders are filled per traveler —
 * dates in the traveler's display calendar and the departure's time zone — but
 * every rendering carries the same instant and the same voucher:
 *
 *   {when}       the notice's effective instant
 *   {departure}  the departure's (delayed) start instant
 *   {ref}        the traveler's voucher code
 */

export const NOTICE_KINDS = ["delay", "cancellation", "meeting_point_change", "pickup_update", "weather_hold", "route_substitution", "announcement", "safety", "itinerary_change", "guide_change"] as const;
const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;
const LIVE = ["confirmed", "pending_payment", "requested"];

type Texts = Record<string, { title: string; body: string }>;

export function validateNoticeTexts(sourceLocale: string, texts: Texts) {
  if (!LOCALE_RE.test(sourceLocale)) throw fail.validation("invalid_locale");
  if (!texts || typeof texts !== "object") throw fail.validation("texts_required");
  const entries = Object.entries(texts);
  if (entries.length === 0 || entries.length > 20) throw fail.validation("texts_required");
  for (const [loc, t] of entries) {
    if (!LOCALE_RE.test(loc)) throw fail.validation("invalid_locale", { locale: loc });
    if (!t || typeof t.title !== "string" || typeof t.body !== "string") throw fail.validation("invalid_text", { locale: loc });
    if (!t.title.trim() || t.title.length > 200 || t.body.length > 4000) throw fail.validation("invalid_text", { locale: loc });
  }
  if (!texts[sourceLocale]?.body?.trim()) throw fail.validation("source_text_required");
}

/** Picks the text for a traveler: exact locale, then same language, then the source (fellBack). */
export function pickNoticeText(texts: Texts, sourceLocale: string, wanted: string): { locale: string; fellBack: boolean } {
  if (texts[wanted]) return { locale: wanted, fellBack: false };
  const base = wanted.toLowerCase().split("-")[0];
  const same = Object.keys(texts).find((k) => k.toLowerCase().split("-")[0] === base);
  if (same) return { locale: same, fellBack: false };
  return { locale: sourceLocale, fellBack: true };
}

export function renderNotice(text: { title: string; body: string }, ctx: { locale: string; calendar: CalendarId; timeZone: string; effectiveAt: Date; departureAt: Date; voucher: string }) {
  const lang = ctx.locale.split("-")[0];
  const fmt = (d: Date) => isolate(formatInstant(d, { locale: lang, calendar: ctx.calendar, timeZone: ctx.timeZone, withZone: true }));
  const fill = (s: string) => s.replaceAll("{when}", fmt(ctx.effectiveAt)).replaceAll("{departure}", fmt(ctx.departureAt)).replaceAll("{ref}", isolate(ctx.voucher));
  return { title: fill(text.title), body: fill(text.body) };
}

type NoticeRow = { id: string; departure_id: string; kind: string; effective_at: Date; source_locale: string; texts: Texts; payload: Record<string, unknown> };

/**
 * Delivers one stored notice to the given bookings (default: live bookings of
 * its departure). One tour.notice_deliveries row per booking; a booking that
 * already has its row is skipped, so a retry never notifies twice.
 */
export async function deliverNotice(noticeId: string, opts: { bookingIds?: string[] } = {}): Promise<{ recipients: number; fellBack: number; failed: number }> {
  const [n] = await db<NoticeRow[]>`
    select id::text, departure_id::text, kind, effective_at, source_locale, texts, payload from tour.notices where id = ${noticeId}::uuid`;
  if (!n) throw fail.notFound("notice_not_found");
  const targets = await db<any[]>`
    select tb.booking_id::text, tb.user_id::text, tb.ui_locale, tb.display_calendar, tb.voucher_code,
           d.starts_at, d.delay_minutes, d.timezone
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.departure_id = ${n.departure_id}::uuid
       and ${opts.bookingIds ? db`tb.booking_id = any(${opts.bookingIds}::uuid[])` : db`tb.status = any(${LIVE}::text[])`}`;
  let recipients = 0;
  let fellBack = 0;
  let failed = 0;
  for (const t of targets) {
    const pick = pickNoticeText(n.texts, n.source_locale, t.ui_locale);
    const claimed = await db`
      insert into tour.notice_deliveries (notice_id, booking_id, user_id, locale_used, fell_back)
      values (${n.id}::uuid, ${t.booking_id}::uuid, ${t.user_id}::uuid, ${pick.locale}, ${pick.fellBack})
      on conflict (notice_id, booking_id) do nothing returning booking_id`;
    if (claimed.length === 0) continue;
    const calendar: CalendarId = isCalendarId(t.display_calendar) ? t.display_calendar : "gregory";
    const departureAt = new Date(new Date(t.starts_at).getTime() + Number(t.delay_minutes ?? 0) * 60_000);
    const { title, body } = renderNotice(n.texts[pick.locale], {
      locale: pick.locale, calendar, timeZone: t.timezone, effectiveAt: new Date(n.effective_at), departureAt, voucher: t.voucher_code,
    });
    const notificationId = await notifyUser({
      userId: t.user_id, type: "booking", title, body, entityType: "tour_booking", entityId: t.booking_id,
      data: { kind: `notice_${n.kind}`, noticeId: n.id, effectiveAt: new Date(n.effective_at).toISOString(), voucher: t.voucher_code, href: `/tours/bookings/${t.booking_id}` },
    });
    if (!notificationId) {
      // Release the claim so a retry delivers it; the notice itself stays visible on the booking page.
      await db`delete from tour.notice_deliveries where notice_id = ${n.id}::uuid and booking_id = ${t.booking_id}::uuid`;
      failed += 1;
      continue;
    }
    await db`update tour.notice_deliveries set notification_id = ${notificationId}::uuid where notice_id = ${n.id}::uuid and booking_id = ${t.booking_id}::uuid`
      .catch((e) => logUnexpected("deliverNotice.link", e));
    recipients += 1;
    if (pick.fellBack) fellBack += 1;
  }
  await db`update tour.notices set sent_at = coalesce(sent_at, now()) where id = ${n.id}::uuid`;
  return { recipients, fellBack, failed };
}

/** Inserts a notice row (inside the caller's transaction when given). */
export async function insertNotice(q: Tx, createdBy: string, input: NoticeInput): Promise<string> {
  const [row] = await q<any[]>`
    insert into tour.notices (departure_id, kind, reason_code, effective_at, source_locale, texts, payload, created_by)
    values (${input.departureId}::uuid, ${input.kind}, ${input.reasonCode ?? null}, ${new Date(input.effectiveAt)}, ${input.sourceLocale},
            ${db.json(input.texts as never)}, ${db.json((input.payload ?? {}) as never)}, ${createdBy}::uuid)
    returning id::text`;
  return row.id;
}

export function validateNoticeInput(input: NoticeInput) {
  requireUuid(input.departureId, "departure_not_found");
  if (!(NOTICE_KINDS as readonly string[]).includes(input.kind)) throw fail.validation("invalid_notice_kind");
  if (Number.isNaN(new Date(String(input.effectiveAt)).getTime())) throw fail.validation("invalid_effective_at");
  if (input.reasonCode != null && !/^[a-z0-9_]{1,60}$/.test(input.reasonCode)) throw fail.validation("invalid_reason_code");
  validateNoticeTexts(input.sourceLocale, input.texts);
}

export async function sendNotice(actor: Actor, input: NoticeInput): Promise<{ noticeId: string; recipients: number; fellBack: number }> {
  validateNoticeInput(input);
  const access = await authorizeDeparture(actor, input.departureId, { minimum: "manager", allowGuide: true });
  let noticeId: string;
  try {
    noticeId = await db.begin(async (tx) => {
      const id = await insertNotice(tx as unknown as Tx, actor.userId!, input);
      await auditOps(tx as unknown as Tx, actor, access.scope, access.dep.serviceProviderId, "notice", id, "notice_sent",
        { departureId: input.departureId, kind: input.kind, locales: Object.keys(input.texts) });
      return id;
    });
  } catch (e) {
    throw mapDbError(e, "sendNotice");
  }
  const r = await deliverNotice(noticeId);
  return { noticeId, recipients: r.recipients, fellBack: r.fellBack };
}

/** Notices on the customer's booking page, in the page locale when available. */
export async function listNoticesForBooking(userId: string, bookingId: string, locale: string): Promise<NoticeView[]> {
  requireUuid(bookingId, "booking_not_found");
  const [b] = await db<any[]>`
    select tb.booking_id::text, tb.display_calendar, tb.voucher_code, tb.ui_locale, d.starts_at, d.delay_minutes, d.timezone
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.booking_id = ${bookingId}::uuid and tb.user_id = ${userId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  const rows = await db<any[]>`
    select n.id::text, n.kind, n.effective_at, n.source_locale, n.texts, n.created_at, nd.locale_used
      from tour.notice_deliveries nd join tour.notices n on n.id = nd.notice_id
     where nd.booking_id = ${bookingId}::uuid
     order by n.created_at desc limit 100`;
  const calendar: CalendarId = isCalendarId(b.display_calendar) ? b.display_calendar : "gregory";
  const departureAt = new Date(new Date(b.starts_at).getTime() + Number(b.delay_minutes ?? 0) * 60_000);
  const wanted = LOCALE_RE.test(locale) ? locale : b.ui_locale;
  return rows.map((r) => {
    const pick = pickNoticeText(r.texts, r.source_locale, wanted);
    const text = renderNotice(r.texts[pick.locale], { locale: pick.locale, calendar, timeZone: b.timezone, effectiveAt: new Date(r.effective_at), departureAt, voucher: b.voucher_code });
    return { id: r.id, kind: r.kind, effectiveAt: iso(r.effective_at)!, title: text.title, body: text.body, localeUsed: pick.locale, fellBack: pick.fellBack, createdAt: iso(r.created_at)! };
  });
}

// ----------------------------------------------------------------------------
// Built-in system notice texts (itinerary / guide change). Operators write
// delay and cancellation notices themselves; these two are platform-generated.
// ----------------------------------------------------------------------------

export const SYSTEM_NOTICE_TEXTS: Record<"itinerary_change" | "guide_change", Texts> = {
  itinerary_change: {
    "en-US": { title: "Itinerary updated", body: "The operator changed the itinerary of your tour on {departure}. Please review the updated stops. Ref {ref}." },
    "fa-IR": { title: "برنامه سفر به‌روز شد", body: "برگزارکننده برنامه تور شما در {departure} را تغییر داد. لطفاً توقف‌های جدید را بررسی کنید. کد {ref}." },
    "ar-SA": { title: "تم تحديث البرنامج", body: "قام المنظم بتغيير برنامج جولتك في {departure}. يرجى مراجعة المحطات المحدثة. المرجع {ref}." },
    "tr-TR": { title: "Program güncellendi", body: "Operatör {departure} tarihli turunuzun programını değiştirdi. Lütfen yeni durakları inceleyin. Ref {ref}." },
  },
  guide_change: {
    "en-US": { title: "Your guide has changed", body: "A different lead guide will accompany your tour on {departure}. Ref {ref}." },
    "fa-IR": { title: "راهنمای تور تغییر کرد", body: "راهنمای دیگری همراه تور شما در {departure} خواهد بود. کد {ref}." },
    "ar-SA": { title: "تم تغيير المرشد", body: "سيرافق جولتك في {departure} مرشد آخر. المرجع {ref}." },
    "tr-TR": { title: "Rehberiniz değişti", body: "{departure} tarihli turunuza farklı bir rehber eşlik edecek. Ref {ref}." },
  },
};
