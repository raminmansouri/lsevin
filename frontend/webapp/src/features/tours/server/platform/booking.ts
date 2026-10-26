import "server-only";

import { randomBytes } from "node:crypto";

import db from "@/config/database/db";

import { isCalendarId, type CalendarId } from "../../domain/calendar";
import { refundQuote } from "../../domain/cancellation";
import { contentLocaleFor, pickTranslation } from "../../domain/content";
import { QuoteError, quote, seatCount, TRAVELER_CLASSES, type PriceRule, type PricedAddon, type PricedOption, type Quote, type TravelerCounts } from "../../domain/pricing";

import { requireProviderRole, type Actor } from "./roles";
import { currencyDecimals, getTourDetail } from "./catalog";
import { fail, logUnexpected, mapDbError, ToursError } from "./errors";
import { getTourSettings, type TourSettings } from "./settings";

/**
 * Tour checkout on top of the platform booking engine (C-081..C-096).
 *
 *   startCheckout   — server-side quote + an expiring seat hold (tour.place_hold)
 *   confirmCheckout — re-quotes, verifies the accepted policy version, converts
 *                     the hold and writes booking.bookings + booking.payments +
 *                     tour.bookings in ONE transaction, keyed by an idempotency key
 *   payment         — the customer pays through the existing
 *                     /api/booking-pro/payments/create-intent (wallet / gateway);
 *                     reconcileTourBooking() confirms exactly once when paid
 *   sweep           — expires holds, unpaid bookings and unanswered requests
 */

type Tx = typeof db;

export type CheckoutSelection = {
  departureId: string;
  optionId: string;
  travelers: TravelerCounts;
  addons?: { id: string; quantity: number }[];
};

async function loadPricing(tx: Tx, departureId: string, optionId: string) {
  const [dep] = await tx<any[]>`
    select d.id::text, d.tour_id::text, d.option_id::text, d.starts_on, d.starts_at, d.local_start_time::text, d.timezone,
           d.booking_cutoff_at, d.capacity, d.booked_count, d.held_count, d.status, d.is_blocked, d.is_active,
           t.status as tour_status, t.currency_code, t.confirmation_mode, t.request_timeout_hours, t.service_provider_id::text,
           t.provider_service_id::text, t.source_locale, t.slug, t.max_participants, t.min_age
      from tour.departures d join tour.tours t on t.id = d.tour_id
     where d.id = ${departureId}::uuid
  `;
  if (!dep) throw fail.notFound("departure_not_found");
  if (dep.option_id && dep.option_id !== optionId) throw fail.validation("option_not_offered_on_departure");
  const [opt] = await tx<any[]>`
    select o.id::text, o.kind, o.min_group, o.max_group, o.private_group_price, o.code,
           coalesce(json_agg(json_build_object('travelerClass', p.traveler_class, 'amount', p.amount)) filter (where p.id is not null), '[]') as tiers
      from tour.options o left join tour.price_tiers p on p.option_id = o.id
     where o.id = ${optionId}::uuid and o.tour_id = ${dep.tour_id}::uuid and o.is_active
     group by o.id
  `;
  if (!opt) throw fail.validation("option_not_found");
  const option: PricedOption = {
    id: opt.id, kind: opt.kind, minGroup: opt.min_group, maxGroup: opt.max_group,
    privateGroupPrice: opt.private_group_price == null ? null : Number(opt.private_group_price),
    tiers: (opt.tiers as any[]).map((t) => ({ travelerClass: t.travelerClass, amount: Number(t.amount) })),
  };
  const addonRows = await tx<any[]>`select id::text, code, pricing, amount, max_qty from tour.addons where tour_id = ${dep.tour_id}::uuid and is_active`;
  const addons: PricedAddon[] = addonRows.map((a) => ({ id: a.id, code: a.code, pricing: a.pricing, amount: Number(a.amount), maxQty: a.max_qty }));
  const ruleRows = await tx<any[]>`select option_id::text, date_from::text, date_to::text, kind, value from tour.price_rules where tour_id = ${dep.tour_id}::uuid order by created_at`;
  const rules: PriceRule[] = ruleRows.map((r) => ({ optionId: r.option_id, dateFrom: r.date_from, dateTo: r.date_to, kind: r.kind, value: Number(r.value) }));
  const [policy] = await tx<any[]>`
    select id::text, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts
      from tour.policy_versions where tour_id = ${dep.tour_id}::uuid order by version desc limit 1
  `;
  if (!policy) throw fail.conflict("policy_missing");
  const localDate = dep.starts_on instanceof Date ? dep.starts_on.toISOString().slice(0, 10) : String(dep.starts_on).slice(0, 10);
  return { dep, option, optionCode: opt.code as string, addons, rules, policy, localDate };
}

/**
 * Quote inside a transaction. Reads only through `tx`: touching the global pool
 * while holding a transaction connection deadlocks the pool under concurrency
 * (N concurrent checkouts holding all N connections, each waiting for one more).
 */
async function computeQuote(tx: Tx, sel: CheckoutSelection, settings: TourSettings) {
  const p = await loadPricing(tx, sel.departureId, sel.optionId);
  const [cur] = await tx<{ d: number }[]>`select decimal_digits as d from finance.currencies where code = ${p.dep.currency_code}`;
  let q: Quote;
  try {
    q = quote({
      currency: p.dep.currency_code,
      currencyDecimals: cur ? Number(cur.d) : 2,
      option: p.option,
      departureDate: p.localDate,
      travelers: sel.travelers,
      addons: sel.addons,
      availableAddons: p.addons,
      priceRules: p.rules,
      serviceFeePercent: settings.serviceFeePercent,
    });
  } catch (e) {
    if (e instanceof QuoteError) throw fail.validation(e.code);
    throw e;
  }
  if (p.dep.max_participants && q.seats > p.dep.max_participants) throw fail.validation("group_size");
  return { ...p, quote: q };
}

/** Public quote for the live price summary (booking_process_3.png). No side effects. */
export async function quoteSelection(sel: CheckoutSelection) {
  try {
    const r = await computeQuote(db, sel, await getTourSettings());
    return {
      quote: r.quote,
      remaining: Math.max(0, r.dep.capacity - r.dep.booked_count - r.dep.held_count),
      policyVersion: r.policy.version,
    };
  } catch (e) {
    throw mapDbError(e, "quoteSelection");
  }
}

export type StartCheckoutResult = {
  holdId: string;
  expiresAt: string;
  quote: Quote;
  policy: { id: string; version: number };
  confirmationMode: "instant" | "request";
};

export async function startCheckout(userId: string, sel: CheckoutSelection & { idempotencyKey: string }): Promise<StartCheckoutResult> {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(sel.idempotencyKey)) throw fail.validation("idempotency_key");
  try {
    const settings = await getTourSettings();
    return await db.begin(async (tx) => {
      const r = await computeQuote(tx as unknown as Tx, sel, settings);
      const [hold] = await tx<any[]>`
        select id::text, expires_at, seats, status from tour.place_hold(${sel.departureId}::uuid, ${userId}::uuid, ${r.quote.seats}, ${settings.holdMinutes}, ${sel.idempotencyKey})
      `;
      if (hold.seats !== r.quote.seats) throw fail.conflict("idempotency_key_reused");
      return {
        holdId: hold.id,
        expiresAt: new Date(hold.expires_at).toISOString(),
        quote: r.quote,
        policy: { id: r.policy.id, version: r.policy.version },
        confirmationMode: r.dep.confirmation_mode,
      };
    });
  } catch (e) {
    throw mapDbError(e, "startCheckout");
  }
}

export async function releaseCheckoutHold(userId: string, holdId: string): Promise<boolean> {
  const [r] = await db<{ ok: boolean }[]>`select tour.release_hold(${holdId}::uuid, ${userId}::uuid) as ok`;
  return Boolean(r?.ok);
}

export type Participant = {
  travelerClass: (typeof TRAVELER_CLASSES)[number];
  firstName: string;
  lastName: string;
  nationality?: string | null;
  age?: number | null;
  idDocumentLast4?: string | null;
  assistanceRequest?: string | null;
  isForeign?: boolean;
};

export type ConfirmCheckoutInput = CheckoutSelection & {
  holdId: string;
  idempotencyKey: string;
  expectedTotal: number;
  acceptedPolicyVersion: number;
  policyLocale: string;
  uiLocale: string;
  displayCalendar: CalendarId;
  buyer: { firstName: string; lastName: string; email?: string | null; phone: string; phoneCountryCode?: string | null };
  participants: Participant[];
  notes?: string | null;
};

export type ConfirmCheckoutResult = {
  bookingId: string;
  status: "pending_payment" | "requested" | "confirmed";
  voucherCode: string;
  amountDue: number;
  currency: string;
  paymentDeadlineAt: string | null;
  requestExpiresAt: string | null;
  replayed: boolean;
};

function token(bytes: number) {
  return randomBytes(bytes).toString("base64url");
}
function voucherCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = randomBytes(8);
  return `TR-${Array.from(raw, (b) => alphabet[b % alphabet.length]).join("")}`;
}

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'\-]{0,79}$/u;

function validateParticipants(input: ConfirmCheckoutInput, seats: number) {
  const errors: Record<string, string> = {};
  if (!NAME_RE.test(input.buyer.firstName?.trim() ?? "")) errors["buyer.firstName"] = "invalid";
  if (!NAME_RE.test(input.buyer.lastName?.trim() ?? "")) errors["buyer.lastName"] = "invalid";
  const phone = String(input.buyer.phone ?? "").replace(/[\s-]/g, "");
  if (!/^\+?\d{7,15}$/.test(phone)) errors["buyer.phone"] = "invalid";
  if (input.buyer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.buyer.email)) errors["buyer.email"] = "invalid";
  if (input.participants.length !== seats) errors.participants = "count_mismatch";
  const counts: Record<string, number> = {};
  input.participants.forEach((p, i) => {
    counts[p.travelerClass] = (counts[p.travelerClass] ?? 0) + 1;
    if (!NAME_RE.test(p.firstName?.trim() ?? "")) errors[`participants.${i}.firstName`] = "invalid";
    if (!NAME_RE.test(p.lastName?.trim() ?? "")) errors[`participants.${i}.lastName`] = "invalid";
    if (p.age != null && (!Number.isInteger(p.age) || p.age < 0 || p.age > 120)) errors[`participants.${i}.age`] = "invalid";
    if (p.idDocumentLast4 && !/^[A-Za-z0-9]{4}$/.test(p.idDocumentLast4)) errors[`participants.${i}.idDocumentLast4`] = "invalid";
    if (p.nationality && !/^[A-Z]{2}$/.test(p.nationality)) errors[`participants.${i}.nationality`] = "invalid";
    if ((p.assistanceRequest ?? "").length > 500) errors[`participants.${i}.assistanceRequest`] = "too_long";
  });
  for (const cls of TRAVELER_CLASSES) {
    if ((counts[cls] ?? 0) !== (input.travelers[cls] ?? 0)) errors.participants = "class_mismatch";
  }
  if (Object.keys(errors).length > 0) throw fail.validation("invalid_guest_details", { fields: errors });
}

export async function confirmCheckout(userId: string, input: ConfirmCheckoutInput): Promise<ConfirmCheckoutResult> {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(input.idempotencyKey)) throw fail.validation("idempotency_key");
  if (!isCalendarId(input.displayCalendar)) throw fail.validation("calendar");

  // Replay: the same submit (double click, refresh, retried request) returns the
  // booking it already created instead of creating another (C-092, AT-09).
  const replay = await findByIdempotencyKey(userId, input.idempotencyKey);
  if (replay) return { ...replay, replayed: true };

  const seats = seatCount(input.travelers);
  validateParticipants(input, seats);
  const settings = await getTourSettings();

  // Everything read from the global pool happens before the transaction opens.
  const [depTour] = await db<{ tour_id: string }[]>`select tour_id::text from tour.departures where id = ${input.departureId}::uuid`;
  if (!depTour?.tour_id) throw fail.notFound("departure_not_found");
  const contentLocale = contentLocaleFor(input.uiLocale);
  const detail = await getTourDetail(depTour.tour_id, contentLocale, { mode: "published", revealExactLocation: true });
  if (!detail) throw fail.conflict("departure_unavailable");

  let result: ConfirmCheckoutResult;
  try {
    result = await db.begin(async (tx) => {
      const [hold] = await tx<any[]>`select id::text, departure_id::text, user_id::text, seats, status, expires_at from tour.holds where id = ${input.holdId}::uuid for update`;
      if (!hold || hold.user_id !== userId) throw fail.notFound("hold_not_found");
      if (hold.departure_id !== input.departureId) throw fail.validation("hold_departure_mismatch");
      if (hold.seats !== seats) throw fail.validation("hold_seat_mismatch");

      const r = await computeQuote(tx as unknown as Tx, input, settings);
      // Never charge a different amount than the customer saw (C-089).
      if (Math.abs(r.quote.total - input.expectedTotal) > 0.0001) {
        throw fail.conflict("price_changed", { total: r.quote.total, currency: r.quote.currency });
      }
      if (r.policy.version !== input.acceptedPolicyVersion) {
        throw fail.conflict("policy_changed", { version: r.policy.version });
      }
      if (r.dep.tour_status !== "published") throw fail.conflict("departure_unavailable");

      const bookingId = crypto.randomUUID();
      await tx`select tour.convert_hold(${input.holdId}::uuid, ${userId}::uuid, ${bookingId}::uuid)`;

      const free = r.quote.total <= 0;
      const isRequest = r.dep.confirmation_mode === "request";
      const status: ConfirmCheckoutResult["status"] = isRequest ? "requested" : free ? "confirmed" : "pending_payment";

      const policyTexts = (r.policy.texts ?? {}) as Record<string, Record<string, string>>;
      const policyLocaleShown = policyTexts[input.policyLocale] ? input.policyLocale : (pickTranslation(
        Object.fromEntries(Object.entries(policyTexts).map(([k, v]) => [k, v?.cancellation ?? ""])), contentLocale)?.locale ?? r.dep.source_locale);

      const localDate = r.localDate;
      const localTime = r.dep.local_start_time ? String(r.dep.local_start_time).slice(0, 8) : null;
      const counts = input.travelers;

      await tx`
        insert into booking.bookings (
          id, provider_id, service_id, specialist_id, selected_date, selected_time,
          payment_method, add_ons, upload_files, additional_services, payment_status, booking_status, user_id,
          currency_code, total_amount, paid_amount, booking_ui_mode, adults, children, infants, metadata,
          source_currency_code, display_currency_code, payment_currency_code, settlement_currency_code,
          source_subtotal_amount, source_addons_amount, source_total_amount,
          display_subtotal_amount, display_addons_amount, display_total_amount, pricing_snapshot
        ) values (
          ${bookingId}::uuid, ${r.dep.service_provider_id}::uuid, ${r.dep.provider_service_id}::uuid, null,
          ${localDate}::date, ${localTime}::time,
          ${free ? "free_booking" : "pending"}, ${db.json(r.quote.lines.filter((l) => l.kind === "addon") as never)}, '[]'::jsonb, '[]'::jsonb,
          ${free ? "NotRequired" : "Pending"}, ${status === "confirmed" ? "Confirmed" : "Pending"}, ${userId}::uuid,
          ${r.quote.currency}, ${r.quote.total}, 0, 'custom_form',
          ${(counts.adult ?? 0) + (counts.student ?? 0) + (counts.senior ?? 0)}, ${counts.child ?? 0}, ${counts.infant ?? 0},
          ${db.json({ kind: "tour", tourId: r.dep.tour_id, tourDepartureId: r.dep.id, optionId: input.optionId } as never)},
          ${r.quote.currency}, ${r.quote.currency}, ${r.quote.currency}, ${r.quote.currency},
          ${r.quote.subtotal}, ${r.quote.lines.filter((l) => l.kind === "addon").reduce((a, l) => a + l.amount, 0)}, ${r.quote.total},
          ${r.quote.subtotal}, ${r.quote.lines.filter((l) => l.kind === "addon").reduce((a, l) => a + l.amount, 0)}, ${r.quote.total},
          ${db.json(r.quote as never)}
        )
      `;
      if (free) {
        await tx`
          insert into booking.payments (booking_id, user_id, payment_method, gateway, amount, currency, status, source_currency_code, settlement_currency_code, source_amount, settlement_amount)
          values (${bookingId}::uuid, ${userId}::uuid, 'free_booking', 'internal', 0, ${r.quote.currency}, 'Succeeded', ${r.quote.currency}, ${r.quote.currency}, 0, 0)
        `;
      }

      const paymentDeadline = status === "pending_payment" ? new Date(Date.now() + settings.paymentWindowMinutes * 60_000) : null;
      const requestExpires = isRequest ? new Date(Date.now() + r.dep.request_timeout_hours * 3_600_000) : null;
      const contentSnapshot = {
        title: detail.text.title, meetingInstructions: detail.text.meeting_instructions,
        meeting: detail.location.meeting, timezone: detail.facts.timezone,
        provider: detail.provider.name, optionCode: r.optionCode, localDate, localTime,
        startsAt: new Date(r.dep.starts_at).toISOString(),
      };

      await tx`
        insert into tour.bookings (
          booking_id, tour_id, departure_id, option_id, hold_id, user_id, service_provider_id, status, confirmation_mode,
          seats, travelers, currency_code, total_amount, price_snapshot, policy_version_id, policy_snapshot, policy_locale,
          policy_accepted_at, content_snapshot, itinerary_revision, ui_locale, display_calendar, buyer, voucher_code, qr_token,
          idempotency_key, request_expires_at, payment_deadline_at, confirmed_at
        ) values (
          ${bookingId}::uuid, ${r.dep.tour_id}::uuid, ${r.dep.id}::uuid, ${input.optionId}::uuid, ${input.holdId}::uuid, ${userId}::uuid,
          ${r.dep.service_provider_id}::uuid, ${status}, ${r.dep.confirmation_mode}, ${seats}, ${db.json(counts as never)},
          ${r.quote.currency}, ${r.quote.total}, ${db.json(r.quote as never)}, ${r.policy.id}::uuid,
          ${db.json({ version: r.policy.version, cancellationRules: r.policy.cancellation_rules, noShowRefundPercent: r.policy.no_show_refund_percent, lateArrivalMinutes: r.policy.late_arrival_minutes, weatherPolicy: r.policy.weather_policy, texts: r.policy.texts } as never)},
          ${policyLocaleShown}, now(), ${db.json(contentSnapshot as never)},
          (select draft_revision from tour.tours where id = ${r.dep.tour_id}::uuid),
          ${contentLocale}, ${input.displayCalendar}, ${db.json({ ...input.buyer, firstName: input.buyer.firstName.trim(), lastName: input.buyer.lastName.trim() } as never)},
          ${voucherCode()}, ${token(24)}, ${input.idempotencyKey},
          ${requestExpires}, ${paymentDeadline}, ${status === "confirmed" ? new Date() : null}
        )
      `;
      let position = 0;
      for (const p of input.participants) {
        position += 1;
        await tx`
          insert into tour.booking_participants (booking_id, position, traveler_class, first_name, last_name, nationality, age, id_document_last4, assistance_request, is_foreign)
          values (${bookingId}::uuid, ${position}, ${p.travelerClass}, ${p.firstName.trim()}, ${p.lastName.trim()}, ${p.nationality ?? null},
                  ${p.age ?? null}, ${p.idDocumentLast4 ?? null}, ${p.assistanceRequest?.trim() || null}, ${Boolean(p.isForeign)})
        `;
      }
      await tx`
        insert into tour.booking_events (booking_id, event_type, dedupe_key, payload, actor_user_id)
        values (${bookingId}::uuid, 'created', ${`created:${bookingId}`}, ${db.json({ status, total: r.quote.total } as never)}, ${userId}::uuid)
      `;
      if (status === "confirmed") {
        await tx`insert into tour.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, 'confirmed', ${`confirmed:${bookingId}`})`;
      }
      const [b] = await tx<any[]>`select voucher_code from tour.bookings where booking_id = ${bookingId}::uuid`;
      return {
        bookingId, status, voucherCode: b.voucher_code,
        amountDue: status === "pending_payment" ? r.quote.total : 0, currency: r.quote.currency,
        paymentDeadlineAt: paymentDeadline?.toISOString() ?? null,
        requestExpiresAt: requestExpires?.toISOString() ?? null, replayed: false,
      };
    });
  } catch (e) {
    // A concurrent identical submit may have won the race (it converted the hold
    // or inserted the idempotency key first). Whatever this attempt failed on,
    // if a booking with this key now exists, that booking is the answer.
    const again = await findByIdempotencyKey(userId, input.idempotencyKey).catch(() => null);
    if (again) return { ...again, replayed: true };
    throw mapDbError(e, "confirmCheckout");
  }

  // Side effects after commit. A notification failure must not undo or block a
  // booking (AT-10); dispatch is retried by the notifications loop.
  await notifyBookingEvent(result.bookingId, result.status === "confirmed" ? "confirmed" : result.status === "requested" ? "requested" : "created").catch((e) => logUnexpected("notifyBookingEvent", e));
  return result;
}

async function findByIdempotencyKey(userId: string, key: string): Promise<Omit<ConfirmCheckoutResult, "replayed"> | null> {
  const [row] = await db<any[]>`
    select booking_id::text, status, voucher_code, total_amount, currency_code, payment_deadline_at, request_expires_at, user_id::text
      from tour.bookings where idempotency_key = ${key}
  `;
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
 * Moves a paid booking to confirmed exactly once (AT-09/AT-10). Safe to call
 * from the gateway callback, the voucher page, the sweeper — any number of
 * times, concurrently.
 */
export async function reconcileTourBooking(bookingId: string): Promise<string | null> {
  const transitioned = await db<{ booking_id: string }[]>`
    update tour.bookings tb
       set status = 'confirmed', confirmed_at = now(), updated_at = now()
      from booking.bookings b
     where tb.booking_id = ${bookingId}::uuid and b.id = tb.booking_id
       and tb.status = 'pending_payment'
       and b.payment_status in ('Paid','NotRequired')
    returning tb.booking_id::text
  `;
  if (transitioned.length > 0) {
    await db`update booking.bookings set booking_status = 'Confirmed', last_modified_date = now() where id = ${bookingId}::uuid`;
    await db`insert into tour.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, 'confirmed', ${`confirmed:${bookingId}`}) on conflict (dedupe_key) do nothing`;
    await notifyBookingEvent(bookingId, "confirmed").catch((e) => logUnexpected("notifyBookingEvent", e));
  }
  const [row] = await db<{ status: string }[]>`select status from tour.bookings where booking_id = ${bookingId}::uuid`;
  return row?.status ?? null;
}

/** Expires lapsed holds, unpaid bookings and unanswered requests (C-088, C-096, AT-08). */
export async function sweepTourDeadlines(): Promise<{ holds: number; unpaid: number; requests: number }> {
  const [h] = await db<{ n: number }[]>`select tour.expire_holds() as n`;
  const unpaid = await db<{ booking_id: string }[]>`
    select booking_id::text from tour.bookings where status = 'pending_payment' and payment_deadline_at <= now() limit 200
  `;
  let unpaidCount = 0;
  for (const u of unpaid) {
    // Paid at the last second? Confirm instead of expiring.
    if ((await reconcileTourBooking(u.booking_id)) === "confirmed") continue;
    const released = await db.begin(async (tx) => {
      const [paid] = await tx<any[]>`select payment_status from booking.bookings where id = ${u.booking_id}::uuid for update`;
      if (paid && ["Paid", "PartiallyPaid"].includes(paid.payment_status)) return -1;
      const [r] = await tx<{ n: number }[]>`select tour.close_booking(${u.booking_id}::uuid, 'expired', 'payment_window_elapsed') as n`;
      await tx`update booking.bookings set booking_status = 'Cancelled', payment_status = 'Cancelled', last_modified_date = now() where id = ${u.booking_id}::uuid and payment_status not in ('Paid','PartiallyPaid')`;
      await tx`update booking.payments set status = 'Cancelled', updated_at = now() where booking_id = ${u.booking_id}::uuid and status = 'Pending'`;
      return r.n;
    });
    if (released > 0) unpaidCount += 1;
  }
  const requests = await db<{ booking_id: string }[]>`
    select booking_id::text from tour.bookings where status = 'requested' and request_expires_at <= now() limit 200
  `;
  let requestCount = 0;
  for (const r of requests) {
    const [x] = await db<{ n: number }[]>`select tour.close_booking(${r.booking_id}::uuid, 'expired', 'request_not_answered') as n`;
    await db`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${r.booking_id}::uuid`;
    if (x.n > 0) {
      requestCount += 1;
      await notifyBookingEvent(r.booking_id, "request_expired").catch((e) => logUnexpected("notifyBookingEvent", e));
    }
  }
  return { holds: h?.n ?? 0, unpaid: unpaidCount, requests: requestCount };
}

/** Provider accepts/declines a request-to-book (C-096, V-032). */
export async function decideBookingRequest(actor: Actor, bookingId: string, decision: "accept" | "decline", reason?: string) {
  const [b] = await db<any[]>`select service_provider_id::text, status, total_amount from tour.bookings where booking_id = ${bookingId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  await requireProviderRole(actor, b.service_provider_id, "staff");
  if (b.status !== "requested") throw fail.conflict("not_pending_request");
  const settings = await getTourSettings();
  if (decision === "decline") {
    await db.begin(async (tx) => {
      await tx`select tour.close_booking(${bookingId}::uuid, 'declined', ${reason ?? "provider_declined"})`;
      await tx`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${bookingId}::uuid`;
      await audit(tx as unknown as Tx, actor, b.service_provider_id, "booking", bookingId, "request_declined", { reason });
    });
    await notifyBookingEvent(bookingId, "declined").catch((e) => logUnexpected("notifyBookingEvent", e));
    return "declined" as const;
  }
  const free = Number(b.total_amount) <= 0;
  await db.begin(async (tx) => {
    const updated = await tx`
      update tour.bookings
         set status = ${free ? "confirmed" : "pending_payment"},
             confirmed_at = ${free ? new Date() : null},
             payment_deadline_at = ${free ? null : new Date(Date.now() + settings.paymentWindowMinutes * 60_000 * 4)},
             updated_at = now()
       where booking_id = ${bookingId}::uuid and status = 'requested'
      returning booking_id`;
    if (updated.length === 0) throw fail.conflict("not_pending_request");
    if (free) {
      await tx`update booking.bookings set booking_status = 'Confirmed', payment_status = 'NotRequired', last_modified_date = now() where id = ${bookingId}::uuid`;
      await tx`insert into tour.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, 'confirmed', ${`confirmed:${bookingId}`}) on conflict do nothing`;
    }
    await audit(tx as unknown as Tx, actor, b.service_provider_id, "booking", bookingId, "request_accepted", {});
  });
  await notifyBookingEvent(bookingId, free ? "confirmed" : "accepted").catch((e) => logUnexpected("notifyBookingEvent", e));
  return free ? ("confirmed" as const) : ("pending_payment" as const);
}

/** Customer cancellation quoted from the accepted policy snapshot (AT-12, AT-13). */
export async function quoteCustomerCancellation(userId: string, bookingId: string) {
  const [b] = await db<any[]>`
    select tb.status, tb.policy_snapshot, tb.currency_code, d.starts_at, coalesce(bb.paid_amount, 0) as paid_amount
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id join booking.bookings bb on bb.id = tb.booking_id
     where tb.booking_id = ${bookingId}::uuid and tb.user_id = ${userId}::uuid
  `;
  if (!b) throw fail.notFound("booking_not_found");
  return {
    status: b.status as string,
    refund: refundQuote({
      rules: b.policy_snapshot?.cancellationRules, departureAt: new Date(b.starts_at), now: new Date(),
      paidAmount: Number(b.paid_amount), currencyDecimals: await currencyDecimals(b.currency_code),
    }),
    currency: b.currency_code as string,
  };
}

export async function cancelByCustomer(userId: string, bookingId: string, reason: string) {
  const q = await quoteCustomerCancellation(userId, bookingId);
  if (!["pending_payment", "requested", "confirmed"].includes(q.status)) throw fail.conflict("not_cancellable");
  const released = await db.begin(async (tx) => {
    const [r] = await tx<{ n: number }[]>`select tour.close_booking(${bookingId}::uuid, 'cancelled', ${reason.slice(0, 200) || "customer_cancelled"}) as n`;
    if (r.n === 0) throw fail.conflict("not_cancellable");
    await tx`update tour.bookings set refund_quote = ${db.json(q.refund as never)} where booking_id = ${bookingId}::uuid`;
    await tx`update booking.bookings set booking_status = 'Cancelled', last_modified_date = now() where id = ${bookingId}::uuid`;
    await tx`update booking.payments set status = 'Cancelled', updated_at = now() where booking_id = ${bookingId}::uuid and status = 'Pending'`;
    await tx`insert into tour.booking_events (booking_id, event_type, dedupe_key, payload, actor_user_id)
             values (${bookingId}::uuid, 'cancelled', ${`cancelled:${bookingId}`}, ${db.json(q.refund as never)}, ${userId}::uuid)`;
    await tx`insert into tour.audit_log (actor_user_id, actor_scope, entity_type, entity_id, action, detail)
             values (${userId}::uuid, 'customer', 'booking', ${bookingId}::uuid, 'cancelled', ${db.json({ refund: q.refund } as never)})`;
    return r.n;
  });
  let refundRequestId: string | null = null;
  if (q.refund.refundAmount > 0) {
    // Hand the money side to the platform refund workflow (admin-approved,
    // wallet/gateway). The tour side records the quoted amount.
    const { requestBookingRefund } = await import("@/features/refunds/server/repository");
    const res = await requestBookingRefund({
      bookingId, userId, reason: "tour_cancellation",
      customerNote: `Policy refund ${q.refund.refundPercent}% = ${q.refund.refundAmount} ${q.currency}`,
      refundScope: q.refund.refundPercent >= 100 ? "full" : "partial",
    }).catch((e) => { logUnexpected("requestBookingRefund", e); return null; });
    refundRequestId = res?.refundRequestId ?? null;
  }
  await notifyBookingEvent(bookingId, "cancelled").catch((e) => logUnexpected("notifyBookingEvent", e));
  return { seatsReleased: released, refund: q.refund, refundRequestId };
}

// ----------------------------------------------------------------------------
// Customer reads
// ----------------------------------------------------------------------------

export type MyTourBooking = {
  bookingId: string; status: string; voucherCode: string; qrToken: string | null; seats: number; travelers: TravelerCounts;
  currency: string; totalAmount: number; paidAmount: number; paymentStatus: string;
  tour: { id: string; slug: string; title: unknown };
  departure: { id: string; localDate: string; localTime: string | null; startsAt: string; timezone: string; status: string; delayMinutes: number };
  displayCalendar: CalendarId; uiLocale: string; policyLocale: string; policyVersion: number;
  paymentDeadlineAt: string | null; requestExpiresAt: string | null; createdAt: string; cancelledAt: string | null;
  refundQuote: unknown; contentSnapshot: any; priceSnapshot: Quote; buyer: any;
  participants: { position: number; travelerClass: string; firstName: string; lastName: string }[];
  checkedIn: boolean;
};

function mapMine(r: any): MyTourBooking {
  return {
    bookingId: r.booking_id, status: r.status, voucherCode: r.voucher_code,
    qrToken: ["confirmed", "completed"].includes(r.status) ? r.qr_token : null,
    seats: r.seats, travelers: r.travelers, currency: r.currency_code, totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount ?? 0), paymentStatus: r.payment_status,
    tour: { id: r.tour_id, slug: r.slug, title: r.content_snapshot?.title ?? null },
    departure: {
      id: r.departure_id, localDate: r.starts_on instanceof Date ? r.starts_on.toISOString().slice(0, 10) : String(r.starts_on).slice(0, 10),
      localTime: r.local_start_time ? String(r.local_start_time).slice(0, 5) : null,
      startsAt: new Date(r.starts_at).toISOString(), timezone: r.timezone, status: r.dep_status, delayMinutes: r.delay_minutes,
    },
    displayCalendar: r.display_calendar, uiLocale: r.ui_locale, policyLocale: r.policy_locale, policyVersion: r.policy_snapshot?.version,
    paymentDeadlineAt: r.payment_deadline_at ? new Date(r.payment_deadline_at).toISOString() : null,
    requestExpiresAt: r.request_expires_at ? new Date(r.request_expires_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(), cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
    refundQuote: r.refund_quote, contentSnapshot: r.content_snapshot, priceSnapshot: r.price_snapshot, buyer: r.buyer,
    participants: (r.participants ?? []) as MyTourBooking["participants"], checkedIn: Boolean(r.checked_in),
  };
}

const MINE_SELECT = (db_: Tx) => db_`
  select tb.booking_id::text, tb.status, tb.voucher_code, tb.qr_token, tb.seats, tb.travelers, tb.currency_code, tb.total_amount,
         bb.paid_amount, bb.payment_status, tb.tour_id::text, t.slug, tb.departure_id::text, d.starts_on, d.local_start_time::text,
         d.starts_at, d.timezone, d.status as dep_status, d.delay_minutes, tb.display_calendar, tb.ui_locale, tb.policy_locale,
         tb.policy_snapshot, tb.payment_deadline_at, tb.request_expires_at, tb.created_at, tb.cancelled_at, tb.refund_quote,
         tb.content_snapshot, tb.price_snapshot, tb.buyer,
         (select json_agg(json_build_object('position', p.position, 'travelerClass', p.traveler_class, 'firstName', p.first_name, 'lastName', p.last_name) order by p.position)
            from tour.booking_participants p where p.booking_id = tb.booking_id) as participants,
         exists (select 1 from tour.checkins c where c.booking_id = tb.booking_id and c.result = 'accepted') as checked_in
    from tour.bookings tb
    join tour.tours t on t.id = tb.tour_id
    join tour.departures d on d.id = tb.departure_id
    join booking.bookings bb on bb.id = tb.booking_id
`;

export async function listMyTourBookings(userId: string): Promise<{ upcoming: MyTourBooking[]; past: MyTourBooking[]; cancelled: MyTourBooking[] }> {
  const rows = await db<any[]>`${MINE_SELECT(db)} where tb.user_id = ${userId}::uuid order by d.starts_at desc limit 200`;
  const all = rows.map(mapMine);
  const now = Date.now();
  return {
    upcoming: all.filter((b) => ["pending_payment", "requested", "confirmed"].includes(b.status) && new Date(b.departure.startsAt).getTime() > now - 86_400_000).reverse(),
    past: all.filter((b) => b.status === "completed" || b.status === "no_show" || (b.status === "confirmed" && new Date(b.departure.startsAt).getTime() <= now - 86_400_000)),
    cancelled: all.filter((b) => ["cancelled", "declined", "expired"].includes(b.status)),
  };
}

export async function getMyTourBooking(userId: string, bookingId: string): Promise<MyTourBooking> {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) throw fail.notFound("booking_not_found");
  await reconcileTourBooking(bookingId).catch((e) => logUnexpected("reconcileTourBooking", e));
  const rows = await db<any[]>`${MINE_SELECT(db)} where tb.booking_id = ${bookingId}::uuid and tb.user_id = ${userId}::uuid`;
  if (!rows[0]) throw fail.notFound("booking_not_found");
  return mapMine(rows[0]);
}

// ----------------------------------------------------------------------------
// Audit + notifications
// ----------------------------------------------------------------------------

export async function audit(tx: Tx, actor: Actor | { userId: string | null; isAdmin?: boolean }, serviceProviderId: string | null, entityType: string, entityId: string | null, action: string, detail: Record<string, unknown>) {
  const scope = (actor as Actor).isAdmin ? "admin" : serviceProviderId ? `provider:${serviceProviderId}` : actor.userId ? "customer" : "system";
  await tx`
    insert into tour.audit_log (actor_user_id, actor_scope, service_provider_id, entity_type, entity_id, action, detail)
    values (${actor.userId}::uuid, ${scope}, ${serviceProviderId}::uuid, ${entityType}, ${entityId}::uuid, ${action}, ${db.json(detail as never)})
  `;
}

export type BookingEventKind = "created" | "requested" | "accepted" | "declined" | "confirmed" | "cancelled" | "request_expired" | "reminder";

/**
 * In-app (+queued email/SMS) notification in the customer's booking language
 * and calendar (C-105, S-058). Deduplicated per booking+event so a retry or a
 * second reconcile never sends twice.
 */
export async function notifyBookingEvent(bookingId: string, kind: BookingEventKind) {
  const [b] = await db<any[]>`
    select tb.user_id::text, tb.ui_locale, tb.display_calendar, tb.voucher_code, tb.content_snapshot, d.starts_at, d.timezone
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id where tb.booking_id = ${bookingId}::uuid
  `;
  if (!b) return;
  const claimed = await db`
    insert into tour.booking_events (booking_id, event_type, dedupe_key) values (${bookingId}::uuid, ${`notify_${kind}`}, ${`notify:${kind}:${bookingId}`})
    on conflict (dedupe_key) do nothing returning id`;
  if (claimed.length === 0) return;
  try {
    const { renderBookingNotice } = await import("./notifications");
    const { title, body } = renderBookingNotice(kind, {
      locale: b.ui_locale, calendar: b.display_calendar, timeZone: b.timezone, startsAt: new Date(b.starts_at),
      voucher: b.voucher_code, tourTitle: b.content_snapshot?.title?.value ?? "",
    });
    const { createNotification } = await import("@/app/[locale]/n/app/mobile/notifications/notification-service");
    await createNotification({
      recipientUserId: b.user_id, notificationType: "booking", title, body,
      entityType: "tour_booking", entityId: bookingId, channels: ["in_app"],
      data: { kind, voucher: b.voucher_code, href: `/tours/bookings/${bookingId}` },
    });
  } catch (e) {
    // Release the claim so the next reconcile/sweep retries the delivery.
    await db`delete from tour.booking_events where dedupe_key = ${`notify:${kind}:${bookingId}`}`;
    throw e instanceof ToursError ? e : mapDbError(e, "createNotification");
  }
}
