/**
 * Stays against a REAL Postgres migrated with scripts/migrate.mjs (prior
 * production-like state + 0107). The truths that live in the database are
 * tested here: multi-night inventory, concurrency, idempotency, deadlines,
 * payment reconciliation, isolation between accounts and admin guards.
 *
 *   STAYS_TEST_DATABASE_URL=postgres://lsevin:lsevin@127.0.0.1:55432/lsevin_stays_test \
 *   ACCOUNTING_TEST_DATABASE_URL=$STAYS_TEST_DATABASE_URL npx vitest run src/features/stays
 *
 * Skipped when STAYS_TEST_DATABASE_URL is not set. Every test seeds its own data.
 */
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { DEFAULT_SEARCH } from "../domain/search";
import {
  assertLocalDatabase,
  idemKey,
  isoInDays,
  sampleStayBuyer,
  seedStay,
  seedStayCity,
  seedStayProvider,
  seedUser,
  type SeedStayOptions,
  type SeededStay,
} from "../testing/fixtures";

const URL_ = process.env.STAYS_TEST_DATABASE_URL;
const suite = URL_ ? describe : describe.skip;

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
let catalog: typeof import("./catalog");
let admin: typeof import("./admin/properties");
let ops: typeof import("./admin/operations");
let errors: typeof import("./errors");

const adminActor = (userId: string) => ({ userId, roles: ["admin"], isAdmin: true });

async function world(opts: Partial<SeedStayOptions> = {}) {
  const owner = await seedUser(sql as never);
  const provider = await seedStayProvider(sql as never, owner.id);
  const city = await seedStayCity(sql as never);
  const stay = await seedStay(sql as never, { providerId: provider.id, cityId: city.id, ...opts });
  return { owner, provider, city, stay };
}

function selection(stay: SeededStay, checkIn: string, checkOut: string, occ = { rooms: 1, adults: 2, childAges: [] as number[] }, ratePlanId = stay.ratePlanId) {
  return { propertyId: stay.id, roomTypeId: stay.roomTypeId, ratePlanId, checkIn, checkOut, occupancy: occ };
}

async function book(stay: SeededStay, userId: string, checkIn: string, checkOut: string, occ = { rooms: 1, adults: 2, childAges: [] as number[] }) {
  const sel = selection(stay, checkIn, checkOut, occ);
  const started = await booking.startStayCheckout(userId, { ...sel, idempotencyKey: idemKey() });
  return booking.confirmStayCheckout(userId, {
    ...sel,
    holdId: started.holdId,
    idempotencyKey: idemKey(),
    expectedTotal: started.quote.total,
    acceptedPolicyVersion: started.policy.version,
    uiLocale: "fa-IR",
    displayCalendar: "persian",
    buyer: sampleStayBuyer,
    guests: Array.from({ length: occ.rooms }, (_, i) => ({ firstName: "Guest", lastName: ["Ahmadi", "Karimi", "Rostami", "Tehrani", "Shirazi"][i] })),
  });
}

async function inventory(roomTypeId: string, from: string, to: string) {
  return sql<{ d: string; sold: number; held: number }[]>`
    select stay_date::text as d, sold, held from stay.inventory where room_type_id = ${roomTypeId}::uuid and stay_date >= ${from}::date and stay_date < ${to}::date order by stay_date`;
}

suite("stays (real database)", () => {
  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    sql = postgres(URL_!, { max: 12, onnotice: () => {} });
    booking = await import("./booking");
    catalog = await import("./catalog");
    admin = await import("./admin/properties");
    ops = await import("./admin/operations");
    errors = await import("./errors");
  });
  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  describe("search and pricing", () => {
    it("lists published stays of a city with the same total the checkout charges; drafts stay hidden", async () => {
      const { city, stay, provider } = await world({ taxPercent: 9 });
      await seedStay(sql as never, { providerId: provider.id, cityId: city.id, status: "draft" });
      const ci = isoInDays(10);
      const co = isoInDays(13);
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: city.slug, checkIn: ci, checkOut: co }, "fa-IR");
      expect(r.items.map((c) => c.slug)).toEqual([stay.slug]);
      const card = r.items[0];
      expect(card.nights).toBe(3);
      const q = await booking.quoteStaySelection(selection(stay, ci, co));
      expect(card.total).toBe(q.quote.total);
      expect(q.quote.total).toBe(3 * 4_500_000 + Math.round(3 * 4_500_000 * 0.09));
    });

    it("without dates shows a 'from' nightly price and no total", async () => {
      const { city } = await world();
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: city.slug }, "en-US");
      expect(r.items[0]).toMatchObject({ total: null, fromNightly: 4_500_000, available: null });
    });

    it("filters by kind, amenities and party size; a party that fits no room type is excluded", async () => {
      const { city } = await world({ amenities: ["wifi", "pool"] });
      const base = { ...DEFAULT_SEARCH, city: city.slug };
      expect((await catalog.searchProperties({ ...base, amenities: ["pool"] }, "fa-IR")).total).toBe(1);
      expect((await catalog.searchProperties({ ...base, amenities: ["sauna"] }, "fa-IR")).total).toBe(0);
      expect((await catalog.searchProperties({ ...base, kinds: ["villa"] }, "fa-IR")).total).toBe(0);
      expect((await catalog.searchProperties({ ...base, adults: 6 }, "fa-IR")).total).toBe(0);
    });

    it("search matches Persian text typed with Arabic letter forms", async () => {
      const { city } = await world({ name: { "fa-IR": "هتل کریمخان یزدی", "en-US": "Karimkhan Hotel" } });
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: city.slug, q: "كريمخان يزدي" }, "fa-IR");
      expect(r.total).toBe(1);
    });

    it("dated overrides change the quote night by night", async () => {
      const { stay } = await world();
      const ci = isoInDays(20);
      await admin.setPriceRange(adminActor((await seedUser(sql as never)).id), stay.id, { ratePlanId: stay.ratePlanId, from: isoInDays(21), to: isoInDays(22), price: 9_000_000, weekdays: null });
      const q = await booking.quoteStaySelection(selection(stay, ci, isoInDays(23)));
      expect(q.quote.nightly.map((n) => n.amount)).toEqual([4_500_000, 9_000_000, 4_500_000]);
    });
  });

  describe("inventory", () => {
    it("the last room cannot be sold twice: of 6 concurrent holds exactly one wins", async () => {
      const { stay } = await world({ units: 1 });
      const users = await Promise.all(Array.from({ length: 6 }, () => seedUser(sql as never)));
      const ci = isoInDays(30);
      const co = isoInDays(32);
      const results = await Promise.allSettled(users.map((u) => booking.startStayCheckout(u.id, { ...selection(stay, ci, co), idempotencyKey: idemKey() })));
      const ok = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      expect(ok).toHaveLength(1);
      expect(failed.every((f) => f.reason.kind === "conflict" && f.reason.code === "insufficient_inventory")).toBe(true);
      expect((await inventory(stay.roomTypeId, ci, co)).map((n) => n.held)).toEqual([1, 1]);
    });

    it("a hold is all-or-nothing across nights (one closed night → nothing held)", async () => {
      const { stay, owner } = await world({ units: 2 });
      const ci = isoInDays(40);
      await admin.setInventoryRange(adminActor(owner.id), stay.id, { roomTypeId: stay.roomTypeId, from: isoInDays(42), to: isoInDays(43), units: null, stopSell: true, closedToArrival: null, minNights: null });
      const u = await seedUser(sql as never);
      await expect(booking.startStayCheckout(u.id, { ...selection(stay, ci, isoInDays(44)), idempotencyKey: idemKey() })).rejects.toMatchObject({ kind: "conflict", code: "stop_sell" });
      expect((await inventory(stay.roomTypeId, ci, isoInDays(44))).every((n) => n.held === 0)).toBe(true);
    });

    it("half-open nights: the departure day can be sold to the next guest", async () => {
      const { stay } = await world({ units: 1 });
      const [a, b] = [await seedUser(sql as never), await seedUser(sql as never)];
      await book(stay, a.id, isoInDays(50), isoInDays(52));
      const second = await book(stay, b.id, isoInDays(52), isoInDays(54));
      expect(second.status).toBe("pending_payment");
      const c = await seedUser(sql as never);
      await expect(book(stay, c.id, isoInDays(51), isoInDays(53))).rejects.toMatchObject({ code: "insufficient_inventory" });
    });

    it("an entire place is one unit and cannot be booked for 2 rooms", async () => {
      const { stay } = await world({ inventoryModel: "entire_place" });
      const u = await seedUser(sql as never);
      await expect(
        booking.startStayCheckout(u.id, { ...selection(stay, isoInDays(60), isoInDays(62), { rooms: 2, adults: 4, childAges: [] }), idempotencyKey: idemKey() }),
      ).rejects.toMatchObject({ kind: "validation" });
    });

    it("capacity cannot be lowered below what is already sold", async () => {
      const { stay, owner } = await world({ units: 1 });
      const u = await seedUser(sql as never);
      await book(stay, u.id, isoInDays(70), isoInDays(71));
      await expect(
        admin.setInventoryRange(adminActor(owner.id), stay.id, { roomTypeId: stay.roomTypeId, from: isoInDays(70), to: isoInDays(71), units: 0, stopSell: null, closedToArrival: null, minNights: null }),
      ).rejects.toMatchObject({ message: expect.stringContaining("UNITS_BELOW_BOOKED") });
    });
  });

  describe("checkout", () => {
    it("writes booking.bookings + stay.bookings in one transaction and moves held → sold", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const ci = isoInDays(80);
      const co = isoInDays(82);
      const r = await book(stay, u.id, ci, co, { rooms: 2, adults: 3, childAges: [7] });
      expect(r).toMatchObject({ status: "pending_payment", currency: "IRR" });
      const [bb] = await sql<any[]>`select total_amount, payment_status, booking_status, adults, children, metadata from booking.bookings where id = ${r.bookingId}::uuid`;
      expect(Number(bb.total_amount)).toBe(r.amountDue);
      expect(bb.metadata).toMatchObject({ kind: "stay", checkIn: ci, checkOut: co, rooms: 2 });
      expect(await inventory(stay.roomTypeId, ci, co)).toMatchObject([{ sold: 2, held: 0 }, { sold: 2, held: 0 }]);
      const mine = await booking.getMyStayBooking(u.id, r.bookingId, "fa-IR");
      // The address is withheld until the stay is confirmed.
      expect(mine.address).toBeNull();
      expect(mine.childAges).toEqual([7]);
    });

    it("a repeated confirm (double click, retry) returns the same booking", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const sel = selection(stay, isoInDays(90), isoInDays(91));
      const holdKey = idemKey();
      const started = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: holdKey });
      const again = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: holdKey });
      expect(again.holdId).toBe(started.holdId);
      const input = {
        ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: started.policy.version,
        uiLocale: "fa-IR", displayCalendar: "persian" as const, buyer: sampleStayBuyer, guests: [{ firstName: "Ali", lastName: "Rezaei" }],
      };
      const [x, y, z] = await Promise.all([booking.confirmStayCheckout(u.id, input), booking.confirmStayCheckout(u.id, input), booking.confirmStayCheckout(u.id, input)]);
      expect(new Set([x.bookingId, y.bookingId, z.bookingId]).size).toBe(1);
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from stay.bookings where idempotency_key = ${input.idempotencyKey}`;
      expect(n).toBe(1);
    });

    it("refuses to charge a price the guest did not see, and a policy they did not accept", async () => {
      const { stay, owner } = await world();
      const u = await seedUser(sql as never);
      const sel = selection(stay, isoInDays(100), isoInDays(101));
      const started = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: idemKey() });
      const base = { ...sel, holdId: started.holdId, uiLocale: "fa-IR", displayCalendar: "persian" as const, buyer: sampleStayBuyer, guests: [{ firstName: "Ali", lastName: "Rezaei" }] };
      await expect(booking.confirmStayCheckout(u.id, { ...base, idempotencyKey: idemKey(), expectedTotal: started.quote.total - 1000, acceptedPolicyVersion: started.policy.version })).rejects.toMatchObject({
        kind: "conflict",
        code: "price_changed",
      });
      await admin.createPolicyVersion(adminActor(owner.id), stay.id, { rules: [{ hoursBefore: 48, refundPercent: 100 }], noShowRefundPercent: 0, texts: {} });
      await expect(booking.confirmStayCheckout(u.id, { ...base, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: started.policy.version })).rejects.toMatchObject({
        code: "policy_changed",
      });
    });

    it("guest details are validated field by field (validation, never 'infrastructure')", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const sel = selection(stay, isoInDays(105), isoInDays(106));
      const started = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: idemKey() });
      await expect(
        booking.confirmStayCheckout(u.id, {
          ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: started.policy.version,
          uiLocale: "fa-IR", displayCalendar: "persian", buyer: { ...sampleStayBuyer, phone: "12" }, guests: [{ firstName: "", lastName: "X" }],
        }),
      ).rejects.toMatchObject({ kind: "validation", code: "invalid_guest_details", details: { fields: { "buyer.phone": "invalid", "guests.0.firstName": "invalid" } } });
    });

    it("an expired hold is released by the sweep and can no longer be converted", async () => {
      const { stay } = await world({ units: 1 });
      const u = await seedUser(sql as never);
      const sel = selection(stay, isoInDays(110), isoInDays(112));
      const started = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: idemKey() });
      await sql`update stay.holds set expires_at = now() - interval '1 minute' where id = ${started.holdId}::uuid`;
      await booking.sweepStayDeadlines();
      expect((await inventory(stay.roomTypeId, sel.checkIn, sel.checkOut)).every((n) => n.held === 0)).toBe(true);
      await expect(
        booking.confirmStayCheckout(u.id, {
          ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: started.policy.version,
          uiLocale: "fa-IR", displayCalendar: "persian", buyer: sampleStayBuyer, guests: [{ firstName: "Ali", lastName: "Rezaei" }],
        }),
      ).rejects.toMatchObject({ code: "hold_expired" });
    });

    it("a notification outage never undoes a booking", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      notifyMock.fail = true;
      try {
        const r = await book(stay, u.id, isoInDays(115), isoInDays(116));
        expect(r.status).toBe("pending_payment");
      } finally {
        notifyMock.fail = false;
      }
    });
  });

  describe("payment and deadlines", () => {
    it("reconciles a paid booking to confirmed exactly once, concurrently", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const r = await book(stay, u.id, isoInDays(120), isoInDays(121));
      await sql`update booking.bookings set payment_status = 'Paid', paid_amount = total_amount where id = ${r.bookingId}::uuid`;
      const statuses = await Promise.all(Array.from({ length: 5 }, () => booking.reconcileStayBooking(r.bookingId)));
      expect(statuses.every((s) => s === "confirmed")).toBe(true);
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from stay.booking_events where booking_id = ${r.bookingId}::uuid and event_type = 'confirmed'`;
      expect(n).toBe(1);
      const mine = await booking.getMyStayBooking(u.id, r.bookingId, "fa-IR");
      expect(mine.address).toContain("ارم");
    });

    it("an unpaid booking expires at its deadline and returns its nights", async () => {
      const { stay } = await world({ units: 1 });
      const u = await seedUser(sql as never);
      const ci = isoInDays(125);
      const r = await book(stay, u.id, ci, isoInDays(126));
      await sql`update stay.bookings set payment_deadline_at = now() - interval '1 minute' where booking_id = ${r.bookingId}::uuid`;
      await booking.sweepStayDeadlines();
      const [b] = await sql<any[]>`select status from stay.bookings where booking_id = ${r.bookingId}::uuid`;
      expect(b.status).toBe("expired");
      expect((await inventory(stay.roomTypeId, ci, isoInDays(126)))[0].sold).toBe(0);
    });

    it("a booking paid just before the sweep is confirmed, not expired", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const r = await book(stay, u.id, isoInDays(127), isoInDays(128));
      await sql`update stay.bookings set payment_deadline_at = now() - interval '1 minute' where booking_id = ${r.bookingId}::uuid`;
      await sql`update booking.bookings set payment_status = 'Paid', paid_amount = total_amount where id = ${r.bookingId}::uuid`;
      await booking.sweepStayDeadlines();
      const [b] = await sql<any[]>`select status from stay.bookings where booking_id = ${r.bookingId}::uuid`;
      expect(b.status).toBe("confirmed");
    });
  });

  describe("request to book", () => {
    it("requested → declined releases the nights; nothing was charged", async () => {
      const { stay, owner } = await world({ confirmationMode: "request", units: 1 });
      const u = await seedUser(sql as never);
      const ci = isoInDays(130);
      const r = await book(stay, u.id, ci, isoInDays(131));
      expect(r).toMatchObject({ status: "requested", amountDue: 0 });
      expect(await booking.decideStayRequest(adminActor(owner.id), r.bookingId, "decline", "fully booked that night")).toBe("declined");
      expect((await inventory(stay.roomTypeId, ci, isoInDays(131)))[0].sold).toBe(0);
      await expect(booking.decideStayRequest(adminActor(owner.id), r.bookingId, "accept")).rejects.toMatchObject({ code: "not_requested" });
    });

    it("accepted → payment window; unanswered requests expire in the sweep", async () => {
      const { stay, owner } = await world({ confirmationMode: "request" });
      const u = await seedUser(sql as never);
      const a = await book(stay, u.id, isoInDays(135), isoInDays(136));
      expect(await booking.decideStayRequest(adminActor(owner.id), a.bookingId, "accept")).toBe("pending_payment");
      const [ba] = await sql<any[]>`select status, payment_deadline_at from stay.bookings where booking_id = ${a.bookingId}::uuid`;
      expect(ba.status).toBe("pending_payment");
      expect(new Date(ba.payment_deadline_at).getTime()).toBeGreaterThan(Date.now());
      const v = await seedUser(sql as never);
      const b = await book(stay, v.id, isoInDays(137), isoInDays(138));
      await sql`update stay.bookings set request_expires_at = now() - interval '1 minute' where booking_id = ${b.bookingId}::uuid`;
      await booking.sweepStayDeadlines();
      const [bb] = await sql<any[]>`select status from stay.bookings where booking_id = ${b.bookingId}::uuid`;
      expect(bb.status).toBe("expired");
    });
  });

  describe("cancellation, isolation and reviews", () => {
    it("quotes the refund from the accepted policy, cancels once and releases inventory", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const ci = isoInDays(140);
      const r = await book(stay, u.id, ci, isoInDays(141));
      await sql`update booking.bookings set payment_status = 'Paid', paid_amount = total_amount where id = ${r.bookingId}::uuid`;
      await booking.reconcileStayBooking(r.bookingId);
      const q = await booking.quoteStayCancellation(u.id, r.bookingId);
      expect(q.quote).toMatchObject({ refundPercent: 100, refundAmount: r.amountDue });
      const done = await booking.cancelStayByCustomer(u.id, r.bookingId, "plans changed");
      expect(done.refundAmount).toBe(r.amountDue);
      expect((await inventory(stay.roomTypeId, ci, isoInDays(141)))[0].sold).toBe(0);
      await expect(booking.cancelStayByCustomer(u.id, r.bookingId, "again")).rejects.toMatchObject({ code: "not_cancellable" });
    });

    it("a non-refundable rate refunds nothing", async () => {
      const { stay } = await world({ nonRefundablePlan: true });
      const u = await seedUser(sql as never);
      const sel = selection(stay, isoInDays(145), isoInDays(146), undefined, stay.nonRefundablePlanId!);
      const started = await booking.startStayCheckout(u.id, { ...sel, idempotencyKey: idemKey() });
      const r = await booking.confirmStayCheckout(u.id, {
        ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total, acceptedPolicyVersion: started.policy.version,
        uiLocale: "fa-IR", displayCalendar: "persian", buyer: sampleStayBuyer, guests: [{ firstName: "Ali", lastName: "Rezaei" }],
      });
      await sql`update booking.bookings set payment_status = 'Paid', paid_amount = total_amount where id = ${r.bookingId}::uuid`;
      expect((await booking.quoteStayCancellation(u.id, r.bookingId)).quote.refundAmount).toBe(0);
    });

    it("another account cannot read, quote or cancel a booking (reported as not found)", async () => {
      const { stay } = await world();
      const [owner, other] = [await seedUser(sql as never), await seedUser(sql as never)];
      const r = await book(stay, owner.id, isoInDays(150), isoInDays(151));
      await expect(booking.getMyStayBooking(other.id, r.bookingId, "fa-IR")).rejects.toMatchObject({ kind: "not_found" });
      await expect(booking.quoteStayCancellation(other.id, r.bookingId)).rejects.toMatchObject({ kind: "not_found" });
      await expect(booking.cancelStayByCustomer(other.id, r.bookingId, "x")).rejects.toMatchObject({ kind: "not_found" });
      expect((await booking.listMyStayBookings(other.id, "fa-IR")).upcoming).toHaveLength(0);
    });

    it("only a completed stay can be reviewed, once; published reviews drive the rating", async () => {
      const { stay, owner } = await world();
      const u = await seedUser(sql as never);
      const r = await book(stay, u.id, isoInDays(155), isoInDays(156));
      await expect(booking.submitStayReview(u.id, { bookingId: r.bookingId, rating: 5, locale: "fa-IR" })).rejects.toMatchObject({ code: "stay_not_completed" });
      await sql`update stay.bookings set status = 'completed' where booking_id = ${r.bookingId}::uuid`;
      const id = await booking.submitStayReview(u.id, { bookingId: r.bookingId, rating: 4, cleanliness: 5, body: "تمیز و آرام", locale: "fa-IR" });
      await expect(booking.submitStayReview(u.id, { bookingId: r.bookingId, rating: 1, locale: "fa-IR" })).rejects.toMatchObject({ code: "already_reviewed" });
      await ops.moderateReview(adminActor(owner.id), id, "published", null);
      const d = await catalog.getPropertyDetail({ id: stay.id }, "fa-IR");
      expect(d).toMatchObject({ ratingAvg: 4, reviewCount: 1 });
    });
  });

  describe("admin catalog", () => {
    it("create → requirements block publishing → rooms, rates, photo → publish → customers see it", async () => {
      const a = await seedUser(sql as never);
      const provider = await seedStayProvider(sql as never, null);
      const city = await seedStayCity(sql as never);
      const actor = adminActor(a.id);
      const slug = `admin-made-${Date.now().toString(36)}`;
      const id = await admin.createProperty(actor, {
        serviceProviderId: provider.id, cityId: city.id, slug, kind: "traditional", inventoryModel: "rooms", starRating: null,
        name: { "fa-IR": "اقامتگاه سنتی نارنجستان", "en-US": "Narenjestan House" }, summary: { "fa-IR": "خانه‌ای قاجاری با حیاط و حوض." }, description: {}, houseRules: {}, address: {},
        latitude: 29.6, longitude: 52.5, locationPrivacy: "exact", checkInTime: "14:00", checkOutTime: "12:00", amenityCodes: ["wifi"], nearby: [],
        stepFreeAccess: false, accessibleBathroom: false, medicalFriendly: false, petsAllowed: false, smokingAllowed: false, partiesAllowed: false, familiesOnly: false,
        idRequired: true, childFreeUnderAge: 5, confirmationMode: "instant", requestTimeoutHours: 24, currencyCode: "IRR", taxPercent: 0, timezone: "Asia/Tehran",
        contactPhone: "+987100000000", isFeatured: false,
      });
      expect((await admin.publishRequirements(id)).errors).toEqual(expect.arrayContaining(["photo", "room_type", "rate_plan"]));
      await expect(admin.setPropertyStatus(actor, id, "published", null)).rejects.toMatchObject({ code: "publish_requirements" });
      const roomId = await admin.saveRoomType(actor, id, null, {
        code: "courtyard", name: { "fa-IR": "اتاق رو به حیاط" }, description: {}, units: 2, baseOccupancy: 2, maxAdults: 2, maxChildren: 1, maxOccupancy: 3,
        extraBeds: 0, beds: [{ type: "double", count: 1 }], sizeM2: 20, bedrooms: null, bathrooms: 1, amenityCodes: [], sortOrder: 1, isActive: true,
      });
      await admin.saveRatePlan(actor, id, null, {
        roomTypeId: roomId, code: "bb", name: {}, mealPlan: "breakfast", refundable: true, basePrice: 3_200_000, extraAdultPrice: 0, childPrice: 0,
        minNights: 1, maxNights: 30, longStayNights: null, longStayPercent: null, sortOrder: 1, isActive: true,
      });
      await admin.addMedia(actor, id, { url: "/images/stays/yazd-traditional-courtyard.webp", alt: { "fa-IR": "حیاط" }, credit: null, roomTypeId: null });
      await admin.setPropertyStatus(actor, id, "published", null);
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: city.slug }, "fa-IR");
      expect(r.items.map((c) => c.slug)).toEqual([slug]);
      expect(r.items[0].fromNightly).toBe(3_200_000);
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from stay.audit_log where property_id = ${id}::uuid`;
      expect(n).toBeGreaterThanOrEqual(5);
    });

    it("rejects a stale concurrent edit instead of silently overwriting it", async () => {
      const { stay, owner } = await world();
      const data = await admin.getPropertyAdmin(stay.id);
      const { id: _id, providerName: _p, status: _s, accessibilityVerifiedAt: _a, currentPolicyId: _c, ratingAvg: _r, reviewCount: _rc, updatedAt, ...input } = data.property;
      const first = await admin.updateProperty(adminActor(owner.id), stay.id, { ...input, name: { ...input.name, "fa-IR": "نام تازه" } }, updatedAt);
      expect(first.updatedAt).not.toBe(updatedAt);
      await expect(admin.updateProperty(adminActor(owner.id), stay.id, { ...input, name: { "fa-IR": "نام دیگر" } }, updatedAt)).rejects.toMatchObject({ code: "stale_edit" });
      const d = await catalog.getPropertyDetail({ id: stay.id }, "fa-IR");
      expect(d?.name?.value).toBe("نام تازه");
    });

    it("a booked room type or rate plan cannot be deleted; an entire place keeps one unit", async () => {
      const { stay, owner } = await world({ inventoryModel: "entire_place" });
      const u = await seedUser(sql as never);
      await book(stay, u.id, isoInDays(160), isoInDays(161));
      await expect(admin.deleteRoomType(adminActor(owner.id), stay.id, stay.roomTypeId)).rejects.toMatchObject({ code: "room_has_bookings" });
      await expect(admin.deleteRatePlan(adminActor(owner.id), stay.id, stay.ratePlanId)).rejects.toMatchObject({ code: "rate_plan_has_bookings" });
      await expect(
        admin.saveRoomType(adminActor(owner.id), stay.id, null, {
          code: "second", name: { "fa-IR": "دوم" }, description: {}, units: 1, baseOccupancy: 2, maxAdults: 2, maxChildren: 0, maxOccupancy: 2,
          extraBeds: 0, beds: [], sizeM2: null, bedrooms: null, bathrooms: null, amenityCodes: [], sortOrder: 2, isActive: true,
        }),
      ).rejects.toMatchObject({ code: "entire_place_needs_one_unit" });
    });

    it("a city with stays cannot be deleted", async () => {
      const { city, owner } = await world();
      await expect(ops.deleteCity(adminActor(owner.id), city.id)).rejects.toMatchObject({ code: "city_has_properties" });
    });
  });

  describe("platform rules", () => {
    it("a second unpaid booking is either allowed or refused with a clear reason, never 'duplicate'", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      await book(stay, u.id, isoInDays(165), isoInDays(166));
      const [{ present }] = await sql<{ present: boolean }[]>`select to_regclass('booking.ux_bookings_one_pending_checkout_per_user') is not null as present`;
      const second = book(stay, u.id, isoInDays(167), isoInDays(168));
      if (present) await expect(second).rejects.toMatchObject({ kind: "conflict", code: "pending_booking_exists" });
      else await expect(second).resolves.toMatchObject({ status: "pending_payment" });
    });
  });

  describe("error classification", () => {
    it("maps database-raised codes to user errors and outages to infrastructure", () => {
      expect(errors.mapStayError(new Error("INSUFFICIENT_INVENTORY"), "t")).toMatchObject({ kind: "conflict", code: "insufficient_inventory" });
      expect(errors.mapStayError(new Error("MIN_NIGHTS"), "t")).toMatchObject({ kind: "validation" });
      expect(errors.mapStayError(Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), { code: "ECONNREFUSED" }), "t")).toMatchObject({ kind: "infrastructure" });
      expect(errors.mapStayError(Object.assign(new Error("deadlock"), { code: "40P01" }), "t")).toMatchObject({ kind: "unexpected" });
    });
  });
});
