import "server-only";

import db from "@/config/database/db";
import type { Actor } from "@/features/tours/server/platform/access";

import { audit } from "../booking";
import { pickStr } from "../catalog";
import { fail } from "../errors";
import { getStaySettings, invalidateStaySettings, STAY_SETTING_KEYS, type StaySettings } from "../settings";

type Tx = typeof db;
type Translations = Record<string, string>;

function cleanTr(t: Translations | null | undefined): Translations {
  const out: Translations = {};
  for (const [k, v] of Object.entries(t ?? {})) if (/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(k) && typeof v === "string" && v.trim()) out[k] = v.trim();
  return out;
}

// Dashboard (A01) ---------------------------------------------------------------

export async function dashboardCounts() {
  const [r] = await db<any[]>`
    select
      (select count(*)::int from stay.properties where status = 'published') as published,
      (select count(*)::int from stay.properties where status = 'draft') as drafts,
      (select count(*)::int from stay.bookings where status = 'requested') as requests,
      (select count(*)::int from stay.bookings where status = 'pending_payment') as unpaid,
      (select count(*)::int from stay.bookings where status = 'confirmed' and check_in = (now() at time zone 'Asia/Tehran')::date) as arrivals_today,
      (select count(*)::int from stay.bookings where status in ('confirmed','completed') and check_out = (now() at time zone 'Asia/Tehran')::date) as departures_today,
      (select count(*)::int from stay.reviews where status = 'pending') as reviews_pending,
      (select count(*)::int from stay.booking_events e where e.event_type = 'refund_requested' and e.created_at > now() - interval '30 days') as refunds_30d,
      (select count(*)::int from stay.bookings where created_at > now() - interval '7 days') as bookings_7d,
      (select coalesce(sum(total_amount), 0) from stay.bookings where status in ('confirmed','completed') and created_at > now() - interval '30 days' and currency_code = 'IRR') as revenue_30d`;
  return {
    published: r.published as number,
    drafts: r.drafts as number,
    requests: r.requests as number,
    unpaid: r.unpaid as number,
    arrivalsToday: r.arrivals_today as number,
    departuresToday: r.departures_today as number,
    reviewsPending: r.reviews_pending as number,
    refunds30d: r.refunds_30d as number,
    bookings7d: r.bookings_7d as number,
    revenue30d: Number(r.revenue_30d),
  };
}

// Cities --------------------------------------------------------------------------

export type CityInput = {
  slug: string;
  name: Translations;
  region: Translations;
  intro: Translations;
  coverUrl: string | null;
  coverAlt: Translations;
  coverCredit: string | null;
  latitude: number | null;
  longitude: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export async function listCitiesAdmin(locale: string) {
  const rows = await db<any[]>`
    select c.*, c.id::text as id, (select count(*)::int from stay.properties p where p.city_id = c.id) as properties,
           (select count(*)::int from stay.properties p where p.city_id = c.id and p.status = 'published') as published
      from stay.cities c order by c.sort_order, c.slug`;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    label: pickStr(r.name, locale),
    name: r.name as Translations,
    region: r.region as Translations,
    intro: r.intro as Translations,
    coverUrl: r.cover_url as string | null,
    coverAlt: r.cover_alt as Translations,
    coverCredit: r.cover_credit as string | null,
    latitude: r.latitude == null ? null : Number(r.latitude),
    longitude: r.longitude == null ? null : Number(r.longitude),
    isPublished: r.is_published as boolean,
    isFeatured: r.is_featured as boolean,
    sortOrder: r.sort_order as number,
    properties: r.properties as number,
    published: r.published as number,
  }));
}

function validateCity(input: CityInput) {
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(input.slug)) errors.slug = "invalid";
  if (Object.keys(cleanTr(input.name)).length === 0) errors.name = "required";
  if (input.coverUrl && !/^(https:\/\/|\/)/.test(input.coverUrl)) errors.coverUrl = "invalid";
  if (input.coverUrl && Object.keys(cleanTr(input.coverAlt)).length === 0) errors.coverAlt = "required";
  if ((input.latitude == null) !== (input.longitude == null)) errors.latitude = "both_or_neither";
  if (Object.keys(errors).length) throw fail.validation("invalid_city", { fields: errors });
}

export async function saveCity(actor: Actor, id: string | null, input: CityInput): Promise<string> {
  validateCity(input);
  return db.begin(async (tx) => {
    const v = {
      name: db.json(cleanTr(input.name) as never),
      region: db.json(cleanTr(input.region) as never),
      intro: db.json(cleanTr(input.intro) as never),
      alt: db.json(cleanTr(input.coverAlt) as never),
    };
    let cityId = id;
    if (id) {
      const r = await tx`
        update stay.cities set slug = ${input.slug}, name = ${v.name}, region = ${v.region}, intro = ${v.intro}, cover_url = ${input.coverUrl || null},
          cover_alt = ${v.alt}, cover_credit = ${input.coverCredit || null}, latitude = ${input.latitude}, longitude = ${input.longitude},
          is_published = ${input.isPublished}, is_featured = ${input.isFeatured}, sort_order = ${input.sortOrder}, updated_at = now()
        where id = ${id}::uuid returning id`;
      if (r.length === 0) throw fail.notFound("city_not_found");
    } else {
      const [r] = await tx<{ id: string }[]>`
        insert into stay.cities (slug, name, region, intro, cover_url, cover_alt, cover_credit, latitude, longitude, is_published, is_featured, sort_order)
        values (${input.slug}, ${v.name}, ${v.region}, ${v.intro}, ${input.coverUrl || null}, ${v.alt}, ${input.coverCredit || null},
                ${input.latitude}, ${input.longitude}, ${input.isPublished}, ${input.isFeatured}, ${input.sortOrder})
        returning id::text`;
      cityId = r.id;
    }
    await audit(tx as unknown as Tx, actor, null, "city", cityId, id ? "updated" : "created", { slug: input.slug });
    return cityId!;
  });
}

export async function deleteCity(actor: Actor, id: string) {
  await db.begin(async (tx) => {
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from stay.properties where city_id = ${id}::uuid`;
    if (n > 0) throw fail.conflict("city_has_properties");
    const r = await tx`delete from stay.cities where id = ${id}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("city_not_found");
    await audit(tx as unknown as Tx, actor, null, "city", id, "deleted", {});
  });
}

// Bookings (A07) -------------------------------------------------------------------

function maskName(name: string | null | undefined) {
  const s = String(name ?? "").trim();
  return s.length <= 1 ? s : `${s[0]}${"•".repeat(Math.min(4, s.length - 1))}`;
}
function maskPhone(phone: string | null | undefined) {
  const s = String(phone ?? "");
  return s.length > 4 ? `…${s.slice(-4)}` : s;
}

export async function listBookingsAdmin(
  filters: { status?: string | null; propertyId?: string | null; q?: string | null; from?: string | null; to?: string | null },
  locale: string,
) {
  const q = filters.q?.trim() || null;
  const rows = await db<any[]>`
    select sb.booking_id::text, sb.voucher_code, sb.status, sb.check_in::text, sb.check_out::text, sb.nights, sb.rooms, sb.adults, sb.children,
           sb.total_amount, sb.currency_code, sb.buyer, sb.created_at, sb.request_expires_at, sb.payment_deadline_at, p.name as property_name,
           p.id::text as property_id, bb.payment_status
      from stay.bookings sb join stay.properties p on p.id = sb.property_id join booking.bookings bb on bb.id = sb.booking_id
     where (${filters.status ?? null}::text is null or sb.status = ${filters.status ?? null})
       and (${filters.propertyId ?? null}::uuid is null or sb.property_id = ${filters.propertyId ?? null}::uuid)
       and (${filters.from ?? null}::date is null or sb.check_in >= ${filters.from ?? null}::date)
       and (${filters.to ?? null}::date is null or sb.check_in < ${filters.to ?? null}::date)
       and (${q}::text is null or sb.voucher_code ilike ${q ? `%${q}%` : null} or sb.booking_id::text = ${q})
     order by sb.created_at desc limit 300`;
  return rows.map((r) => ({
    bookingId: r.booking_id,
    voucherCode: r.voucher_code,
    status: r.status as string,
    paymentStatus: r.payment_status as string,
    propertyId: r.property_id,
    propertyName: pickStr(r.property_name, locale),
    checkIn: r.check_in,
    checkOut: r.check_out,
    nights: r.nights,
    rooms: r.rooms,
    guests: r.adults + r.children,
    total: Number(r.total_amount),
    currency: r.currency_code,
    // Customer names are masked in lists (A07); the detail page reveals with a reason.
    buyer: `${maskName(r.buyer?.firstName)} ${maskName(r.buyer?.lastName)}`,
    createdAt: new Date(r.created_at).toISOString(),
    deadline: r.request_expires_at ?? r.payment_deadline_at ? new Date(r.request_expires_at ?? r.payment_deadline_at).toISOString() : null,
  }));
}

export async function getBookingAdmin(bookingId: string, locale: string, opts: { reveal?: boolean } = {}) {
  const [r] = await db<any[]>`
    select sb.*, sb.booking_id::text as booking_id, sb.property_id::text as property_id, sb.check_in::text as cin, sb.check_out::text as cout,
           p.name as property_name, rt.name as room_name, rp.code as plan_code, rp.meal_plan, bb.payment_status, bb.paid_amount
      from stay.bookings sb join stay.properties p on p.id = sb.property_id join stay.room_types rt on rt.id = sb.room_type_id
      join stay.rate_plans rp on rp.id = sb.rate_plan_id join booking.bookings bb on bb.id = sb.booking_id
     where sb.booking_id = ${bookingId}::uuid`;
  if (!r) throw fail.notFound("booking_not_found");
  const events = await db<any[]>`select event_type, payload, created_at from stay.booking_events where booking_id = ${bookingId}::uuid order by created_at`;
  const reveal = Boolean(opts.reveal);
  return {
    bookingId: r.booking_id,
    voucherCode: r.voucher_code as string,
    status: r.status as string,
    paymentStatus: r.payment_status as string,
    paidAmount: Number(r.paid_amount ?? 0),
    propertyId: r.property_id,
    propertyName: pickStr(r.property_name, locale),
    roomName: pickStr(r.room_name, locale),
    planCode: r.plan_code as string,
    mealPlan: r.meal_plan as string,
    checkIn: r.cin as string,
    checkOut: r.cout as string,
    nights: r.nights as number,
    rooms: r.rooms as number,
    adults: r.adults as number,
    childAges: (r.child_ages ?? []).map(Number) as number[],
    total: Number(r.total_amount),
    currency: r.currency_code as string,
    priceSnapshot: r.price_snapshot,
    policySnapshot: r.policy_snapshot,
    buyer: reveal
      ? r.buyer
      : { firstName: maskName(r.buyer?.firstName), lastName: maskName(r.buyer?.lastName), phone: maskPhone(r.buyer?.phone), email: r.buyer?.email ? "•••" : null },
    guests: reveal ? r.guests : (r.guests ?? []).map((g: any) => ({ firstName: maskName(g.firstName), lastName: maskName(g.lastName) })),
    revealed: reveal,
    specialRequests: r.special_requests as string | null,
    arrivalTime: r.arrival_time as string | null,
    confirmationMode: r.confirmation_mode as string,
    requestExpiresAt: r.request_expires_at ? new Date(r.request_expires_at).toISOString() : null,
    paymentDeadlineAt: r.payment_deadline_at ? new Date(r.payment_deadline_at).toISOString() : null,
    cancelReason: r.cancel_reason as string | null,
    refundQuote: r.refund_quote,
    createdAt: new Date(r.created_at).toISOString(),
    events: events.map((e) => ({ type: e.event_type as string, payload: e.payload, at: new Date(e.created_at).toISOString() })),
  };
}

/** Reveal guest contact details: allowed for admins, always audited with a reason. */
export async function revealBookingContact(actor: Actor, bookingId: string, reason: string, locale: string) {
  if (reason.trim().length < 10) throw fail.validation("reason_too_short");
  const [b] = await db<{ property_id: string }[]>`select property_id::text from stay.bookings where booking_id = ${bookingId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  await db.begin(async (tx) => audit(tx as unknown as Tx, actor, b.property_id, "booking", bookingId, "contact_revealed", { reason: reason.trim() }));
  return getBookingAdmin(bookingId, locale, { reveal: true });
}

// Reviews (A09) ---------------------------------------------------------------------

export async function listReviewsAdmin(status: string | null, locale: string) {
  const rows = await db<any[]>`
    select r.id::text, r.rating, r.body, r.status, r.author_name, r.created_at, r.moderation_reason, r.provider_reply, p.name as property_name, p.id::text as property_id
      from stay.reviews r join stay.properties p on p.id = r.property_id
     where (${status}::text is null or r.status = ${status})
     order by r.created_at desc limit 300`;
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating as number,
    body: r.body as string | null,
    status: r.status as string,
    authorName: r.author_name as string | null,
    propertyId: r.property_id,
    propertyName: pickStr(r.property_name, locale),
    moderationReason: r.moderation_reason as string | null,
    providerReply: r.provider_reply as string | null,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

/** Moderation never edits the guest's words or score; it only changes visibility. */
export async function moderateReview(actor: Actor, id: string, status: "published" | "hidden" | "rejected", reason: string | null) {
  if (status !== "published" && (!reason || reason.trim().length < 5)) throw fail.validation("reason_too_short");
  await db.begin(async (tx) => {
    const [r] = await tx<{ property_id: string }[]>`
      update stay.reviews set status = ${status}, moderation_reason = ${reason?.trim() || null}, updated_at = now()
       where id = ${id}::uuid returning property_id::text`;
    if (!r) throw fail.notFound("review_not_found");
    await tx`select stay.refresh_rating(${r.property_id}::uuid)`;
    await audit(tx as unknown as Tx, actor, r.property_id, "review", id, `review_${status}`, { reason });
  });
}

export async function replyToReview(actor: Actor, id: string, reply: string | null) {
  await db.begin(async (tx) => {
    const [r] = await tx<{ property_id: string }[]>`
      update stay.reviews set provider_reply = ${reply?.trim() || null}, updated_at = now() where id = ${id}::uuid returning property_id::text`;
    if (!r) throw fail.notFound("review_not_found");
    await audit(tx as unknown as Tx, actor, r.property_id, "review", id, "reply_saved", {});
  });
}

// Settings --------------------------------------------------------------------------

export async function saveStaySettings(actor: Actor, patch: Partial<StaySettings>) {
  const ranges: Partial<Record<keyof StaySettings, [number, number]>> = {
    holdMinutes: [5, 60],
    paymentWindowMinutes: [5, 1440],
    requestTimeoutHours: [1, 168],
    serviceFeePercent: [0, 30],
    maxNights: [1, 90],
    maxRooms: [1, 10],
    bookingWindowDays: [30, 730],
  };
  const errors: Record<string, string> = {};
  for (const [k, [min, max]] of Object.entries(ranges) as [keyof StaySettings, [number, number]][]) {
    const v = patch[k];
    if (v != null && (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)) errors[k] = "out_of_range";
  }
  if (Object.keys(errors).length) throw fail.validation("invalid_settings", { fields: errors });
  const reverse = Object.fromEntries(Object.entries(STAY_SETTING_KEYS).map(([db_, k]) => [k, db_]));
  await db.begin(async (tx) => {
    for (const [k, v] of Object.entries(patch)) {
      const key = reverse[k];
      if (!key || v === undefined) continue;
      await tx`
        insert into stay.settings (key, value, updated_at, updated_by) values (${key}, ${db.json(v as never)}, now(), ${actor.userId}::uuid)
        on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
    }
    await audit(tx as unknown as Tx, actor, null, "settings", null, "updated", patch as Record<string, unknown>);
  });
  invalidateStaySettings();
  return getStaySettings({ fresh: true });
}
