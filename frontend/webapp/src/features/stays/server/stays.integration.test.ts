/**
 * Stays against a REAL Postgres migrated with scripts/migrate.mjs (prior
 * production-like state + 0108). The truths that live in the database are
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
  seedLegacyHotelProvider,
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

// The booking-pro catalog (add-on test) imports session helpers that need the Next runtime; its
// catalog reads never use them.
vi.mock("@/features/booking-pro/utils/auth", () => ({ resolveCurrentUserId: vi.fn(async () => null) }));
vi.mock("@/payment/server/gateway-eligibility", () => ({ resolveUserPaymentRegion: vi.fn(async () => "IR") }));
vi.mock("@/features/finance/lib/server/iranian-visitor", () => ({ resolveIsIranianVisitor: vi.fn(async () => true) }));

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

  describe("location search, landmarks and provider import (0113)", () => {
    /** Moves a seeded stay `meters` north of a point (1° latitude ≈ 111.32 km). */
    async function placeNorthOf(stayId: string, lat: number, lng: number, meters: number) {
      await sql`update stay.properties set latitude = ${lat + meters / 111320}, longitude = ${lng} where id = ${stayId}::uuid`;
    }
    const SHRINE = { lat: 29.60971, lng: 52.54302 };

    async function cityWithShrine() {
      const w = await world();
      await sql`insert into stay.landmarks (city_id, slug, kind, name, latitude, longitude, is_quick)
                values (${w.city.id}::uuid, 'haram', 'shrine', ${sql.json({ "fa-IR": "حرم شاهچراغ", "en-US": "Shah Cheragh Shrine" })}, ${SHRINE.lat}, ${SHRINE.lng}, true)`;
      const mid = await seedStay(sql as never, { providerId: w.provider.id, cityId: w.city.id });
      const far = await seedStay(sql as never, { providerId: w.provider.id, cityId: w.city.id });
      await placeNorthOf(w.stay.id, SHRINE.lat, SHRINE.lng, 300);
      await placeNorthOf(mid.id, SHRINE.lat, SHRINE.lng, 1500);
      await placeNorthOf(far.id, SHRINE.lat, SHRINE.lng, 6000);
      return { ...w, near: w.stay, mid, far };
    }

    it("filters by radius around a landmark, sorts by distance and reports each distance", async () => {
      const w = await cityWithShrine();
      const base = { ...DEFAULT_SEARCH, city: w.city.slug, near: { type: "lm" as const, city: w.city.slug, slug: "haram" } };
      const r1 = await catalog.searchProperties({ ...base, radius: 1000, sort: "distance" }, "fa-IR");
      expect(r1.items.map((c) => c.slug)).toEqual([w.near.slug]);
      expect(r1.anchor).toMatchObject({ kind: "shrine", name: "حرم شاهچراغ" });
      expect(r1.items[0].distanceM).toBeGreaterThan(280);
      expect(r1.items[0].distanceM).toBeLessThan(320);
      expect(r1.items[0].highlights).toContain("walkable");

      const r2 = await catalog.searchProperties({ ...base, radius: 2000, sort: "distance" }, "fa-IR");
      expect(r2.items.map((c) => c.slug)).toEqual([w.near.slug, w.mid.slug]);

      const any = await catalog.searchProperties({ ...base, radius: null, sort: "distance" }, "en-US");
      expect(any.items.map((c) => c.slug)).toEqual([w.near.slug, w.mid.slug, w.far.slug]);
      expect(any.anchor?.name).toBe("Shah Cheragh Shrine");

      // Best match puts the closest first when nothing else differs.
      const best = await catalog.searchProperties({ ...base, radius: null }, "fa-IR");
      expect(best.items[0].slug).toBe(w.near.slug);
    });

    it("an unknown place finds nothing instead of silently showing every stay", async () => {
      const w = await cityWithShrine();
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: w.city.slug, near: { type: "lm", city: w.city.slug, slug: "no-such-place" }, radius: 2000 }, "fa-IR");
      expect(r.total).toBe(0);
      expect(r.anchor).toBeNull();
    });

    it("searches around a map point and around a Lsevin provider (booking add-on)", async () => {
      const w = await cityWithShrine();
      const pt = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: w.city.slug, near: { type: "pt", lat: SHRINE.lat, lng: SHRINE.lng }, radius: 2000 }, "fa-IR");
      expect(pt.items.map((c) => c.slug).sort()).toEqual([w.near.slug, w.mid.slug].sort());
      expect(pt.anchor).toMatchObject({ kind: "point", name: null });

      const clinic = await seedStayProvider(sql as never, null, { name: `Clinic ${Date.now()}` });
      await sql`update category.service_providers set latitude = ${SHRINE.lat}, longitude = ${SHRINE.lng} where id = ${clinic.id}::uuid`;
      const sp = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: w.city.slug, near: { type: "sp", id: clinic.id }, radius: 1000, sort: "distance" }, "en-US");
      expect(sp.items.map((c) => c.slug)).toEqual([w.near.slug]);
      expect(sp.anchor?.kind).toBe("provider");
      expect(sp.anchor?.name).toContain("Clinic");
    });

    it("price filters are per night even with dates (regression: they compared the whole-stay total)", async () => {
      const w = await world({ basePrice: 4_500_000 });
      const ci = isoInDays(20);
      const co = isoInDays(23); // 3 nights = 13,500,000 in total
      const base = { ...DEFAULT_SEARCH, city: w.city.slug, checkIn: ci, checkOut: co };
      expect((await catalog.searchProperties({ ...base, maxPrice: 5_000_000 }, "fa-IR")).total).toBe(1);
      expect((await catalog.searchProperties({ ...base, maxPrice: 4_000_000 }, "fa-IR")).total).toBe(0);
      expect((await catalog.searchProperties({ ...base, minPrice: 4_000_000 }, "fa-IR")).total).toBe(1);
    });

    it("'breakfast included' keeps only stays with a breakfast (or better) rate", async () => {
      const w = await world();
      const roomOnly = await seedStay(sql as never, { providerId: w.provider.id, cityId: w.city.id });
      await sql`update stay.rate_plans set meal_plan = 'room_only' where property_id = ${roomOnly.id}::uuid`;
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: w.city.slug, breakfast: true }, "fa-IR");
      expect(r.items.map((c) => c.slug)).toEqual([w.stay.slug]);
      expect(r.items[0].breakfastIncluded).toBe(true);
    });

    it("an empty search offers the change that finds stays", async () => {
      const w = await cityWithShrine();
      const s = { ...DEFAULT_SEARCH, city: w.city.slug, near: { type: "lm" as const, city: w.city.slug, slug: "haram" }, radius: 500 as const, amenities: ["sauna"] };
      expect((await catalog.searchProperties(s, "fa-IR")).total).toBe(0);
      const sug = await catalog.exploreSuggestions(s, "fa-IR");
      expect(sug.withoutFilters).toBe(1); // only the 300 m stay is within 500 m
      expect(sug.popular.length).toBeGreaterThan(0);
      const tight = { ...s, amenities: [] as string[], radius: 500 as const };
      await placeNorthOf(w.near.id, SHRINE.lat, SHRINE.lng, 800);
      const wider = await catalog.exploreSuggestions(tight, "fa-IR");
      expect(wider.widerRadius).toEqual({ radius: 1000, count: 1 });
    });

    it("a stay's surroundings include the city's landmarks with real distances", async () => {
      const w = await cityWithShrine();
      const d = await catalog.getPropertyDetail({ slug: w.near.slug }, "fa-IR");
      const shrine = d!.nearby.find((n) => n.kind === "shrine");
      expect(shrine?.name).toBe("حرم شاهچراغ");
      expect(shrine!.distanceM).toBeGreaterThan(280);
      expect(shrine!.distanceM).toBeLessThan(320);
      expect(d!.nearby.some((n) => n.kind === "hospital")).toBe(true); // the host's own entry is kept
    });

    it("booking add-ons list hotels nearest to the main booking's provider first, with the distance", async () => {
      const { listProviders } = await import("@/features/booking-pro/server/repository");
      const town = `T${Date.now().toString(36)}`; // service_providers.city is varchar(15)
      const clinic = await seedStayProvider(sql as never, null, { name: "Main clinic" });
      const nearHotel = await seedStayProvider(sql as never, null, { name: "Near hotel" });
      const farHotel = await seedStayProvider(sql as never, null, { name: "Far hotel" });
      const noCoords = await seedStayProvider(sql as never, null, { name: "Hotel without a map pin" });
      await sql`update category.service_providers set city = ${town} where id = any(${[clinic.id, nearHotel.id, farHotel.id, noCoords.id]}::uuid[])`;
      await sql`update category.service_providers set latitude = ${SHRINE.lat}, longitude = ${SHRINE.lng} where id = ${clinic.id}::uuid`;
      await sql`update category.service_providers set latitude = ${SHRINE.lat + 3000 / 111320}, longitude = ${SHRINE.lng}, featured_score = 100 where id = ${farHotel.id}::uuid`;
      await sql`update category.service_providers set latitude = ${SHRINE.lat + 400 / 111320}, longitude = ${SHRINE.lng} where id = ${nearHotel.id}::uuid`;
      const typeId = (await sql<{ t: string }[]>`select provider_type_id::text as t from category.service_providers where id = ${nearHotel.id}::uuid`)[0].t;
      const r = await listProviders({ locale: "en-US", providerTypeId: typeId, city: town, addonContext: true, nearProviderId: clinic.id, take: 10 });
      const ids = r.items.map((i) => i.id);
      // Nearest first even though the far hotel is featured; providers without a pin come last.
      expect(ids.indexOf(nearHotel.id)).toBeLessThan(ids.indexOf(farHotel.id));
      expect(ids.indexOf(farHotel.id)).toBeLessThan(ids.indexOf(noCoords.id));
      const near = r.items.find((i) => i.id === nearHotel.id)!;
      expect(near.distanceM).toBeGreaterThan(380);
      expect(near.distanceM).toBeLessThan(420);
      expect(r.items.find((i) => i.id === noCoords.id)!.distanceM).toBeNull();
      // Without a main provider the order is unchanged (featured first) and no distance is reported.
      const plain = await listProviders({ locale: "en-US", providerTypeId: typeId, city: town, addonContext: true, take: 10 });
      expect(plain.items[0].id).toBe(farHotel.id);
      expect(plain.items.every((i) => i.distanceM == null)).toBe(true);
      // A malformed id is ignored, never sent to SQL.
      await expect(listProviders({ locale: "en-US", providerTypeId: typeId, city: town, addonContext: true, nearProviderId: "x' or 1=1 --" })).resolves.toBeTruthy();
    });

    it("imports a Lsevin hotel provider: kind, stars, amenities, occupancy, photos; skips an implausible price", async () => {
      const owner = await seedUser(sql as never);
      const city = await seedStayCity(sql as never);
      const provider = await seedLegacyHotelProvider(sql as never);
      const id = await admin.importProvider(adminActor(owner.id), provider.id, city.id);
      const [p] = await sql<any[]>`select status, kind, star_rating, amenity_codes, confirmation_mode, contact_phone, provider_service_id, from_price, latitude
                                     from stay.properties where id = ${id}::uuid`;
      expect(p.status).toBe("draft"); // an admin reviews before publishing
      expect(p.kind).toBe("hotel_apartment");
      expect(p.star_rating).toBe(4);
      expect(p.amenity_codes).toEqual(expect.arrayContaining(["parking", "laundry", "breakfast", "currency_exchange", "pool", "sauna", "haram_view"]));
      expect(p.confirmation_mode).toBe("request");
      expect(p.contact_phone).toBeNull(); // the account manager's phone is not published as the front desk's
      expect(p.provider_service_id).not.toBeNull(); // booking anchor created for admin imports
      expect(Number(p.from_price)).toBe(40_000_000); // the 2,000,000 slip is not the "from" price
      const rooms = await sql<any[]>`select name->>'fa-IR' as name, base_occupancy, units, amenity_codes from stay.room_types where property_id = ${id}::uuid order by sort_order`;
      expect(rooms.map((r) => [r.name, r.base_occupancy])).toEqual([
        ["اتاق دو تخته رو به حرم", 2],
        ["اتاق سه تخته", 3],
        ["سوئیت خانواده چهار نفره", 4],
      ]);
      expect(rooms[0].amenity_codes).toEqual(["haram_view"]);
      const media = await sql<any[]>`select url, is_cover from stay.media where property_id = ${id}::uuid and room_type_id is null order by sort_order`;
      expect(media.map((m) => m.url)).toEqual(["Categories/services/legacy-cover.webp", "Categories/services/legacy-0.webp", "Categories/services/legacy-1.webp", "Categories/services/legacy-2.webp"]);
      expect(media[0].is_cover).toBe(true);
      const [audit] = await sql<any[]>`select detail from stay.audit_log where property_id = ${id}::uuid and action = 'imported_from_provider'`;
      expect(audit.detail).toMatchObject({ rooms: 3, roomsSkippedImplausiblePrice: 1, photos: 4 });
      // Room photos (0115): each room shows its own pictures, not the hotel's front door.
      const roomMedia = await sql<any[]>`select rt.name->>'fa-IR' as room, m.url from stay.media m join stay.room_types rt on rt.id = m.room_type_id
                                          where m.property_id = ${id}::uuid order by rt.sort_order, m.sort_order`;
      expect(roomMedia.map((m) => [m.room, m.url])).toEqual([
        ["اتاق دو تخته رو به حرم", "Categories/services/room-haram.webp"],
        ["اتاق دو تخته رو به حرم", "Categories/services/room-haram-2.webp"],
        ["اتاق سه تخته", "Categories/services/room-triple.webp"],
      ]);
      const [{ again }] = await sql<{ again: number }[]>`select stay.import_room_photos(${id}::uuid) as again`;
      expect(again).toBe(0); // re-runnable: nothing is added twice
      const offers = await catalog.getRoomOffers(id, { checkIn: null, checkOut: null, occupancy: { rooms: 1, adults: 2, childAges: [] } }, "fa-IR");
      expect(offers.rooms.find((r) => r.name === "سوئیت خانواده چهار نفره")?.media).toEqual([]); // no photo → no borrowed hotel picture

      // Twice is a conflict, an unknown provider is "not found" — never a generic failure.
      await expect(admin.importProvider(adminActor(owner.id), provider.id, city.id)).rejects.toMatchObject({ kind: "conflict", code: "already_imported" });
      await expect(admin.importProvider(adminActor(owner.id), "00000000-0000-4000-8000-000000000001", city.id)).rejects.toMatchObject({ kind: "not_found" });
    });

    it("publishes an import when asked and it is complete (the catalog migration's path)", async () => {
      const city = await seedStayCity(sql as never);
      const provider = await seedLegacyHotelProvider(sql as never, { category: "مهمان پذیر" });
      const [{ id }] = await sql<{ id: string }[]>`select stay.import_provider(${provider.id}::uuid, ${city.id}::uuid, null, true)::text as id`;
      const [p] = await sql<any[]>`select status, kind, published_at, provider_service_id from stay.properties where id = ${id}::uuid`;
      expect(p).toMatchObject({ status: "published", kind: "guesthouse" });
      expect(p.provider_service_id).toBeNull(); // created lazily at the first booking
      const r = await catalog.searchProperties({ ...DEFAULT_SEARCH, city: city.slug }, "fa-IR");
      expect(r.total).toBe(1);
    });
  });

  describe("hotel page v3: checkout from the account, price calendar, room reviews", () => {
    async function start(stay: SeededStay, userId: string, inDays: number, nights = 1, occ = { rooms: 1, adults: 2, childAges: [] as number[] }) {
      const sel = selection(stay, isoInDays(inDays), isoInDays(inDays + nights), occ);
      const started = await booking.startStayCheckout(userId, { ...sel, idempotencyKey: idemKey() });
      return {
        ...sel,
        holdId: started.holdId,
        idempotencyKey: idemKey(),
        expectedTotal: started.quote.total,
        acceptedPolicyVersion: started.policy.version,
        uiLocale: "fa-IR",
        displayCalendar: "persian" as const,
      };
    }

    it("books in the account holder's name with nothing typed: name, mobile (0-prefixed), email; no companions needed", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never, { firstName: "Maryam", lastName: "Karimi" });
      const r = await booking.confirmStayCheckout(u.id, await start(stay, u.id, 120));
      const [b] = await sql<any[]>`select buyer, guests from stay.bookings where booking_id = ${r.bookingId}::uuid`;
      const [acc] = await sql<any[]>`select phone_number, email from identity.asp_net_users where id = ${u.id}::uuid`;
      expect(b.buyer).toEqual({ firstName: "Maryam", lastName: "Karimi", phone: `0${acc.phone_number}`, email: acc.email });
      expect(b.guests).toEqual([]);
      const profile = await booking.getCheckoutProfile(u.id);
      expect(profile).toMatchObject({ firstName: "Maryam", lastName: "Karimi", phone: `0${acc.phone_number}` });
    });

    it("typed details override the account; blank companions are dropped, half-filled ones are field errors", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      const input = await start(stay, u.id, 125);
      await expect(
        booking.confirmStayCheckout(u.id, { ...input, guests: [{ firstName: "Reza", lastName: "" }] }),
      ).rejects.toMatchObject({ kind: "validation", code: "invalid_guest_details", details: { fields: { "guests.0.lastName": "required" } } });
      const r = await booking.confirmStayCheckout(u.id, {
        ...input,
        buyer: { firstName: "Ali", lastName: "Rezaei", phone: "09121234567", email: null },
        guests: [{ firstName: "  ", lastName: "" }, { firstName: "Sara", lastName: "Rezaei" }],
      });
      const [b] = await sql<any[]>`select buyer, guests from stay.bookings where booking_id = ${r.bookingId}::uuid`;
      expect(b.buyer).toMatchObject({ firstName: "Ali", lastName: "Rezaei", phone: "09121234567" });
      expect(b.guests).toEqual([{ firstName: "Sara", lastName: "Rezaei" }]);
    });

    it("the account's own name is accepted as it is, even with a digit; a typed one follows the name rules (regression)", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never, { firstName: "Sara", lastName: "Tester42" });
      const r = await booking.confirmStayCheckout(u.id, await start(stay, u.id, 128));
      const [b] = await sql<any[]>`select buyer from stay.bookings where booking_id = ${r.bookingId}::uuid`;
      expect(b.buyer).toMatchObject({ firstName: "Sara", lastName: "Tester42" });
      const v = await seedUser(sql as never);
      await expect(booking.confirmStayCheckout(v.id, { ...(await start(stay, v.id, 129)), buyer: { lastName: "R2D2" } })).rejects.toMatchObject({
        kind: "validation",
        details: { fields: { "buyer.lastName": "invalid" } },
      });
    });

    it("an account without a name must type one (validation 'required', never a server error)", async () => {
      const { stay } = await world();
      const u = await seedUser(sql as never);
      await sql`update identity.asp_net_users set first_name = '', last_name = '' where id = ${u.id}::uuid`;
      const input = await start(stay, u.id, 130);
      await expect(booking.confirmStayCheckout(u.id, input)).rejects.toMatchObject({
        kind: "validation",
        details: { fields: { "buyer.firstName": "required", "buyer.lastName": "required" } },
      });
      const r = await booking.confirmStayCheckout(u.id, { ...input, buyer: { firstName: "Hamid", lastName: "Naderi" } });
      expect(r.status).toBe("pending_payment");
    });

    it("price calendar: cheapest nightly price per day; overrides apply; stop-sell and full nights are null; too large a party has no price", async () => {
      const { stay, owner } = await world({ units: 2, basePrice: 5_000_000 });
      const from = isoInDays(60);
      await admin.setPriceRange(adminActor(owner.id), stay.id, { ratePlanId: stay.ratePlanId, from: isoInDays(61), to: isoInDays(62), price: 7_500_000, weekdays: null });
      await sql`insert into stay.inventory (room_type_id, stay_date, stop_sell) values (${stay.roomTypeId}::uuid, ${isoInDays(62)}::date, true)`;
      await sql`insert into stay.inventory (room_type_id, stay_date, sold) values (${stay.roomTypeId}::uuid, ${isoInDays(63)}::date, 2)`;
      const cal = await catalog.getPriceCalendar(stay.id, from, 5, { rooms: 1, adults: 2, childAges: [] });
      expect(cal.currency).toBe("IRR");
      expect(cal.days.map((d) => d.price)).toEqual([5_000_000, 7_500_000, null, null, 5_000_000]);
      expect(cal.days[0].date).toBe(from);
      // Two rooms for one night: a day with only one unit left has no price.
      await sql`insert into stay.inventory (room_type_id, stay_date, sold) values (${stay.roomTypeId}::uuid, ${isoInDays(64)}::date, 1)`;
      const two = await catalog.getPriceCalendar(stay.id, isoInDays(64), 1, { rooms: 2, adults: 2, childAges: [] });
      expect(two.days).toEqual([{ date: isoInDays(64), price: null }]);
      const huge = await catalog.getPriceCalendar(stay.id, from, 3, { rooms: 1, adults: 30, childAges: [] });
      expect(huge.days).toEqual([]);
    });

    it("reviews know the room the guest stayed in; stats count stars and recommendations", async () => {
      const { stay, owner } = await world();
      const ids: string[] = [];
      for (const [i, rating] of [5, 4, 2].entries()) {
        const u = await seedUser(sql as never);
        const r = await book(stay, u.id, isoInDays(170 + i * 2), isoInDays(171 + i * 2));
        await sql`update stay.bookings set status = 'completed' where booking_id = ${r.bookingId}::uuid`;
        const id = await booking.submitStayReview(u.id, { bookingId: r.bookingId, rating, body: `review ${rating}`, locale: "fa-IR" });
        await ops.moderateReview(adminActor(owner.id), id, "published", null);
        ids.push(id);
      }
      const all = await catalog.listReviews(stay.id, { limit: 10 });
      expect(all).toHaveLength(3);
      expect(all.every((r) => r.roomTypeId === stay.roomTypeId && r.roomName && r.nights === 1)).toBe(true);
      expect(await catalog.listReviews(stay.id, { roomTypeId: stay.roomTypeId })).toHaveLength(3);
      expect(await catalog.listReviews(stay.id, { roomTypeId: "00000000-0000-4000-8000-000000000009" })).toHaveLength(0);
      expect(await catalog.reviewStats(stay.id)).toEqual({ histogram: [0, 1, 0, 1, 1], recommendPercent: 67 });
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
      ).rejects.toMatchObject({ kind: "validation", code: "invalid_guest_details", details: { fields: { "buyer.phone": "invalid", "guests.0.firstName": "required" } } });
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
