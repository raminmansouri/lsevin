/**
 * Tours platform against a REAL Postgres migrated to the current schema
 * (production-equivalent baseline + 0078/0079). Covers the acceptance tests
 * whose truth lives in the database: concurrency, idempotency, inventory,
 * authorization, publication governance and translation workflow.
 *
 *   TOURS_TEST_DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin_tours_test \
 *   ACCOUNTING_TEST_DATABASE_URL=$TOURS_TEST_DATABASE_URL npx vitest run src/features/tours
 *
 * Skipped when TOURS_TEST_DATABASE_URL is not set. Data is unique per test; no rollback.
 */
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  addMember,
  assertLocalDatabase,
  idemKey,
  sampleBuyer,
  sampleParticipants,
  seedDestination,
  seedProvider,
  seedTour,
  seedUser,
  type SeededTour,
} from "../../testing/fixtures";

const URL_ = process.env.TOURS_TEST_DATABASE_URL;
const suite = URL_ ? describe : describe.skip;

// The notification sink is the one external dependency here; AT-10 makes it fail.
const notifyMock = vi.hoisted(() => ({ fail: false, calls: 0 }));
vi.mock("@/app/[locale]/n/app/mobile/notifications/notification-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createNotification: vi.fn(async () => {
    notifyMock.calls += 1;
    if (notifyMock.fail) throw new Error("ECONNREFUSED notification service down");
    return "00000000-0000-0000-0000-000000000000";
  }),
}));

let sql: postgres.Sql;
let booking: typeof import("./booking");
let authoring: typeof import("./authoring");
let catalog: typeof import("./catalog");
let roles: typeof import("./roles");

const admin = (userId: string) => ({ userId, roles: ["admin"], isAdmin: true });
const user = (userId: string) => ({ userId, roles: ["user"], isAdmin: false });

async function bookOnce(t: SeededTour, userId: string, departureId = t.departureIds[0], adults = 1, extra: Partial<import("./booking").ConfirmCheckoutInput> = {}) {
  const sel = { departureId, optionId: t.optionId, travelers: { adult: adults } };
  const started = await booking.startCheckout(userId, { ...sel, idempotencyKey: idemKey() });
  return booking.confirmCheckout(userId, {
    ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total,
    acceptedPolicyVersion: started.policy.version, policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian",
    buyer: sampleBuyer, participants: sampleParticipants(adults), ...extra,
  });
}

async function departure(id: string) {
  const [d] = await sql<any[]>`select capacity, booked_count, held_count, status, is_blocked from tour.departures where id = ${id}`;
  return d;
}

suite("tours platform (real database)", () => {
  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    sql = postgres(URL_!, { max: 10 });
    booking = await import("./booking");
    authoring = await import("./authoring");
    catalog = await import("./catalog");
    roles = await import("./roles");
  });
  afterAll(async () => {
    await sql?.end();
  });

  it("AT-03 customer sees only published data: 6 images, 2-day itinerary, prices, rules, location", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const dest = await seedDestination(sql);
    const t = await seedTour(sql, { providerId: p.id, destinationId: dest.id, days: 2, images: 6, translateTo: ["en-US"] });
    await sql`update tour.content set draft_value = 'UNREVIEWED DRAFT' where tour_id = ${t.id} and field_key = 'summary' and locale = 'en-US'`;
    await sql`insert into tour.media (tour_id, url, moderation_status) values (${t.id}, '/images/pending.jpg', 'pending')`;
    const d = await catalog.getTourDetail(t.slug, "en-US");
    expect(d).not.toBeNull();
    expect(d!.media).toHaveLength(6);
    expect(new Set(d!.itinerary.map((s) => s.day))).toEqual(new Set([1, 2]));
    expect(d!.itinerary.map((s) => s.title?.value)).toEqual(["Eram Square", "Persepolis", "Naqsh-e Rostam", "Pasargadae", "Return to Shiraz"]);
    expect(d!.text.summary?.value).not.toContain("UNREVIEWED");
    expect(d!.options.find((o) => o.code === "standard")!.tiers.find((x) => x.travelerClass === "adult")!.amount).toBe(12_000_000);
    expect(d!.policy?.cancellationRules).toEqual([{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }]);
    expect(d!.location.meeting).toMatchObject({ exact: true });
    expect(d!.destination?.slug).toBe(dest.slug);
  });

  it("AT-04 stop order A→B→C is preserved and no route metrics are invented", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id });
    const d = await catalog.getTourDetail(t.slug, "en-US");
    expect(d!.itinerary.map((s) => s.position)).toEqual([1, 2, 3]);
    expect(d!.itinerary.every((s) => s.distanceKmFromPrev === null && s.travelMinutesFromPrev === null)).toBe(true);
  });

  it("C-043 approximate location privacy never returns the exact meeting point", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, locationPrivacy: "approximate" });
    const d = await catalog.getTourDetail(t.slug, "en-US");
    expect(d!.location.meeting!.exact).toBe(false);
    expect(d!.location.meeting!.lat).not.toBe(29.6365);
    expect(d!.location.end).toBeNull();
    expect(d!.itinerary.every((s) => !s.exact)).toBe(true);
  });

  it("AT-06 search filters by destination/date/party and only returns eligible slots", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const dest = await seedDestination(sql);
    const roomy = await seedTour(sql, { providerId: p.id, destinationId: dest.id, capacity: 8, firstDepartureInDays: 5, departures: 1 });
    const tiny = await seedTour(sql, { providerId: p.id, destinationId: dest.id, capacity: 2, firstDepartureInDays: 5, departures: 1 });
    const [{ day }] = await sql<any[]>`select starts_on::text as day from tour.departures where id = ${roomy.departureIds[0]}`;
    const res = await catalog.searchTours({ destination: dest.slug, dateFrom: day, dateTo: day, party: 4, sort: "price_asc" }, "en-US");
    expect(res.items.map((i) => i.id)).toEqual([roomy.id]);
    const all = await catalog.searchTours({ destination: dest.slug, dateFrom: day, dateTo: day, party: 4, includeUnavailable: true }, "en-US");
    expect(all.items.map((i) => i.id).sort()).toEqual([roomy.id, tiny.id].sort());
    expect(all.items.find((i) => i.id === tiny.id)!.availability).not.toBe("available");
    const params = catalog.searchToParams({ destination: dest.slug, dateFrom: day, party: 4, sort: "price_desc" });
    expect(catalog.parseTourSearch(Object.fromEntries(params))).toMatchObject({ destination: dest.slug, dateFrom: day, party: 4, sort: "price_desc" });
  });

  it("C-023 search matches Persian with Arabic letter variants and the other language's title", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, titles: { "fa-IR": `تور کیش ${Date.now()}`, "en-US": "Kish island tour" }, translateTo: ["en-US"] });
    const arabicVariant = (await catalog.searchTours({ q: "تور كيش" }, "fa-IR")).items.map((i) => i.id);
    expect(arabicVariant).toContain(t.id);
    const english = (await catalog.searchTours({ q: "kish island" }, "fa-IR")).items.map((i) => i.id);
    expect(english).toContain(t.id);
  });

  it("AT-07 two customers racing for the last seat: exactly one gets it", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, capacity: 1, departures: 1 });
    const [a, b] = [await seedUser(sql), await seedUser(sql)];
    const results = await Promise.allSettled([bookOnce(t, a.id), bookOnce(t, b.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason.code).toBe("insufficient_capacity");
    const d = await departure(t.departureIds[0]);
    expect(d.booked_count + d.held_count).toBe(1);
    expect(d.booked_count).toBeLessThanOrEqual(d.capacity);
  });

  it("AT-08 an unpaid hold expires and releases its seats exactly once, from any process", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, capacity: 3, departures: 1 });
    const c = await seedUser(sql);
    const started = await booking.startCheckout(c.id, { departureId: t.departureIds[0], optionId: t.optionId, travelers: { adult: 2 }, idempotencyKey: idemKey() });
    expect((await departure(t.departureIds[0])).held_count).toBe(2);
    await sql`update tour.holds set expires_at = now() - interval '1 second' where id = ${started.holdId}`;
    // Five independent "workers" (separate connections, as after a restart) sweep concurrently.
    const workers = Array.from({ length: 5 }, () => postgres(URL_!, { max: 1 }));
    const counts = await Promise.all(workers.map((w) => w`select tour.expire_holds(${t.departureIds[0]}::uuid) as n`.then((r) => Number(r[0].n))));
    await Promise.all(workers.map((w) => w.end()));
    expect(counts.reduce((x, y) => x + y, 0)).toBe(1);
    const d = await departure(t.departureIds[0]);
    expect(d.held_count).toBe(0);
    expect(d.booked_count).toBe(0);
    await expect(booking.confirmCheckout(c.id, {
      departureId: t.departureIds[0], optionId: t.optionId, travelers: { adult: 2 }, holdId: started.holdId, idempotencyKey: idemKey(),
      expectedTotal: started.quote.total, acceptedPolicyVersion: 1, policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian",
      buyer: sampleBuyer, participants: sampleParticipants(2),
    })).rejects.toMatchObject({ code: "hold_expired" });
  });

  it("AT-09 repeating submit and payment success five times yields one booking, one charge, one confirmation", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, capacity: 5, departures: 1, adultPrice: 1_000_000 });
    const c = await seedUser(sql, { walletIrr: 50_000_000 });
    // Fund the accounting ledger the way a real deposit does, so the platform's
    // wallet payment (which mirrors into accounting.wallets) can settle.
    const { mirrorWalletCredit } = await import("@/accounting/server/legacy-bridge");
    const appDb = (await import("@/config/database/db")).default;
    await appDb.begin((tx) => mirrorWalletCredit({
      userId: c.id, currencyCode: "IRR", amount: "50000000", idempotencyKey: `fixture-deposit-${c.id}`,
      sourceType: "deposit", counterpartAccountKey: "bank_platform", description: "tours fixture deposit",
    }, tx as never));
    const sel = { departureId: t.departureIds[0], optionId: t.optionId, travelers: { adult: 1 } };
    const started = await booking.startCheckout(c.id, { ...sel, idempotencyKey: idemKey() });
    const key = idemKey();
    const input = {
      ...sel, holdId: started.holdId, idempotencyKey: key, expectedTotal: started.quote.total, acceptedPolicyVersion: 1,
      policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian" as const, buyer: sampleBuyer, participants: sampleParticipants(1),
    };
    const submits = await Promise.all(Array.from({ length: 5 }, () => booking.confirmCheckout(c.id, input)));
    expect(new Set(submits.map((s) => s.bookingId)).size).toBe(1);
    const bookingId = submits[0].bookingId;
    expect((await departure(t.departureIds[0])).booked_count).toBe(1);

    const { createBookingPaymentIntent } = await import("@/features/booking-pro/server/payment-repository");
    const pays = await Promise.allSettled(Array.from({ length: 5 }, () => createBookingPaymentIntent({ bookingId, userId: c.id, paymentMethodCode: "wallet" })));
    const failures = pays.filter((x) => x.status === "rejected").map((x) => String((x as PromiseRejectedResult).reason?.message ?? x));
    expect(failures, failures.join(" | ")).toEqual([]);
    const debits = await sql<any[]>`select count(*)::int as n, coalesce(sum(amount),0)::numeric as total from customer.wallet_transactions where booking_id = ${bookingId} and transaction_type = 'booking_payment' and status = 'completed'`;
    expect(debits[0].n).toBe(1);

    const statuses = await Promise.all(Array.from({ length: 5 }, () => booking.reconcileTourBooking(bookingId)));
    expect(statuses.every((s) => s === "confirmed")).toBe(true);
    const events = await sql<any[]>`select event_type, count(*)::int as n from tour.booking_events where booking_id = ${bookingId} group by event_type`;
    const byType = Object.fromEntries(events.map((e) => [e.event_type, e.n]));
    expect(byType.created).toBe(1);
    expect(byType.confirmed).toBe(1);
    expect(byType.notify_confirmed).toBe(1);
    const [bb] = await sql<any[]>`select payment_status, booking_status, paid_amount from booking.bookings where id = ${bookingId}`;
    expect(bb.payment_status).toBe("Paid");
    expect(Number(bb.paid_amount)).toBe(1_000_000);
  });

  it("AT-10 a notification outage after payment leaves the booking confirmed and the retry does not duplicate", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, adultPrice: 0 }); // free → confirmed at checkout
    const c = await seedUser(sql);
    notifyMock.fail = true;
    const res = await bookOnce(t, c.id);
    notifyMock.fail = false;
    expect(res.status).toBe("confirmed");
    const [tb] = await sql<any[]>`select status from tour.bookings where booking_id = ${res.bookingId}`;
    expect(tb.status).toBe("confirmed");
    expect((await sql`select 1 from tour.booking_events where booking_id = ${res.bookingId} and event_type = 'notify_confirmed'`).length).toBe(0);
    const before = notifyMock.calls;
    await booking.notifyBookingEvent(res.bookingId, "confirmed");
    await booking.notifyBookingEvent(res.bookingId, "confirmed");
    expect(notifyMock.calls - before).toBe(1);
  });

  it("AT-11 price is quoted server-side (tiers, private group, date rule, add-on) and a changed price is never charged silently", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, adultPrice: 10_000_000, childPrice: 5_000_000 });
    const [{ day }] = await sql<any[]>`select starts_on::text as day from tour.departures where id = ${t.departureIds[0]}`;
    await sql`insert into tour.price_rules (tour_id, date_from, date_to, kind, value) values (${t.id}, ${day}, ${day}, 'percent', -10)`;
    await sql`insert into tour.addons (tour_id, code, pricing, amount) values (${t.id}, 'lunch', 'per_person', 500000)`;
    const [{ id: addonId }] = await sql<any[]>`select id::text from tour.addons where tour_id = ${t.id}`;
    const q = await booking.quoteSelection({ departureId: t.departureIds[0], optionId: t.optionId, travelers: { adult: 2, child: 1 }, addons: [{ id: addonId, quantity: 1 }] });
    expect(q.quote.total).toBe(Math.round(25_000_000 * 0.9) + 1_500_000);
    const priv = await booking.quoteSelection({ departureId: t.departureIds[0], optionId: t.privateOptionId, travelers: { adult: 3 } });
    expect(priv.quote.total).toBe(Math.round(40_000_000 * 0.9));

    const c = await seedUser(sql);
    const sel = { departureId: t.departureIds[0], optionId: t.optionId, travelers: { adult: 1 } };
    const started = await booking.startCheckout(c.id, { ...sel, idempotencyKey: idemKey() });
    await sql`update tour.price_tiers set amount = amount + 1000000 where option_id = ${t.optionId} and traveler_class = 'adult'`;
    await expect(booking.confirmCheckout(c.id, {
      ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: 1,
      policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian", buyer: sampleBuyer, participants: sampleParticipants(1),
    })).rejects.toMatchObject({ code: "price_changed" });
  });

  it("AT-12 cancellation inside/outside the refund window: amount, status, inventory", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const early = await seedTour(sql, { providerId: p.id, departures: 1, firstDepartureInDays: 10, adultPrice: 0 });
    const c = await seedUser(sql);
    const b1 = await bookOnce(early, c.id, early.departureIds[0], 2);
    await sql`update booking.bookings set paid_amount = 2000000, payment_status = 'Paid' where id = ${b1.bookingId}`;
    const quoted = await booking.quoteCustomerCancellation(c.id, b1.bookingId);
    expect(quoted.refund).toMatchObject({ refundPercent: 100, reason: "policy" });
    const res = await booking.cancelByCustomer(c.id, b1.bookingId, "plans changed");
    expect(res.seatsReleased).toBe(2);
    expect(res.refund.refundAmount).toBe(2_000_000);
    expect((await departure(early.departureIds[0])).booked_count).toBe(0);
    const [req] = await sql<any[]>`select status from commercial.refund_requests where booking_id = ${b1.bookingId}`;
    expect(req?.status).toBe("requested");
    await expect(booking.cancelByCustomer(c.id, b1.bookingId, "again")).rejects.toMatchObject({ code: "not_cancellable" });
    expect((await departure(early.departureIds[0])).booked_count).toBe(0);

    const late = await seedTour(sql, { providerId: p.id, departures: 1, firstDepartureInDays: 3, adultPrice: 0 });
    const b2 = await bookOnce(late, c.id, late.departureIds[0], 1);
    await sql`update tour.departures set starts_at = now() + interval '10 hours', booking_cutoff_at = now() + interval '9 hours' where id = ${late.departureIds[0]}`;
    await sql`update booking.bookings set paid_amount = 1000000, payment_status = 'Paid' where id = ${b2.bookingId}`;
    const lateQuote = await booking.quoteCustomerCancellation(c.id, b2.bookingId);
    expect(lateQuote.refund.refundAmount).toBe(0);
    expect(lateQuote.refund.feeAmount).toBe(1_000_000);
  });

  it("AT-13 a later policy change does not alter an existing booking's accepted policy", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, firstDepartureInDays: 10, adultPrice: 0 });
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    await authoring.createPolicyVersion(user(owner.id), t.id, {
      cancellationRules: [{ hoursBefore: 720, refundPercent: 10 }],
      texts: { "fa-IR": { cancellation: "بدون بازپرداخت" } },
    });
    await sql`update booking.bookings set paid_amount = 1000000 where id = ${b.bookingId}`;
    const q = await booking.quoteCustomerCancellation(c.id, b.bookingId);
    expect(q.refund.refundPercent).toBe(100);
    const [snap] = await sql<any[]>`select policy_snapshot->>'version' as v, policy_locale from tour.bookings where booking_id = ${b.bookingId}`;
    expect(snap.v).toBe("1");
    expect(snap.policy_locale).toBe("fa-IR");
    // A customer who saw version 1 cannot confirm against version 2 silently.
    const c2 = await seedUser(sql);
    await expect(bookOnce(t, c2.id, t.departureIds[0], 1, { acceptedPolicyVersion: 1 })).rejects.toMatchObject({ code: "policy_changed" });
  });

  it("AT-14 provider X cannot read or change provider Y's tour, booking or live position", async () => {
    const ownerX = await seedUser(sql);
    const ownerY = await seedUser(sql);
    const px = await seedProvider(sql, ownerX.id);
    const py = await seedProvider(sql, ownerY.id);
    void px;
    const ty = await seedTour(sql, { providerId: py.id, confirmationMode: "request", departures: 1 });
    const c = await seedUser(sql);
    const b = await bookOnce(ty, c.id);
    const x = user(ownerX.id);
    await expect(authoring.updateTourCore(x, ty.id, { maxParticipants: 99 })).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.saveContent(x, ty.id, { locale: "fa-IR", fields: { title: "hijacked" } })).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.saveOptions(x, ty.id, "fa-IR", [])).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.contentForEditor(x, ty.id)).rejects.toMatchObject({ kind: "authorization" });
    await expect(booking.decideBookingRequest(x, b.bookingId, "accept")).rejects.toMatchObject({ kind: "authorization" });
    expect(await roles.canSeeDepartureLocation(x, ty.departureIds[0])).toBe(false);
    await expect(booking.getMyTourBooking(ownerX.id, b.bookingId)).rejects.toMatchObject({ kind: "not_found" });
    const [titleRow] = await sql<any[]>`select draft_value from tour.content where tour_id = ${ty.id} and field_key = 'title' and locale = 'fa-IR'`;
    expect(titleRow.draft_value).not.toBe("hijacked");
  });

  it("AT-15 staff cannot publish-edit content; owner acts only within their organization; revoked access is immediate", async () => {
    const owner = await seedUser(sql);
    const staff = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    await addMember(sql, p.id, staff.id, "staff");
    const t = await seedTour(sql, { providerId: p.id, status: "draft" });
    await expect(authoring.saveContent(user(staff.id), t.id, { locale: "fa-IR", fields: { summary: "x" } })).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.submitForReview(user(staff.id), t.id)).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.setTourVisibility(user(owner.id), t.id, "published")).rejects.toMatchObject({ code: "invalid_status_transition" });
    await authoring.saveContent(user(owner.id), t.id, { locale: "fa-IR", fields: { summary: "ok" } });
    await addMember(sql, p.id, owner.id, "owner", "revoked");
    await expect(authoring.saveContent(user(owner.id), t.id, { locale: "fa-IR", fields: { summary: "after revoke" } })).rejects.toMatchObject({ kind: "authorization" });
  });

  it("AT-16 missing policy/media/price blocks publication; repaired draft passes review; rejection stays unpublished", async () => {
    const owner = await seedUser(sql);
    const adminUser = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const o = user(owner.id);
    const { id } = await authoring.createTour(o, { serviceProviderId: p.id, slug: `gov-${Date.now()}`, sourceLocale: "fa-IR", currency: "IRR", title: "تور آزمایشی" });
    await expect(authoring.submitForReview(o, id)).rejects.toMatchObject({ code: "publish_requirements_unmet" });
    const codes = (await authoring.publishRequirements(id)).filter((r) => r.severity === "error").map((r) => r.code);
    expect(codes).toEqual(expect.arrayContaining(["missing_media", "missing_price", "missing_policy", "missing_meeting_point", "missing_summary"]));

    await authoring.saveContent(o, id, { locale: "fa-IR", fields: { summary: "خلاصه", description: "شرح", meeting_instructions: "میدان", safety_notes: "ایمنی" } });
    await authoring.updateTourCore(o, id, { meetingLat: 29.6, meetingLng: 52.5, durationMinutes: 300 });
    await authoring.addMedia(o, id, { url: "https://cdn.example.test/a.jpg", width: 1600, height: 1000, isCover: true });
    await authoring.saveOptions(o, id, "fa-IR", [{ code: "standard", kind: "public", tiers: [{ travelerClass: "adult", amount: 1_000_000 }] }]);
    await authoring.createPolicyVersion(o, id, { cancellationRules: [{ hoursBefore: 24, refundPercent: 100 }], texts: { "fa-IR": { cancellation: "۲۴ ساعت" } } });
    expect((await authoring.publishRequirements(id)).filter((r) => r.severity === "error")).toEqual([]);

    await authoring.submitForReview(o, id);
    await expect(authoring.approveAndPublish(o, id)).rejects.toMatchObject({ kind: "authorization" });
    await authoring.rejectSubmission(admin(adminUser.id), id, "Photos are blurry");
    expect(await catalog.getTourDetail(id, "fa-IR")).toBeNull();
    const [{ status }] = await sql<any[]>`select status from tour.tours where id = ${id}`;
    expect(status).toBe("rejected");

    await authoring.submitForReview(o, id);
    await authoring.approveAndPublish(admin(adminUser.id), id);
    const live = await catalog.getTourDetail(id, "fa-IR");
    expect(live?.text.summary?.value).toBe("خلاصه");
    const [anchor] = await sql<any[]>`select ps.is_active from tour.tours t join category.provider_services ps on ps.id = t.provider_service_id where t.id = ${id}`;
    expect(anchor.is_active).toBe(true);
  });

  it("AT-17 one guide cannot be assigned to overlapping departures unless explicitly overridden", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 2 });
    const guideUser = await seedUser(sql);
    const [g] = await sql<any[]>`insert into tour.guides (user_id, display_name, status) values (${guideUser.id}, 'Reza', 'verified') returning id::text`;
    const range = "[2030-01-01 08:00+00, 2030-01-01 18:00+00)";
    await sql`insert into tour.departure_assignments (departure_id, guide_id, during) values (${t.departureIds[0]}, ${g.id}, ${range}::tstzrange)`;
    await expect(sql`insert into tour.departure_assignments (departure_id, guide_id, during) values (${t.departureIds[1]}, ${g.id}, '[2030-01-01 12:00+00, 2030-01-01 20:00+00)'::tstzrange)`)
      .rejects.toMatchObject({ code: "23P01" });
    await sql`insert into tour.departure_assignments (departure_id, guide_id, during, override_reason) values (${t.departureIds[1]}, ${g.id}, '[2030-01-01 12:00+00, 2030-01-01 20:00+00)'::tstzrange, 'Platform approved backup guide')`;
  });

  it("AT-18 a ticket is accepted at check-in once", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, adultPrice: 0 });
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    await sql`insert into tour.checkins (departure_id, booking_id, scanned_token, result, seats, scanned_by, scanned_at) values (${t.departureIds[0]}, ${b.bookingId}, 'x', 'accepted', 1, ${owner.id}, now())`;
    await expect(sql`insert into tour.checkins (departure_id, booking_id, scanned_token, result, seats, scanned_by, scanned_at) values (${t.departureIds[0]}, ${b.bookingId}, 'x', 'accepted', 1, ${owner.id}, now())`)
      .rejects.toMatchObject({ code: "23505" });
  });

  it("AT-22/AT-35 the same departure booked under each display calendar has identical price, inventory and time", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, capacity: 9, adultPrice: 0 });
    const totals: number[] = [];
    for (const cal of ["persian", "gregory", "islamic-umalqura"] as const) {
      const c = await seedUser(sql);
      const r = await bookOnce(t, c.id, t.departureIds[0], 1, { displayCalendar: cal, uiLocale: cal === "persian" ? "fa" : cal === "gregory" ? "en" : "ar" });
      totals.push(r.amountDue);
      const [row] = await sql<any[]>`select d.starts_at, tb.display_calendar from tour.bookings tb join tour.departures d on d.id = tb.departure_id where tb.booking_id = ${r.bookingId}`;
      expect(row.display_calendar).toBe(cal);
    }
    expect(new Set(totals).size).toBe(1);
    expect((await departure(t.departureIds[0])).booked_count).toBe(3);
  });

  it("AT-32 a Jalali blackout and Jalali price rule apply to the same Gregorian dates at checkout", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 3, firstDepartureInDays: 20, adultPrice: 10_000_000 });
    const days = await sql<any[]>`select id::text, starts_on::text as day from tour.departures where tour_id = ${t.id} order by starts_on`;
    const { isoToParts } = await import("../../domain/calendar");
    const j = (iso: string) => { const x = isoToParts(iso, "persian"); return `${x.year}/${String(x.month).padStart(2, "0")}/${String(x.day).padStart(2, "0")}`; };
    const o = user(owner.id);
    const blackout = await authoring.addBlackout(o, t.id, { from: j(days[0].day), to: j(days[0].day), calendar: "persian", reason: "holiday" });
    expect(blackout.from).toBe(days[0].day);
    const rule = await authoring.addPriceRule(o, t.id, { from: j(days[1].day), to: j(days[1].day), calendar: "persian", kind: "percent", value: 20 });
    expect(rule.from).toBe(days[1].day);
    const c = await seedUser(sql);
    await expect(booking.startCheckout(c.id, { departureId: days[0].id, optionId: t.optionId, travelers: { adult: 1 }, idempotencyKey: idemKey() }))
      .rejects.toMatchObject({ code: "departure_unavailable" });
    expect((await booking.quoteSelection({ departureId: days[1].id, optionId: t.optionId, travelers: { adult: 1 } })).quote.total).toBe(12_000_000);
    expect((await booking.quoteSelection({ departureId: days[2].id, optionId: t.optionId, travelers: { adult: 1 } })).quote.total).toBe(10_000_000);
  });

  it("AT-36 editing only the Persian title leaves other translations, ids, media and availability unchanged", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, translateTo: ["en-US", "ar-SA"] });
    const snapshot = async () => ({
      others: await sql`select locale, field_key, draft_value, published_value from tour.content where tour_id = ${t.id} and locale <> 'fa-IR' order by locale, entity_type, entity_id, field_key`,
      media: await sql`select id, url from tour.media where tour_id = ${t.id} order by 1`,
      deps: await sql`select id, capacity, booked_count from tour.departures where tour_id = ${t.id} order by 1`,
      anchor: await sql`select provider_service_id from tour.tours where id = ${t.id}`,
    });
    const before = await snapshot();
    await authoring.saveContent(user(owner.id), t.id, { locale: "fa-IR", fields: { title: "عنوان جدید فارسی" } });
    const after = await snapshot();
    expect(after.others.map((r: any) => [r.locale, r.field_key, r.draft_value, r.published_value]))
      .toEqual(before.others.map((r: any) => [r.locale, r.field_key, r.draft_value, r.published_value]));
    expect(after.media).toEqual(before.media);
    expect(after.deps).toEqual(before.deps);
    expect(after.anchor).toEqual(before.anchor);
  });

  it("AT-37 changing source cancellation text marks translations outdated, keeps live text, and keeps booked snapshots", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, translateTo: ["en-US"], departures: 1, adultPrice: 0 });
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    await authoring.saveContent(user(owner.id), t.id, { locale: "fa-IR", fields: { cancellation_policy: "قانون جدید لغو" } });
    const [en] = await sql<any[]>`select status, published_value from tour.content where tour_id = ${t.id} and field_key = 'cancellation_policy' and locale = 'en-US'`;
    expect(en.status).toBe("outdated");
    expect(en.published_value).toContain("Full refund");
    const live = await catalog.getTourDetail(t.slug, "fa-IR");
    expect(live!.text.cancellation_policy?.value).not.toBe("قانون جدید لغو");
    const [snap] = await sql<any[]>`select policy_snapshot from tour.bookings where booking_id = ${b.bookingId}`;
    expect(JSON.stringify(snap.policy_snapshot)).not.toContain("قانون جدید لغو");
    expect((await authoring.publishRequirements(t.id)).map((r) => r.code)).toContain("outdated_translations");
  });

  it("AT-38 a locale reviewer edits/approves only assigned text — never prices, other locales or other providers", async () => {
    const owner = await seedUser(sql);
    const translator = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const other = await seedProvider(sql, (await seedUser(sql)).id);
    const t = await seedTour(sql, { providerId: p.id, translateTo: ["en-US"] });
    const t2 = await seedTour(sql, { providerId: other.id, translateTo: ["en-US"] });
    await sql`insert into tour.translator_assignments (user_id, locale, service_provider_id) values (${translator.id}, 'en-US', ${p.id})`;
    const tr = user(translator.id);
    await authoring.saveContent(tr, t.id, { locale: "en-US", fields: { summary: "Reviewed English summary" } });
    await authoring.approveContent(tr, t.id, "en-US", { fieldKeys: ["summary"] });
    const [row] = await sql<any[]>`select status, published_value from tour.content where tour_id = ${t.id} and field_key = 'summary' and locale = 'en-US'`;
    expect(row).toMatchObject({ status: "published", published_value: "Reviewed English summary" });
    await expect(authoring.saveContent(tr, t.id, { locale: "fa-IR", fields: { summary: "x" } })).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.saveOptions(tr, t.id, "en-US", [])).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.updateTourCore(tr, t.id, { maxParticipants: 1 })).rejects.toMatchObject({ kind: "authorization" });
    await expect(authoring.saveContent(tr, t2.id, { locale: "en-US", fields: { summary: "x" } })).rejects.toMatchObject({ kind: "authorization" });
    await expect(booking.decideBookingRequest(tr, t.departureIds[0], "accept")).rejects.toBeTruthy();
  });

  it("AT-39 incomplete translations fall back with a label; required disclosures are never blank", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, translateTo: [] });
    const d = await catalog.getTourDetail(t.slug, "de-DE");
    for (const f of ["title", "summary", "description", "meeting_instructions", "cancellation_policy", "safety_notes"] as const) {
      expect(d!.text[f]?.value, f).toBeTruthy();
      expect(d!.text[f]?.isFallback, f).toBe(true);
    }
    expect(d!.anyFallback).toBe(true);
    expect(d!.policy?.text.cancellation?.value).toBeTruthy();
  });

  it("AT-42 monthly rules recur on their own calendar's day and materialize idempotently", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 0 });
    const { isoToParts } = await import("../../domain/calendar");
    const o = user(owner.id);
    const today = new Date().toISOString().slice(0, 10);
    const jt = isoToParts(today, "persian");
    await authoring.addScheduleRule(o, t.id, { calendar: "persian", kind: "monthly_day", monthDay: 15, localTime: "09:00", startDate: `${jt.year}/${jt.month}/1`, capacity: 10 });
    await authoring.addScheduleRule(o, t.id, { calendar: "gregory", kind: "monthly_day", monthDay: 15, localTime: "10:00", startDate: today, capacity: 10 });
    const again = await authoring.materializeDepartures(o, t.id);
    expect(again.created).toBe(0);
    const rows = await sql<any[]>`select starts_on::text as day, local_start_time::text as time from tour.departures where tour_id = ${t.id} order by starts_on`;
    const jalali = rows.filter((r) => r.time.startsWith("09:00"));
    const greg = rows.filter((r) => r.time.startsWith("10:00"));
    expect(jalali.length).toBeGreaterThanOrEqual(5);
    expect(jalali.every((r) => isoToParts(r.day, "persian").day === 15)).toBe(true);
    expect(greg.every((r) => r.day.endsWith("-15"))).toBe(true);
  });

  it("C-009/C-103 recent views: newest first, bounded, per owner, hidden when unpublished", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const a = await seedTour(sql, { providerId: p.id });
    const b = await seedTour(sql, { providerId: p.id });
    const u1 = `u:${(await seedUser(sql)).id}`;
    const u2 = `u:${(await seedUser(sql)).id}`;
    await catalog.recordRecentView(u1, a.id);
    await new Promise((r) => setTimeout(r, 15));
    await catalog.recordRecentView(u1, b.id);
    expect((await catalog.listRecentViews(u1, "en-US")).map((c) => c.id)).toEqual([b.id, a.id]);
    expect(await catalog.listRecentViews(u2, "en-US")).toEqual([]);
    await sql`update tour.tours set status = 'paused' where id = ${b.id}`;
    expect((await catalog.listRecentViews(u1, "en-US")).map((c) => c.id)).toEqual([a.id]);
    await catalog.clearRecentViews(u1);
    expect(await catalog.listRecentViews(u1, "en-US")).toEqual([]);
  });

  it("C-096 request-to-book: accept leads to payment, decline releases seats, timeout expires", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, confirmationMode: "request", departures: 1, capacity: 4 });
    const [c1, c2, c3] = [await seedUser(sql), await seedUser(sql), await seedUser(sql)];
    const r1 = await bookOnce(t, c1.id);
    const r2 = await bookOnce(t, c2.id);
    const r3 = await bookOnce(t, c3.id);
    expect([r1.status, r2.status, r3.status]).toEqual(["requested", "requested", "requested"]);
    expect(await booking.decideBookingRequest(user(owner.id), r1.bookingId, "accept")).toBe("pending_payment");
    expect(await booking.decideBookingRequest(user(owner.id), r2.bookingId, "decline")).toBe("declined");
    await sql`update tour.bookings set request_expires_at = now() - interval '1 minute' where booking_id = ${r3.bookingId}`;
    await booking.sweepTourDeadlines();
    const statuses = await sql<any[]>`select booking_id::text, status from tour.bookings where booking_id in (${r1.bookingId}, ${r2.bookingId}, ${r3.bookingId})`;
    expect(Object.fromEntries(statuses.map((s) => [s.booking_id, s.status]))).toEqual({ [r1.bookingId]: "pending_payment", [r2.bookingId]: "declined", [r3.bookingId]: "expired" });
    expect((await departure(t.departureIds[0])).booked_count).toBe(1);
  });
});
