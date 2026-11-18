import "server-only";

import { randomBytes } from "node:crypto";

import db from "@/config/database/db";
import { isCalendarId, type CalendarId } from "@/features/tours/domain/calendar";
import type { Actor } from "@/features/tours/server/platform/access";

import { normalizeRules, stayRefundQuote } from "../domain/cancellation";
import { todayIn, validateStayDates } from "../domain/dates";
import { quoteStay, StayQuoteError, type Occupancy, type StayQuote } from "../domain/pricing";
import type { BookingStatus, MyStayBooking } from "../types";

import { pick, pickStr } from "./catalog";
import { fail, logUnexpected, mapStayError } from "./errors";
import { renderStayNotice, type StayNoticeKind } from "./notifications";
import { routing } from "@/i18n/routing";
import { getStaySettings, type StaySettings } from "./settings";

/**
 * Stay checkout on top of the platform booking engine (H05–H10).
 *
 *   startStayCheckout   — server-side quote + an expiring multi-night hold
 *                         (stay.place_hold locks every night in date order)
 *   confirmStayCheckout — re-quotes, verifies the price and policy the guest saw,
 *                         converts the hold and writes booking.bookings (+ payment
 *                         row for free stays) + stay.bookings in ONE transaction,
 *                         keyed by an idempotency key (double submit → same booking)
 *   payment             — /api/booking-pro/payments/create-intent (wallet / gateway);
 *                         reconcileStayBooking() confirms exactly once when paid
 *   sweep               — expires holds, unpaid bookings and unanswered requests
 */

type Tx = typeof db;

export type StaySelection = {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  occupancy: Occupancy;
};

async function loadOffer(tx: Tx, sel: StaySelection, settings: StaySettings) {
  const [row] = await tx<any[]>`
    select p.id::text as property_id, p.status, p.slug, p.name, p.address, p.contact_phone, p.currency_code, p.tax_percent,
           p.child_free_under_age, p.confirmation_mode, p.request_timeout_hours, p.timezone, p.booking_cutoff_hours,
           p.check_in_time::text as cin, p.check_out_time::text as cout, p.service_provider_id::text, p.provider_service_id::text,
           p.current_policy_id::text, p.latitude, p.longitude, p.inventory_model,
           c.name as city_name,
           rt.id::text as room_type_id, rt.name as room_name, rt.units, rt.base_occupancy, rt.max_adults, rt.max_children, rt.max_occupancy, rt.is_active as rt_active,
           rp.id::text as rate_plan_id, rp.code as rp_code, rp.meal_plan, rp.refundable, rp.base_price, rp.extra_adult_price, rp.child_price,
           rp.min_nights, rp.max_nights, rp.long_stay_nights, rp.long_stay_percent, rp.is_active as rp_active
      from stay.properties p
      join stay.cities c on c.id = p.city_id
      join stay.room_types rt on rt.property_id = p.id and rt.id = ${sel.roomTypeId}::uuid
      join stay.rate_plans rp on rp.room_type_id = rt.id and rp.id = ${sel.ratePlanId}::uuid
     where p.id = ${sel.propertyId}::uuid
  `;
  if (!row || !row.rt_active || !row.rp_active) throw fail.notFound("room_not_found");
  if (row.status !== "published") throw fail.conflict("property_unavailable");

  const dateError = validateStayDates(sel.checkIn, sel.checkOut, { today: todayIn(row.timezone), maxNights: settings.maxNights, windowDays: settings.bookingWindowDays });
  if (dateError) throw fail.validation(dateError);

  const [overrideRows, invRows, cur, policyRows] = await Promise.all([
    tx<any[]>`select stay_date::text as d, price from stay.rate_overrides where rate_plan_id = ${sel.ratePlanId}::uuid and stay_date >= ${sel.checkIn}::date and stay_date < ${sel.checkOut}::date`,
    tx<any[]>`select min_nights from stay.inventory where room_type_id = ${sel.roomTypeId}::uuid and stay_date = ${sel.checkIn}::date`,
    tx<{ d: number }[]>`select decimal_digits as d from finance.currencies where code = ${row.currency_code}`,
    row.current_policy_id
      ? tx<any[]>`select id::text, version, rules, no_show_refund_percent, texts from stay.policies where id = ${row.current_policy_id}::uuid`
      : Promise.resolve([] as any[]),
  ]);
  const policy = policyRows[0];
  if (!policy) throw fail.conflict("policy_missing");
  const overrides: Record<string, number> = {};
  for (const o of overrideRows) overrides[o.d] = Number(o.price);
  const minNightsOverride = invRows[0]?.min_nights ?? 0;
  const decimals = cur[0] ? Number(cur[0].d) : row.currency_code === "IRR" ? 0 : 2;

  let quote: StayQuote;
  try {
    quote = quoteStay({
      currency: row.currency_code,
      currencyDecimals: decimals,
      checkIn: sel.checkIn,
      checkOut: sel.checkOut,
      occupancy: sel.occupancy,
      capacity: { baseOccupancy: row.base_occupancy, maxAdults: row.max_adults, maxChildren: row.max_children, maxOccupancy: row.max_occupancy, units: row.units },
      rate: {
        id: row.rate_plan_id,
        basePrice: Number(row.base_price),
        extraAdultPrice: Number(row.extra_adult_price),
        childPrice: Number(row.child_price),
        minNights: Math.max(row.min_nights, minNightsOverride),
        maxNights: row.max_nights,
        longStayNights: row.long_stay_nights,
        longStayPercent: row.long_stay_percent == null ? null : Number(row.long_stay_percent),
      },
      overrides,
      childFreeUnderAge: row.child_free_under_age,
      taxPercent: Number(row.tax_percent),
      serviceFeePercent: settings.serviceFeePercent,
      maxRooms: settings.maxRooms,
    });
  } catch (e) {
    if (e instanceof StayQuoteError) throw fail.validation(e.code);
    throw e;
  }
  return { row, policy, quote, decimals };
}

/** Live price for the selection (no side effects). */
export async function quoteStaySelection(sel: StaySelection) {
  try {
    const r = await loadOffer(db, sel, await getStaySettings());
    return { quote: r.quote, policyVersion: r.policy.version, confirmationMode: r.row.confirmation_mode as "instant" | "request" };
  } catch (e) {
    throw mapStayError(e, "quoteStaySelection");
  }
}

export type StartStayCheckoutResult = {
  holdId: string;
  expiresAt: string;
  quote: StayQuote;
  policy: { id: string; version: number; rules: { hoursBefore: number; refundPercent: number }[]; noShowRefundPercent: number };
  confirmationMode: "instant" | "request";
  refundable: boolean;
};

export async function startStayCheckout(userId: string, sel: StaySelection & { idempotencyKey: string }): Promise<StartStayCheckoutResult> {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(sel.idempotencyKey)) throw fail.validation("idempotency_key");
  try {
    const settings = await getStaySettings();
    return await db.begin(async (tx) => {
      const r = await loadOffer(tx as unknown as Tx, sel, settings);
      const [hold] = await tx<any[]>`
        select id::text, expires_at from stay.place_hold(${sel.roomTypeId}::uuid, ${sel.ratePlanId}::uuid, ${userId}::uuid,
          ${sel.checkIn}::date, ${sel.checkOut}::date, ${sel.occupancy.rooms}, ${settings.holdMinutes}, ${sel.idempotencyKey})`;
      return {
        holdId: hold.id,
        expiresAt: new Date(hold.expires_at).toISOString(),
        quote: r.quote,
        policy: { id: r.policy.id, version: r.policy.version, rules: normalizeRules(r.policy.rules), noShowRefundPercent: r.policy.no_show_refund_percent },
        confirmationMode: r.row.confirmation_mode,
        refundable: r.row.refundable,
      };
    });
  } catch (e) {
    throw mapStayError(e, "startStayCheckout");
  }
}

export async function releaseStayHold(userId: string, holdId: string): Promise<boolean> {
  const [r] = await db<{ ok: boolean }[]>`select stay.release_hold(${holdId}::uuid, ${userId}::uuid) as ok`;
  return Boolean(r?.ok);
}

export type StayGuest = { firstName: string; lastName: string };

export type ConfirmStayInput = StaySelection & {
  holdId: string;
  idempotencyKey: string;
  expectedTotal: number;
  acceptedPolicyVersion: number;
  uiLocale: string;
  displayCalendar: CalendarId;
  /**
   * Who books. Optional: the signed-in account's name, mobile and email are used for anything
   * left out (customers are never asked again for what their account already has).
   */
  buyer?: { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string | null } | null;
  /** Optional companions (names only); blank entries are ignored. The booker is the lead guest. */
  guests?: StayGuest[] | null;
  specialRequests?: string | null;
  arrivalTime?: string | null;
};

export type ConfirmStayResult = {
  bookingId: string;
  status: "pending_payment" | "requested" | "confirmed";
  voucherCode: string;
  amountDue: number;
  currency: string;
  paymentDeadlineAt: string | null;
  requestExpiresAt: string | null;
  replayed: boolean;
};

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'\-]{0,79}$/u;

function voucherCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `ST-${Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("")}`;
}

export type StayBuyer = { firstName: string; lastName: string; phone: string; email: string | null };
export type CheckoutProfile = StayBuyer;

/** The signed-in customer's own details, used as the booker (mobile in local form, e.g. 0912…). */
export async function getCheckoutProfile(userId: string): Promise<CheckoutProfile | null> {
  const [u] = await db<any[]>`
    select first_name, last_name, phone_number, phone_number_country_code, email
      from identity.asp_net_users where id = ${userId}::uuid`;
  if (!u) return null;
  const digits = String(u.phone_number ?? "").replace(/\D/g, "");
  const cc = String(u.phone_number_country_code ?? "").toUpperCase();
  const phone = !digits ? "" : (cc === "IR" || cc === "98" || cc === "+98") && !digits.startsWith("0") ? `0${digits}` : digits;
  const email = String(u.email ?? "").trim();
  return {
    firstName: String(u.first_name ?? "").trim(),
    lastName: String(u.last_name ?? "").trim(),
    phone,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
  };
}

/**
 * Typed values win over the account's; empty typed values fall back to it. `fromAccount` marks
 * the names taken from the account: they were accepted at sign-up, so they are not re-judged by
 * the typed-name rules (a name with a digit must not block a signed-in customer from booking).
 */
export function mergeBuyer(typed: ConfirmStayInput["buyer"], profile: CheckoutProfile | null): StayBuyer & { fromAccount: { firstName: boolean; lastName: boolean } } {
  const v = (x: string | null | undefined) => (x ?? "").trim();
  return {
    firstName: (v(typed?.firstName) || profile?.firstName || "").slice(0, 80),
    lastName: (v(typed?.lastName) || profile?.lastName || "").slice(0, 80),
    phone: (v(typed?.phone) || profile?.phone || "").replace(/[\s-]/g, ""),
    email: v(typed?.email) || profile?.email || null,
    fromAccount: { firstName: !v(typed?.firstName) && Boolean(profile?.firstName), lastName: !v(typed?.lastName) && Boolean(profile?.lastName) },
  };
}

/** Companions with neither name are dropped; a half-filled one is an error. */
export function cleanGuests(guests: ConfirmStayInput["guests"]): StayGuest[] {
  return (guests ?? [])
    .map((g) => ({ firstName: (g?.firstName ?? "").trim(), lastName: (g?.lastName ?? "").trim() }))
    .filter((g) => g.firstName || g.lastName);
}

export function validateGuestDetails(input: {
  buyer: StayBuyer & { fromAccount?: { firstName: boolean; lastName: boolean } };
  guests: StayGuest[];
  specialRequests?: string | null;
  arrivalTime?: string | null;
}) {
  const errors: Record<string, string> = {};
  const nameOk = (v: string, trusted: boolean | undefined) => (trusted ? v.length > 0 : NAME_RE.test(v));
  if (!nameOk(input.buyer.firstName, input.buyer.fromAccount?.firstName)) errors["buyer.firstName"] = input.buyer.firstName ? "invalid" : "required";
  if (!nameOk(input.buyer.lastName, input.buyer.fromAccount?.lastName)) errors["buyer.lastName"] = input.buyer.lastName ? "invalid" : "required";
  if (!/^\+?\d{7,15}$/.test(input.buyer.phone)) errors["buyer.phone"] = input.buyer.phone ? "invalid" : "required";
  if (input.buyer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.buyer.email)) errors["buyer.email"] = "invalid";
  if (input.guests.length > 20) errors.guests = "too_many";
  input.guests.forEach((g, i) => {
    if (!NAME_RE.test(g.firstName)) errors[`guests.${i}.firstName`] = g.firstName ? "invalid" : "required";
    if (!NAME_RE.test(g.lastName)) errors[`guests.${i}.lastName`] = g.lastName ? "invalid" : "required";
  });
  if ((input.specialRequests ?? "").length > 1000) errors.specialRequests = "too_long";
  if (input.arrivalTime && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(input.arrivalTime)) errors.arrivalTime = "invalid";
  if (Object.keys(errors).length > 0) throw fail.validation("invalid_guest_details", { fields: errors });
}

export async function confirmStayCheckout(userId: string, input: ConfirmStayInput): Promise<ConfirmStayResult> {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(input.idempotencyKey)) throw fail.validation("idempotency_key");
  if (!isCalendarId(input.displayCalendar)) throw fail.validation("calendar");

  const replay = await findByIdempotencyKey(userId, input.idempotencyKey);
  if (replay) return { ...replay, replayed: true };
  const merged = mergeBuyer(input.buyer, await getCheckoutProfile(userId));
  const guests = cleanGuests(input.guests);
  validateGuestDetails({ buyer: merged, guests, specialRequests: input.specialRequests, arrivalTime: input.arrivalTime });
  const { fromAccount: _fromAccount, ...buyer } = merged;
  const settings = await getStaySettings();

  let result: ConfirmStayResult;
  try {
    result = await db.begin(async (tx) => {
      const [hold] = await tx<any[]>`
        select id::text, user_id::text, room_type_id::text, rate_plan_id::text, check_in::text, check_out::text, rooms, status
          from stay.holds where id = ${input.holdId}::uuid for update`;
      if (!hold || hold.user_id !== userId) throw fail.notFound("hold_not_found");
      if (hold.room_type_id !== input.roomTypeId || hold.rate_plan_id !== input.ratePlanId || hold.check_in !== input.checkIn
          || hold.check_out !== input.checkOut || hold.rooms !== input.occupancy.rooms) {
        throw fail.validation("hold_mismatch");
      }
      const r = await loadOffer(tx as unknown as Tx, input, settings);
      // Never charge an amount the guest did not see (H07).
      if (Math.abs(r.quote.total - input.expectedTotal) > 0.0001) throw fail.conflict("price_changed", { total: r.quote.total, currency: r.quote.currency });
      if (r.policy.version !== input.acceptedPolicyVersion) throw fail.conflict("policy_changed", { version: r.policy.version });

      const bookingId = crypto.randomUUID();
      await tx`select stay.convert_hold(${input.holdId}::uuid, ${userId}::uuid, ${bookingId}::uuid)`;
      if (!r.row.provider_service_id) {
        await tx`select stay.ensure_booking_anchor(${r.row.property_id}::uuid)`;
      }
      const [{ anchor }] = await tx<{ anchor: string }[]>`select provider_service_id::text as anchor from stay.properties where id = ${r.row.property_id}::uuid`;

      const free = r.quote.total <= 0;
      const isRequest = r.row.confirmation_mode === "request";
      const status: ConfirmStayResult["status"] = isRequest ? "requested" : free ? "confirmed" : "pending_payment";
      const q = r.quote;
      const children = input.occupancy.childAges.length;

      await tx`
        insert into booking.bookings (
          id, provider_id, service_id, specialist_id, selected_date, selected_time,
          payment_method, add_ons, upload_files, additional_services, payment_status, booking_status, user_id,
          currency_code, total_amount, paid_amount, booking_ui_mode, adults, children, infants, metadata,
          source_currency_code, display_currency_code, payment_currency_code, settlement_currency_code,
          source_subtotal_amount, source_addons_amount, source_total_amount,
          display_subtotal_amount, display_addons_amount, display_total_amount, pricing_snapshot
        ) values (
          ${bookingId}::uuid, ${r.row.service_provider_id}::uuid, ${anchor}::uuid, null,
          ${input.checkIn}::date, ${r.row.cin}::time,
          ${free ? "free_booking" : "pending"}, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
          ${free ? "NotRequired" : "Pending"}, ${status === "confirmed" ? "Confirmed" : "Pending"}, ${userId}::uuid,
          ${q.currency}, ${q.total}, 0, 'custom_form',
          ${input.occupancy.adults}, ${children}, 0,
          ${db.json({ kind: "stay", propertyId: r.row.property_id, roomTypeId: input.roomTypeId, ratePlanId: input.ratePlanId, checkIn: input.checkIn, checkOut: input.checkOut, rooms: input.occupancy.rooms } as never)},
          ${q.currency}, ${q.currency}, ${q.currency}, ${q.currency},
          ${q.roomsSubtotal}, 0, ${q.total}, ${q.roomsSubtotal}, 0, ${q.total},
          ${db.json(q as never)}
        )`;
      if (free) {
        await tx`
          insert into booking.payments (booking_id, user_id, payment_method, gateway, amount, currency, status, source_currency_code, settlement_currency_code, source_amount, settlement_amount)
          values (${bookingId}::uuid, ${userId}::uuid, 'free_booking', 'internal', 0, ${q.currency}, 'Succeeded', ${q.currency}, ${q.currency}, 0, 0)`;
      }

      const paymentDeadline = status === "pending_payment" ? new Date(Date.now() + settings.paymentWindowMinutes * 60_000) : null;
      const requestExpires = isRequest ? new Date(Date.now() + r.row.request_timeout_hours * 3_600_000) : null;
      const contentSnapshot = {
        propertyName: r.row.name,
        roomName: r.row.room_name,
        cityName: r.row.city_name,
        address: r.row.address,
        contactPhone: r.row.contact_phone,
        latitude: r.row.latitude == null ? null : Number(r.row.latitude),
        longitude: r.row.longitude == null ? null : Number(r.row.longitude),
        checkInTime: String(r.row.cin).slice(0, 5),
        checkOutTime: String(r.row.cout).slice(0, 5),
        timezone: r.row.timezone,
        mealPlan: r.row.meal_plan,
        refundable: r.row.refundable,
        ratePlanCode: r.row.rp_code,
      };
      const policySnapshot = {
        version: r.policy.version,
        rules: r.row.refundable ? normalizeRules(r.policy.rules) : [],
        refundable: r.row.refundable,
        noShowRefundPercent: r.policy.no_show_refund_percent,
        texts: r.policy.texts,
      };
      await tx`
        insert into stay.bookings (
          booking_id, property_id, room_type_id, rate_plan_id, hold_id, user_id, service_provider_id, status, confirmation_mode,
          check_in, check_out, nights, rooms, adults, children, child_ages, currency_code, total_amount, price_snapshot,
          policy_id, policy_snapshot, policy_accepted_at, content_snapshot, ui_locale, display_calendar, buyer, guests,
          special_requests, arrival_time, voucher_code, idempotency_key, request_expires_at, payment_deadline_at, confirmed_at
        ) values (
          ${bookingId}::uuid, ${r.row.property_id}::uuid, ${input.roomTypeId}::uuid, ${input.ratePlanId}::uuid, ${input.holdId}::uuid,
          ${userId}::uuid, ${r.row.service_provider_id}::uuid, ${status}, ${r.row.confirmation_mode},
          ${input.checkIn}::date, ${input.checkOut}::date, ${q.nights}, ${input.occupancy.rooms}, ${input.occupancy.adults}, ${children},
          ${input.occupancy.childAges}::smallint[], ${q.currency}, ${q.total}, ${db.json(q as never)},
          ${r.policy.id}::uuid, ${db.json(policySnapshot as never)}, now(), ${db.json(contentSnapshot as never)},
          ${input.uiLocale}, ${input.displayCalendar},
          ${db.json(buyer as never)},
          ${db.json(guests as never)},
          ${input.specialRequests?.trim() || null}, ${input.arrivalTime || null}, ${voucherCode()}, ${input.idempotencyKey},
          ${requestExpires}, ${paymentDeadline}, ${status === "confirmed" ? new Date() : null}
        )`;
      await tx`
        insert into stay.booking_events (booking_id, event_type, dedupe_key, payload, actor_user_id)
        values (${bookingId}::uuid, 'created', ${`created:${bookingId}`}, ${db.json({ status, total: q.total } as never)}, ${userId}::uuid)`;
      if (status === "confirmed") {
        await tx`insert into stay.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, 'confirmed', ${`confirmed:${bookingId}`})`;
      }
      const [b] = await tx<any[]>`select voucher_code from stay.bookings where booking_id = ${bookingId}::uuid`;
      return {
        bookingId,
        status,
        voucherCode: b.voucher_code,
        amountDue: status === "pending_payment" ? q.total : 0,
        currency: q.currency,
        paymentDeadlineAt: paymentDeadline?.toISOString() ?? null,
        requestExpiresAt: requestExpires?.toISOString() ?? null,
        replayed: false,
      };
    });
  } catch (e) {
    // A concurrent identical submit may have won the race; its booking is the answer.
    const again = await findByIdempotencyKey(userId, input.idempotencyKey).catch(() => null);
    if (again) return { ...again, replayed: true };
    throw mapStayError(e, "confirmStayCheckout");
  }

  await notifyStayEvent(result.bookingId, result.status === "confirmed" ? "confirmed" : result.status === "requested" ? "requested" : "created").catch((e) =>
    logUnexpected("stays.notify", e),
  );
  return result;
}

async function findByIdempotencyKey(userId: string, key: string): Promise<Omit<ConfirmStayResult, "replayed"> | null> {
  const [row] = await db<any[]>`
    select booking_id::text, status, voucher_code, total_amount, currency_code, payment_deadline_at, request_expires_at, user_id::text
      from stay.bookings where idempotency_key = ${key}`;
  if (!row) return null;
  if (row.user_id !== userId) throw fail.conflict("idempotency_key_conflict");
  return {
    bookingId: row.booking_id,
    status: row.status,
    voucherCode: row.voucher_code,
    amountDue: row.status === "pending_payment" ? Number(row.total_amount) : 0,
    currency: row.currency_code,
    paymentDeadlineAt: row.payment_deadline_at ? new Date(row.payment_deadline_at).toISOString() : null,
    requestExpiresAt: row.request_expires_at ? new Date(row.request_expires_at).toISOString() : null,
  };
}

/**
 * Moves a paid booking to confirmed exactly once. Safe to call from the voucher
 * page, the sweeper and concurrently. A payment that arrives after the booking
 * expired is NOT turned into a voucher: it is left for finance (H08 "late
 * successful payments need reconciliation rather than an unbacked voucher").
 */
export async function reconcileStayBooking(bookingId: string): Promise<BookingStatus | null> {
  const transitioned = await db<{ booking_id: string }[]>`
    update stay.bookings sb
       set status = 'confirmed', confirmed_at = now(), payment_deadline_at = null, updated_at = now()
      from booking.bookings b
     where sb.booking_id = ${bookingId}::uuid and b.id = sb.booking_id
       and sb.status = 'pending_payment'
       and b.payment_status in ('Paid','NotRequired')
    returning sb.booking_id::text`;
  if (transitioned.length > 0) {
    await db`update booking.bookings set booking_status = 'Confirmed', last_modified_date = now() where id = ${bookingId}::uuid`;
    await db`insert into stay.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, 'confirmed', ${`confirmed:${bookingId}`}) on conflict (dedupe_key) do nothing`;
    await notifyStayEvent(bookingId, "confirmed").catch((e) => logUnexpected("stays.notify", e));
  }
  const [row] = await db<{ status: BookingStatus }[]>`select status from stay.bookings where booking_id = ${bookingId}::uuid`;
  return row?.status ?? null;
}

/** Expires lapsed holds, unpaid bookings and unanswered requests. Idempotent. */
export async function sweepStayDeadlines(): Promise<{ holds: number; unpaid: number; requests: number; completed: number }> {
  const [h] = await db<{ n: number }[]>`select stay.expire_holds() as n`;
  const unpaid = await db<{ booking_id: string }[]>`
    select booking_id::text from stay.bookings where status = 'pending_payment' and payment_deadline_at <= now() limit 200`;
  let unpaidCount = 0;
  for (const u of unpaid) {
    const n = await db.begin(async (tx) => {
      const [paid] = await tx<any[]>`select payment_status from booking.bookings where id = ${u.booking_id}::uuid for update`;
      if (paid && ["Paid", "PartiallyPaid"].includes(paid.payment_status)) return -1;
      const [r] = await tx<{ n: number }[]>`select stay.close_booking(${u.booking_id}::uuid, 'expired', 'payment_window_elapsed') as n`;
      await tx`update booking.bookings set booking_status = 'Cancelled', payment_status = 'Cancelled', last_modified_date = now()
                where id = ${u.booking_id}::uuid and payment_status not in ('Paid','PartiallyPaid')`;
      await tx`update booking.payments set status = 'Cancelled', updated_at = now() where booking_id = ${u.booking_id}::uuid and status = 'Pending'`;
      return r?.n ?? 0;
    });
    if (n === -1) await reconcileStayBooking(u.booking_id);
    else if (n > 0) {
      unpaidCount += 1;
      await notifyStayEvent(u.booking_id, "expired").catch((e) => logUnexpected("stays.notify", e));
    }
  }
  const requests = await db<{ booking_id: string }[]>`
    select booking_id::text from stay.bookings where status = 'requested' and request_expires_at <= now() limit 200`;
  let requestCount = 0;
  for (const r of requests) {
    const [x] = await db<{ n: number }[]>`select stay.close_booking(${r.booking_id}::uuid, 'expired', 'request_timeout') as n`;
    if (x?.n) {
      requestCount += 1;
      await db`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${r.booking_id}::uuid`;
      await notifyStayEvent(r.booking_id, "request_expired").catch((e) => logUnexpected("stays.notify", e));
    }
  }
  // Stays whose check-out passed become completed (enables reviews).
  const done = await db`
    update stay.bookings set status = 'completed', updated_at = now()
     where status = 'confirmed' and check_out <= (now() at time zone 'Asia/Tehran')::date
    returning booking_id`;
  return { holds: h?.n ?? 0, unpaid: unpaidCount, requests: requestCount, completed: done.length };
}

/** Host/admin answer to a request-to-book. Accept → pay window (or confirmed if free); decline → released. */
export async function decideStayRequest(actor: Actor, bookingId: string, decision: "accept" | "decline", reason?: string) {
  const settings = await getStaySettings();
  const outcome = await db.begin(async (tx) => {
    const [b] = await tx<any[]>`select sb.status, sb.total_amount, sb.property_id::text from stay.bookings sb where sb.booking_id = ${bookingId}::uuid for update`;
    if (!b) throw fail.notFound("booking_not_found");
    if (b.status !== "requested") throw fail.conflict("not_requested");
    if (decision === "decline") {
      await tx`select stay.close_booking(${bookingId}::uuid, 'declined', ${reason ?? null})`;
      await tx`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${bookingId}::uuid`;
      await audit(tx as unknown as Tx, actor, b.property_id, "booking", bookingId, "request_declined", { reason });
      return "declined" as const;
    }
    const free = Number(b.total_amount) <= 0;
    await tx`
      update stay.bookings
         set status = ${free ? "confirmed" : "pending_payment"}, request_expires_at = null,
             payment_deadline_at = ${free ? null : new Date(Date.now() + settings.paymentWindowMinutes * 60_000 * 4)},
             confirmed_at = ${free ? new Date() : null}, updated_at = now()
       where booking_id = ${bookingId}::uuid`;
    if (free) {
      await tx`update booking.bookings set booking_status = 'Confirmed', payment_status = 'NotRequired', last_modified_date = now() where id = ${bookingId}::uuid`;
    }
    await tx`insert into stay.booking_events (booking_id, event_type, dedupe_key, actor_user_id) values (${bookingId}::uuid, 'accepted', ${`accepted:${bookingId}`}, ${actor.userId}::uuid) on conflict do nothing`;
    await audit(tx as unknown as Tx, actor, b.property_id, "booking", bookingId, "request_accepted", {});
    return free ? ("confirmed" as const) : ("pending_payment" as const);
  });
  await notifyStayEvent(bookingId, outcome === "declined" ? "declined" : outcome === "confirmed" ? "confirmed" : "accepted").catch((e) => logUnexpected("stays.notify", e));
  return outcome;
}

// Cancellation -------------------------------------------------------------------

async function loadForCancel(bookingId: string) {
  const [b] = await db<any[]>`
    select sb.status, sb.user_id::text, sb.check_in::text, sb.policy_snapshot, sb.content_snapshot, sb.property_id::text, sb.currency_code,
           bb.paid_amount, bb.payment_status
      from stay.bookings sb join booking.bookings bb on bb.id = sb.booking_id
     where sb.booking_id = ${bookingId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  const [cur] = await db<{ d: number }[]>`select decimal_digits as d from finance.currencies where code = ${b.currency_code}`;
  return { ...b, decimals: cur ? Number(cur.d) : b.currency_code === "IRR" ? 0 : 2 };
}

function computeRefund(b: any, operatorCancelled = false) {
  const snap = b.policy_snapshot ?? {};
  return stayRefundQuote({
    rules: snap.rules,
    refundable: snap.refundable !== false,
    checkIn: b.check_in,
    checkInTime: b.content_snapshot?.checkInTime ?? "14:00",
    timeZone: b.content_snapshot?.timezone ?? "Asia/Tehran",
    now: new Date(),
    paidAmount: Number(b.paid_amount ?? 0),
    currencyDecimals: b.decimals,
    operatorCancelled,
  });
}

/** Preview of what a cancellation refunds right now (H10). Owner only. */
export async function quoteStayCancellation(userId: string, bookingId: string) {
  const b = await loadForCancel(bookingId);
  if (b.user_id !== userId) throw fail.notFound("booking_not_found");
  return { status: b.status as BookingStatus, quote: computeRefund(b), currency: b.currency_code as string };
}

export async function cancelStayByCustomer(userId: string, bookingId: string, reason: string) {
  const b = await loadForCancel(bookingId);
  if (b.user_id !== userId) throw fail.notFound("booking_not_found");
  if (!["pending_payment", "requested", "confirmed"].includes(b.status)) throw fail.conflict("not_cancellable");
  return cancelBooking({ userId, isAdmin: false } as Actor, bookingId, b, reason, false);
}

export async function cancelStayByAdmin(actor: Actor, bookingId: string, reason: string, operatorFault: boolean) {
  const b = await loadForCancel(bookingId);
  if (!["pending_payment", "requested", "confirmed"].includes(b.status)) throw fail.conflict("not_cancellable");
  return cancelBooking(actor, bookingId, b, reason, operatorFault);
}

async function cancelBooking(actor: Actor, bookingId: string, b: any, reason: string, operatorFault: boolean) {
  const quote = computeRefund(b, operatorFault);
  await db.begin(async (tx) => {
    const [r] = await tx<{ n: number }[]>`select stay.close_booking(${bookingId}::uuid, 'cancelled', ${reason}) as n`;
    if (!r?.n) throw fail.conflict("not_cancellable");
    await tx`update stay.bookings set refund_quote = ${db.json(quote as never)} where booking_id = ${bookingId}::uuid`;
    await tx`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${bookingId}::uuid`;
    await tx`update booking.payments set status = 'Cancelled', updated_at = now() where booking_id = ${bookingId}::uuid and status = 'Pending'`;
    if (quote.refundAmount > 0) {
      // The refund itself is executed by finance in the platform refunds workflow.
      await tx`
        insert into stay.booking_events (booking_id, event_type, dedupe_key, payload, actor_user_id)
        values (${bookingId}::uuid, 'refund_requested', ${`refund:${bookingId}`}, ${db.json(quote as never)}, ${actor.userId}::uuid)
        on conflict (dedupe_key) do nothing`;
    }
    await audit(tx as unknown as Tx, actor, b.property_id, "booking", bookingId, actor.isAdmin ? "cancelled_by_admin" : "cancelled_by_guest", {
      reason,
      refundAmount: quote.refundAmount,
      operatorFault,
    });
  });
  await notifyStayEvent(bookingId, "cancelled").catch((e) => logUnexpected("stays.notify", e));
  return quote;
}

// The customer's bookings -----------------------------------------------------------

const bookingSelect = () => db`
  select sb.booking_id::text, sb.voucher_code, sb.status, sb.property_id::text, p.slug, p.name, sb.content_snapshot, sb.check_in::text, sb.check_out::text,
         sb.nights, sb.rooms, sb.adults, sb.child_ages, sb.currency_code, sb.total_amount, bb.paid_amount, bb.payment_status, sb.confirmation_mode,
         sb.buyer, sb.guests, sb.special_requests, sb.arrival_time, sb.policy_snapshot, sb.price_snapshot, sb.payment_deadline_at, sb.request_expires_at,
         sb.created_at, sb.cancelled_at, sb.cancel_reason, sb.refund_quote, sb.ui_locale, p.location_privacy,
         (select m.url from stay.media m where m.property_id = p.id and m.room_type_id is null order by m.is_cover desc, m.sort_order limit 1) as cover_url,
         exists (select 1 from stay.reviews r where r.booking_id = sb.booking_id) as reviewed
    from stay.bookings sb
    join stay.properties p on p.id = sb.property_id
    join booking.bookings bb on bb.id = sb.booking_id
`;

function toMyBooking(r: any, locale: string): MyStayBooking {
  const snap = r.content_snapshot ?? {};
  const confirmed = ["confirmed", "completed"].includes(r.status);
  // A hotel's address and map pin are public on its page, so the guest sees them from the start.
  // Only a private home (approximate location) keeps the exact address and phone until confirmed (H09).
  const isPrivate = r.location_privacy === "approximate";
  const reveal = confirmed || !isPrivate;
  const policyText = pick(r.policy_snapshot?.texts, locale)?.value ?? null;
  return {
    bookingId: r.booking_id,
    voucherCode: r.voucher_code,
    status: r.status,
    propertyId: r.property_id,
    propertySlug: r.slug,
    propertyName: pickStr(snap.propertyName ?? r.name, locale),
    roomName: pickStr(snap.roomName, locale),
    coverUrl: r.cover_url,
    city: pickStr(snap.cityName, locale),
    checkIn: r.check_in,
    checkOut: r.check_out,
    nights: r.nights,
    rooms: r.rooms,
    adults: r.adults,
    childAges: (r.child_ages ?? []).map(Number),
    currency: r.currency_code,
    totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount ?? 0),
    paymentStatus: r.payment_status,
    confirmationMode: r.confirmation_mode,
    mealPlan: snap.mealPlan ?? "room_only",
    refundable: snap.refundable !== false,
    checkInTime: snap.checkInTime ?? "14:00",
    checkOutTime: snap.checkOutTime ?? "12:00",
    timezone: snap.timezone ?? "Asia/Tehran",
    privateHome: isPrivate,
    address: reveal ? (pick(snap.address, locale)?.value ?? null) : null,
    location: reveal && snap.latitude != null ? { latitude: snap.latitude, longitude: snap.longitude } : null,
    contactPhone: reveal ? (snap.contactPhone ?? null) : null,
    buyer: r.buyer,
    guests: r.guests ?? [],
    specialRequests: r.special_requests,
    arrivalTime: r.arrival_time,
    policy: { rules: normalizeRules(r.policy_snapshot?.rules), noShowRefundPercent: r.policy_snapshot?.noShowRefundPercent ?? 0, text: policyText },
    priceSnapshot: r.price_snapshot,
    paymentDeadlineAt: r.payment_deadline_at ? new Date(r.payment_deadline_at).toISOString() : null,
    requestExpiresAt: r.request_expires_at ? new Date(r.request_expires_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
    cancelReason: r.cancel_reason,
    refundQuote: r.refund_quote ? { refundAmount: Number(r.refund_quote.refundAmount ?? 0), refundPercent: Number(r.refund_quote.refundPercent ?? 0) } : null,
    canReview: r.status === "completed" && !r.reviewed,
    reviewed: Boolean(r.reviewed),
  };
}

export async function listMyStayBookings(userId: string, locale: string) {
  const rows = await db<any[]>`${bookingSelect()} where sb.user_id = ${userId}::uuid order by sb.check_in desc, sb.created_at desc limit 200`;
  const all = rows.map((r) => toMyBooking(r, locale));
  const today = todayIn();
  return {
    upcoming: all.filter((b) => ["pending_payment", "requested", "confirmed"].includes(b.status) && b.checkOut >= today).reverse(),
    past: all.filter((b) => b.status === "completed" || b.status === "no_show" || (b.status === "confirmed" && b.checkOut < today)),
    cancelled: all.filter((b) => ["cancelled", "declined", "expired"].includes(b.status)),
  };
}

/** Owner-only read; another account's id is reported as not found (no enumeration). */
export async function getMyStayBooking(userId: string, bookingId: string, locale: string): Promise<MyStayBooking> {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) throw fail.notFound("booking_not_found");
  const [r] = await db<any[]>`${bookingSelect()} where sb.booking_id = ${bookingId}::uuid and sb.user_id = ${userId}::uuid`;
  if (!r) throw fail.notFound("booking_not_found");
  return toMyBooking(r, locale);
}

// Reviews ------------------------------------------------------------------------

export async function submitStayReview(
  userId: string,
  input: { bookingId: string; rating: number; cleanliness?: number | null; location?: number | null; staff?: number | null; value?: number | null; body?: string | null; locale: string; authorName?: string | null },
) {
  const [b] = await db<any[]>`select status, property_id::text, user_id::text from stay.bookings where booking_id = ${input.bookingId}::uuid`;
  if (!b || b.user_id !== userId) throw fail.notFound("booking_not_found");
  if (b.status !== "completed") throw fail.conflict("stay_not_completed");
  try {
    const [r] = await db<{ id: string }[]>`
      insert into stay.reviews (booking_id, property_id, user_id, rating, cleanliness, location, staff, value, body, locale, author_name)
      values (${input.bookingId}::uuid, ${b.property_id}::uuid, ${userId}::uuid, ${input.rating}, ${input.cleanliness ?? null}, ${input.location ?? null},
              ${input.staff ?? null}, ${input.value ?? null}, ${input.body?.trim() || null}, ${input.locale}, ${input.authorName?.trim() || null})
      returning id::text`;
    return r.id;
  } catch (e) {
    const err = mapStayError(e, "submitStayReview");
    if (err.code === "duplicate") throw fail.conflict("already_reviewed");
    throw err;
  }
}

// Audit + notifications ---------------------------------------------------------------

export async function audit(tx: Tx, actor: { userId: string | null }, propertyId: string | null, entityType: string, entityId: string | null, action: string, detail: Record<string, unknown>) {
  await tx`
    insert into stay.audit_log (actor_user_id, property_id, entity_type, entity_id, action, detail)
    values (${actor.userId}::uuid, ${propertyId}::uuid, ${entityType}, ${entityId}::uuid, ${action}, ${db.json(detail as never)})`;
}

/** Public link to the booking, in the guest's language, on this site. */
export function stayBookingUrl(bookingId: string, uiLocale: string | null | undefined): string {
  const base = (process.env.NEXT_PUBLIC_URL || "").replace(/\/$/, "");
  const lang = String(uiLocale || "fa").split("-")[0].toLowerCase();
  const prefix = (routing.locales as readonly string[]).includes(lang) ? lang : routing.defaultLocale;
  return `${base}/${prefix}/stays/bookings/${bookingId}`;
}

/**
 * Tells the guest about a booking event on every channel they can be reached on: in-app,
 * email (account address, else the booker's), SMS (account mobile, else the booker's) and web
 * push (devices the account subscribed). Channels an admin has switched off in
 * /admin/notification-channels are recorded as cancelled by the dispatcher, not lost silently.
 * Once per booking and event (dedupe key), so a retry or a second tab never notifies twice.
 */
export async function notifyStayEvent(bookingId: string, kind: StayNoticeKind) {
  const [b] = await db<any[]>`
    select user_id::text, ui_locale, display_calendar, voucher_code, content_snapshot, check_in::text, check_out::text, buyer
      from stay.bookings where booking_id = ${bookingId}::uuid`;
  if (!b) return;
  const claimed = await db`
    insert into stay.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, ${`notify_${kind}`}, ${`notify:${kind}:${bookingId}`})
    on conflict (dedupe_key) do nothing returning id`;
  if (claimed.length === 0) return;
  try {
    const { title, body } = renderStayNotice(kind, {
      locale: b.ui_locale,
      calendar: b.display_calendar,
      checkIn: b.check_in,
      checkOut: b.check_out,
      voucher: b.voucher_code,
      propertyName: pickStr(b.content_snapshot?.propertyName, b.ui_locale),
    });
    const profile = await getCheckoutProfile(b.user_id).catch(() => null);
    const email = profile?.email || (typeof b.buyer?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.buyer.email) ? b.buyer.email : null);
    const phone = profile?.phone || (typeof b.buyer?.phone === "string" && b.buyer.phone.trim() ? b.buyer.phone.replace(/[\s-]/g, "") : null);
    const url = stayBookingUrl(bookingId, b.ui_locale);
    const channels: ("in_app" | "push" | "email" | "sms")[] = ["in_app", "push"];
    if (email) channels.push("email");
    if (phone) channels.push("sms");
    const { createNotification } = await import("@/app/[locale]/n/app/mobile/notifications/notification-service");
    await createNotification({
      recipientUserId: b.user_id,
      notificationType: "booking",
      title,
      body,
      entityType: "stay_booking",
      entityId: bookingId,
      channels,
      emailTo: email,
      phoneTo: phone,
      data: {
        kind,
        voucher: b.voucher_code,
        href: `/stays/bookings/${bookingId}`,
        channelContent: {
          in_app: { title, body },
          email: { subject: title, body: `${body}

${url}` },
          sms: { body: `${title}
${body}
${url}` },
          push: { title, body, url },
        },
      },
    });
  } catch (e) {
    await db`delete from stay.booking_events where dedupe_key = ${`notify:${kind}:${bookingId}`}`;
    throw mapStayError(e, "notifyStayEvent");
  }
}


