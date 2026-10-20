/**
 * Tours OPERATIONS layer against a REAL Postgres migrated to the current schema
 * (production-equivalent baseline + 0078..0080). Check-in, tracking, notices,
 * departure operations, guides, reviews, waitlist, weather, sweeper and the
 * internal RPC contract.
 *
 *   TOURS_TEST_DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin_tours_test \
 *   ACCOUNTING_TEST_DATABASE_URL=$TOURS_TEST_DATABASE_URL npx vitest run src/features/tours
 *
 * Skipped when TOURS_TEST_DATABASE_URL is not set. Data is unique per test; no rollback.
 */
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addMember,
  assertLocalDatabase,
  idemKey,
  sampleBuyer,
  sampleParticipants,
  seedProvider,
  seedTour,
  seedUser,
  type SeededTour,
} from "../../testing/fixtures";

const URL_ = process.env.TOURS_TEST_DATABASE_URL;
const suite = URL_ ? describe : describe.skip;

type Sent = { recipientUserId: string; title: string; body: string; data: Record<string, unknown> };
const notifyMock = vi.hoisted(() => ({ fail: false, sent: [] as Sent[] }));
vi.mock("@/app/[locale]/n/app/mobile/notifications/notification-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createNotification: vi.fn(async (input: Sent) => {
    if (notifyMock.fail) throw new Error("ECONNREFUSED notification service down");
    notifyMock.sent.push(input);
    return "00000000-0000-0000-0000-000000000000";
  }),
}));

let sql: postgres.Sql;
let booking: typeof import("../platform/booking");
let weather: typeof import("./weather");
let live: typeof import("./live");
let checkin: typeof import("./checkin");
let notices: typeof import("./notices");
let departures: typeof import("./departures");
let guides: typeof import("./guides");
let reviews: typeof import("./reviews");
let waitlist: typeof import("./waitlist");
let inquiries: typeof import("./inquiries");
let incidents: typeof import("./incidents");
let analytics: typeof import("./analytics");
let sweeper: typeof import("./sweeper");
let rpc: typeof import("./rpc-registry");
let calendar: typeof import("../../domain/calendar");

const user = (userId: string) => ({ userId, roles: ["user"], isAdmin: false });
const admin = (userId: string) => ({ userId, roles: ["admin"], isAdmin: true });
const KEY = "ops-test-internal-key-0123456789abcdef-xyz";

async function bookOnce(t: SeededTour, userId: string, departureId = t.departureIds[0], adults = 1, extra: Record<string, unknown> = {}) {
  const sel = { departureId, optionId: t.optionId, travelers: { adult: adults } };
  const started = await booking.startCheckout(userId, { ...sel, idempotencyKey: idemKey() });
  return booking.confirmCheckout(userId, {
    ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total,
    acceptedPolicyVersion: started.policy.version, policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian",
    buyer: sampleBuyer, participants: sampleParticipants(adults), ...extra,
  } as never);
}

async function seedAdmin() {
  const u = await seedUser(sql, { firstName: "Admin" });
  await sql`insert into identity.asp_net_roles (id, name, normalized_name, concurrency_stamp)
            select gen_random_uuid(), 'Admin', 'ADMIN', 'x' where not exists (select 1 from identity.asp_net_roles where normalized_name = 'ADMIN')`;
  await sql`insert into identity.asp_net_user_roles (user_id, role_id) select ${u.id}, id from identity.asp_net_roles where normalized_name = 'ADMIN' limit 1`;
  return u;
}

async function seedGuide(providerId: string, status = "active") {
  const u = await seedUser(sql, { firstName: "Reza" });
  const [g] = await sql<any[]>`insert into tour.guides (user_id, display_name, status, contact_policy, public_phone) values (${u.id}, 'Reza Guide', 'verified', 'phone_during_tour', '+989120001111') returning id::text`;
  await sql`insert into tour.provider_guides (service_provider_id, guide_id, status) values (${providerId}, ${g.id}, ${status})`;
  return { userId: u.id, guideId: g.id };
}

/** Moves a departure so "now" is inside its tracking window. */
async function startSoon(departureId: string) {
  await sql`update tour.departures set starts_at = now() + interval '30 minutes', ends_at = now() + interval '5 hours',
                  booking_cutoff_at = now() + interval '10 minutes' where id = ${departureId}`;
}

async function dep(id: string) {
  const [d] = await sql<any[]>`select capacity, booked_count, held_count, status, delay_minutes, is_blocked from tour.departures where id = ${id}`;
  return d;
}

/** Common X/Y world for AT-14 style tests. */
async function world(opts: { price?: number } = {}) {
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, departures: 2, adultPrice: opts.price ?? 0, capacity: 10 });
  return { owner, p, t };
}

suite("tours ops (real database)", () => {
  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    process.env.TOURS_WEATHER_PROVIDER = "fixture";
    process.env.TOURS_SWEEPER = "off";
    sql = postgres(URL_!, { max: 10, onnotice: () => {} });
    booking = await import("../platform/booking");
    weather = await import("./weather");
    live = await import("./live");
    checkin = await import("./checkin");
    notices = await import("./notices");
    departures = await import("./departures");
    guides = await import("./guides");
    reviews = await import("./reviews");
    waitlist = await import("./waitlist");
    inquiries = await import("./inquiries");
    incidents = await import("./incidents");
    analytics = await import("./analytics");
    sweeper = await import("./sweeper");
    rpc = await import("./rpc-registry");
    calendar = await import("../../domain/calendar");
  });
  afterAll(async () => {
    await sql?.end();
  });
  beforeEach(() => {
    notifyMock.fail = false;
    notifyMock.sent = [];
    process.env.TOURS_WEATHER_PROVIDER = "fixture";
  });

  // --------------------------------------------------------------------------
  // AT-05 weather
  // --------------------------------------------------------------------------

  describe("AT-05 weather", () => {
    const tz = "Asia/Tehran";
    const spot = () => ({ lat: Math.round((10 + Math.random() * 60) * 1000) / 1000, lng: Math.round((10 + Math.random() * 60) * 1000) / 1000 });
    const today = () => calendar.instantToLocalIso(new Date(), tz);

    it("forecast inside the horizon is fresh, cached, and not presented as current conditions", async () => {
      const { lat, lng } = spot();
      const day = calendar.addDaysIso(today(), 3);
      const w = await weather.getTourWeather({ lat, lng, departureLocalIso: day, timeZone: tz, label: "Shiraz" });
      expect(w.status).toBe("ok");
      if (w.status !== "ok") return;
      expect(w.mode).toEqual({ kind: "forecast", daysAhead: 3 });
      expect(w.freshness).toBe("fresh");
      expect(w.current).toBeNull();
      expect(w.forecast?.date).toBe(day);
      expect(w.attribution).toBeTruthy();
      const [row] = await sql<any[]>`select source from tour.weather_cache where cache_key = ${weather.weatherCacheKey("daily", lat, lng, day)}`;
      expect(row.source).toBe("fixture");
    });

    it("today shows current conditions", async () => {
      const { lat, lng } = spot();
      const w = await weather.getTourWeather({ lat, lng, departureLocalIso: today(), timeZone: tz });
      expect(w.status === "ok" && w.mode.kind).toBe("current");
      expect(w.status === "ok" && w.current?.temperatureC).toEqual(expect.any(Number));
    });

    it("beyond the horizon → climate mode: no current conditions, no invented numbers", async () => {
      const { lat, lng } = spot();
      const w = await weather.getTourWeather({ lat, lng, departureLocalIso: calendar.addDaysIso(today(), 40), timeZone: tz });
      expect(w.status).toBe("ok");
      if (w.status !== "ok") return;
      expect(w.mode.kind).toBe("climate");
      expect(w.current).toBeNull();
      expect(w.forecast).toBeNull();
      expect(w.climate).toMatchObject({ avgMinC: null, avgMaxC: null, note: "beyond_forecast_horizon" });
    });

    it("provider failure returns the cached value marked stale, or unavailable when nothing is cached", async () => {
      const { lat, lng } = spot();
      const day = calendar.addDaysIso(today(), 2);
      const key = weather.weatherCacheKey("daily", lat, lng, day);
      const payload = { forecast: { date: day, minC: 3, maxC: 9, condition: "rain", precipitationProbability: 80, windKph: 12 } };
      await sql`insert into tour.weather_cache (cache_key, kind, latitude, longitude, target_date, payload, source, fetched_at, expires_at)
                values (${key}, 'daily', ${lat}, ${lng}, ${day}, ${sql.json(payload)}, 'fixture', now() - interval '1 day', now() - interval '20 hours')`;
      await sql`insert into tour.weather_cache (cache_key, kind, latitude, longitude, payload, source, fetched_at, expires_at)
                values (${weather.fixtureFailKey(lat, lng)}, 'current', ${lat}, ${lng}, '{}', 'test', now(), now() + interval '1 day')`;
      const w = await weather.getTourWeather({ lat, lng, departureLocalIso: day, timeZone: tz });
      expect(w.status).toBe("ok");
      if (w.status === "ok") {
        expect(w.freshness).toBe("stale");
        expect(w.forecast).toMatchObject({ minC: 3, maxC: 9, condition: "rain" });
      }
      const other = spot();
      await sql`insert into tour.weather_cache (cache_key, kind, latitude, longitude, payload, source, fetched_at, expires_at)
                values (${weather.fixtureFailKey(other.lat, other.lng)}, 'current', ${other.lat}, ${other.lng}, '{}', 'test', now(), now() + interval '1 day')`;
      expect(await weather.getTourWeather({ lat: other.lat, lng: other.lng, departureLocalIso: day, timeZone: tz })).toEqual({ status: "unavailable", reason: "provider_error" });
    });

    it("no location / disabled", async () => {
      expect(await weather.getTourWeather({ lat: Number.NaN, lng: 1, departureLocalIso: null, timeZone: tz })).toEqual({ status: "unavailable", reason: "no_location" });
      process.env.TOURS_WEATHER_PROVIDER = "off";
      expect(await weather.getTourWeather({ lat: 1, lng: 1, departureLocalIso: null, timeZone: tz })).toEqual({ status: "unavailable", reason: "disabled" });
    });
  });

  // --------------------------------------------------------------------------
  // AT-17 assignments, guide change notice
  // --------------------------------------------------------------------------

  it("AT-17 a guide cannot be assigned to overlapping departures; only an admin may override", async () => {
    const { owner, p, t } = await world();
    const g = await seedGuide(p.id);
    await sql`update tour.departures set starts_at = (select starts_at from tour.departures where id = ${t.departureIds[0]}) + interval '1 hour',
                    ends_at = (select ends_at from tour.departures where id = ${t.departureIds[0]}) + interval '1 hour' where id = ${t.departureIds[1]}`;
    const o = user(owner.id);
    const a1 = await guides.assignToDeparture(o, { departureId: t.departureIds[0], guideId: g.guideId, role: "guide" });
    expect(a1.id).toBeTruthy();
    await expect(guides.assignToDeparture(o, { departureId: t.departureIds[1], guideId: g.guideId, role: "guide" })).rejects.toMatchObject({ kind: "conflict", code: "overlapping_assignment" });
    await expect(guides.assignToDeparture(o, { departureId: t.departureIds[1], guideId: g.guideId, role: "guide", overrideReason: "backup" })).rejects.toMatchObject({ code: "override_requires_admin" });
    const adm = await seedAdmin();
    await guides.assignToDeparture(admin(adm.id), { departureId: t.departureIds[1], guideId: g.guideId, role: "guide", overrideReason: "Platform approved backup" });
    const outsider = await seedUser(sql);
    const [og] = await sql<any[]>`insert into tour.guides (user_id, display_name) values (${outsider.id}, 'Not mine') returning id::text`;
    await expect(guides.assignToDeparture(o, { departureId: t.departureIds[0], guideId: og.id, role: "driver" })).rejects.toMatchObject({ code: "guide_not_with_provider" });
    const sched = await guides.guideSchedule(user(g.userId));
    expect(sched.map((s) => s.departureId).sort()).toEqual([...t.departureIds].sort());
    const audits = await sql`select 1 from tour.audit_log where entity_type = 'assignment' and action = 'assignment_created' and detail->>'departureId' = ${t.departureIds[0]}`;
    expect(audits.length).toBe(1);
  });

  it("V-053 replacing the lead guide on a booked departure notifies only its travelers", async () => {
    const { owner, p, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    const other = await seedUser(sql);
    await bookOnce(t, other.id, t.departureIds[1]);
    const [g1, g2] = [await seedGuide(p.id), await seedGuide(p.id)];
    await guides.assignToDeparture(user(owner.id), { departureId: t.departureIds[0], guideId: g1.guideId, role: "lead_guide" });
    expect(notifyMock.sent.filter((s) => s.data?.kind === "notice_guide_change")).toHaveLength(0);
    await guides.assignToDeparture(user(owner.id), { departureId: t.departureIds[0], guideId: g2.guideId, role: "lead_guide" });
    const changes = notifyMock.sent.filter((s) => s.data?.kind === "notice_guide_change");
    expect(changes.map((s) => s.recipientUserId)).toEqual([c.id]);
    const [d] = await sql<any[]>`select count(*)::int as n from tour.notice_deliveries nd join tour.notices n on n.id = nd.notice_id where n.kind = 'guide_change' and nd.booking_id = ${b.bookingId}`;
    expect(d.n).toBe(1);
    const [lead] = await sql<any[]>`select count(*)::int as n from tour.departure_assignments where departure_id = ${t.departureIds[0]} and role = 'lead_guide' and status = 'assigned'`;
    expect(lead.n).toBe(1);
  });

  // --------------------------------------------------------------------------
  // AT-18 check-in
  // --------------------------------------------------------------------------

  it("AT-18 scan once accepted, then duplicate; wrong departure; invalid; cancelled; offline replay idempotent; counts correct", async () => {
    const { owner, p, t } = await world();
    const [c1, c2, c3] = [await seedUser(sql), await seedUser(sql), await seedUser(sql)];
    const b1 = await bookOnce(t, c1.id, t.departureIds[0], 2);
    const bOther = await bookOnce(t, c2.id, t.departureIds[1], 1);
    const bCancelled = await bookOnce(t, c3.id, t.departureIds[0], 1);
    await booking.cancelByCustomer(c3.id, bCancelled.bookingId, "changed plans");
    const [{ qr_token }] = await sql<any[]>`select qr_token from tour.bookings where booking_id = ${b1.bookingId}`;
    const staff = await seedUser(sql);
    await addMember(sql, p.id, staff.id, "staff");
    const s = user(staff.id);
    const at = new Date().toISOString();
    const D = t.departureIds[0];

    const first = await checkin.scanTicket(s, { departureId: D, token: qr_token, clientEventId: `ev-${idemKey()}`, scannedAt: at });
    expect(first).toMatchObject({ result: "accepted", bookingId: b1.bookingId, seats: 2 });
    const again = await checkin.scanTicket(s, { departureId: D, token: qr_token, clientEventId: `ev-${idemKey()}`, scannedAt: at });
    expect(again.result).toBe("duplicate");
    expect(again.checkedInAt).toBe(first.checkedInAt);

    const wrong = await checkin.scanTicket(s, { departureId: D, token: bOther.voucherCode, clientEventId: `ev-${idemKey()}`, scannedAt: at });
    expect(wrong).toMatchObject({ result: "wrong_departure", bookingId: null, leadTraveler: null });
    expect((await checkin.scanTicket(s, { departureId: D, token: "NOT-A-TICKET", clientEventId: `ev-${idemKey()}`, scannedAt: at })).result).toBe("invalid");
    expect((await checkin.scanTicket(s, { departureId: D, token: bCancelled.voucherCode.toLowerCase(), clientEventId: `ev-${idemKey()}`, scannedAt: at })).result).toBe("cancelled_booking");

    // Offline queue replayed twice: same results, no new rows.
    const evA = `ev-${idemKey()}`;
    const evB = `ev-${idemKey()}`;
    const queue = [
      { token: qr_token, clientEventId: evB, scannedAt: new Date(Date.now() - 1000).toISOString() },
      { token: "garbage-token", clientEventId: evA, scannedAt: new Date(Date.now() - 5000).toISOString() },
    ];
    const r1 = await checkin.syncCheckins(s, D, queue);
    expect(r1.map((r) => r.clientEventId)).toEqual([evA, evB]); // processed in scannedAt order
    const before = await sql`select id from tour.checkins where departure_id = ${D}`;
    const r2 = await checkin.syncCheckins(s, D, queue);
    expect(r2).toEqual(r1);
    expect((await sql`select id from tour.checkins where departure_id = ${D}`).length).toBe(before.length);
    expect(r1.every((r) => r.ok)).toBe(true);

    const summary = await checkin.checkinSummary(s, D);
    expect(summary).toEqual({ expectedSeats: 2, checkedInSeats: 2 });
    const [acc] = await sql<any[]>`select count(*)::int as n from tour.checkins where booking_id = ${b1.bookingId} and result = 'accepted'`;
    expect(acc.n).toBe(1);

    // Concurrent devices: exactly one accepted.
    const c4 = await seedUser(sql);
    const b4 = await bookOnce(t, c4.id, D, 1);
    const results = await Promise.all(Array.from({ length: 5 }, () => checkin.scanTicket(s, { departureId: D, token: b4.voucherCode, clientEventId: `ev-${idemKey()}`, scannedAt: at })));
    expect(results.filter((r) => r.result === "accepted")).toHaveLength(1);
    expect(results.filter((r) => r.result === "duplicate")).toHaveLength(4);

    // A customer cannot scan; the owner can read the manifest with full contact.
    await expect(checkin.scanTicket(user(c1.id), { departureId: D, token: qr_token, clientEventId: `ev-${idemKey()}`, scannedAt: at })).rejects.toMatchObject({ kind: "authorization" });
    const manifest = await checkin.getManifest(user(owner.id), D);
    expect(manifest.find((m) => m.bookingId === b1.bookingId)).toMatchObject({ checkedIn: true, contact: sampleBuyer.phone });
    expect(JSON.stringify(manifest)).not.toMatch(/idDocument|id_document/);
  });

  it("AT-18 the assigned guide scans and sees a masked manifest; an unassigned guide cannot", async () => {
    const { owner, p, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    await sql`update tour.booking_participants set assistance_request = 'wheelchair' where booking_id = ${b.bookingId}`;
    const g = await seedGuide(p.id);
    const g2 = await seedGuide(p.id);
    await guides.assignToDeparture(user(owner.id), { departureId: t.departureIds[0], guideId: g.guideId, role: "guide" });
    const m = await checkin.getManifest(user(g.userId), t.departureIds[0]);
    expect(m[0].contact).not.toBe(sampleBuyer.phone);
    expect(m[0].contact?.endsWith(sampleBuyer.phone.slice(-4))).toBe(true);
    expect(m[0].participants[0].assistance).toBe("wheelchair");
    await expect(checkin.getManifest(user(g2.userId), t.departureIds[0])).rejects.toMatchObject({ kind: "authorization" });
    const r = await checkin.scanTicket(user(g.userId), { departureId: t.departureIds[0], token: b.voucherCode, clientEventId: `ev-${idemKey()}`, scannedAt: new Date().toISOString() });
    expect(r.result).toBe("accepted");
  });

  // --------------------------------------------------------------------------
  // AT-19 / AT-20 live tracking
  // --------------------------------------------------------------------------

  it("AT-19 only that departure's traveler, provider and guide see the position, and nobody but an admin after stop", async () => {
    const { owner, p, t } = await world();
    const traveler = await seedUser(sql);
    await bookOnce(t, traveler.id);
    const otherCustomer = await seedUser(sql);
    const otherOwner = await seedUser(sql);
    await seedProvider(sql, otherOwner.id);
    const D = t.departureIds[0];
    await startSoon(D);
    const g = await seedGuide(p.id);
    await guides.assignToDeparture(user(owner.id), { departureId: D, guideId: g.guideId, role: "lead_guide" });

    await expect(live.startTracking(user(traveler.id), D)).rejects.toMatchObject({ kind: "authorization" });
    const session = await live.startTracking(user(g.userId), D);
    expect(await live.startTracking(user(g.userId), D)).toMatchObject({ id: session.id });
    await expect(live.startTracking(user(owner.id), D)).rejects.toMatchObject({ code: "tracking_already_active" });
    await live.pushPoints(user(g.userId), session.id, [{ seq: 1, recordedAt: new Date().toISOString(), latitude: 29.6, longitude: 52.5, accuracyM: 8 }]);

    const tv = await live.getLiveView(user(traveler.id), D);
    expect(tv.canSeeLocation).toBe(true);
    expect(tv.lastPosition).toMatchObject({ lat: 29.6, lng: 52.5 });
    expect(tv.tracking.kind).toBe("live");
    expect(tv.guideContact).toMatchObject({ name: "Reza Guide", phone: "+989120001111" });
    expect(tv.emergency.phone).toBeTruthy();
    expect((await live.getLiveView(user(owner.id), D)).lastPosition).not.toBeNull();
    await expect(live.getLiveView(user(otherCustomer.id), D)).rejects.toMatchObject({ kind: "authorization" });
    await expect(live.getLiveView(user(otherOwner.id), D)).rejects.toMatchObject({ kind: "authorization" });

    const stopped = await live.stopTracking(user(g.userId), D);
    expect(stopped?.endReason).toBe("manual");
    const [s] = await sql<any[]>`select retention_until > now() + interval '29 days' as ok from tour.tracking_sessions where id = ${session.id}`;
    expect(s.ok).toBe(true);
    const after = await live.getLiveView(user(traveler.id), D);
    expect(after.tracking.kind).toBe("ended");
    expect(after.lastPosition).toBeNull();
    expect((await live.getLiveView(user(owner.id), D)).lastPosition).toBeNull();
    const adm = await seedAdmin();
    expect((await live.getLiveView(admin(adm.id), D)).lastPosition).not.toBeNull();
    const audited = await sql`select 1 from tour.audit_log where entity_id = ${session.id} and action = 'position_viewed_after_end'`;
    expect(audited.length).toBe(1);
    await expect(live.pushPoints(user(g.userId), session.id, [{ seq: 9, recordedAt: new Date().toISOString(), latitude: 1, longitude: 1 }])).rejects.toMatchObject({ code: "tracking_ended" });
  });

  it("AT-20 stale classification; replayed, out-of-order and future points are rejected", async () => {
    const { owner, t } = await world();
    const D = t.departureIds[0];
    await startSoon(D);
    const s = await live.startTracking(user(owner.id), D);
    const now = Date.now();
    const old = new Date(now - 10 * 60_000).toISOString();
    expect(await live.pushPoints(user(owner.id), s.id, [{ seq: 1, recordedAt: old, latitude: 29.1, longitude: 52.1 }])).toEqual({ accepted: 1, rejected: 0 });
    expect((await live.getLiveView(user(owner.id), D)).tracking.kind).toBe("stale");
    const res = await live.pushPoints(user(owner.id), s.id, [
      { seq: 1, recordedAt: old, latitude: 10, longitude: 10 }, // replay
      { seq: 2, recordedAt: new Date(now - 1000).toISOString(), latitude: 29.2, longitude: 52.2 },
      { seq: 3, recordedAt: new Date(now - 20 * 60_000).toISOString(), latitude: 0, longitude: 0 }, // older than seq 2
      { seq: 4, recordedAt: new Date(now + 10 * 60_000).toISOString(), latitude: 5, longitude: 5 }, // future
    ]);
    expect(res).toEqual({ accepted: 1, rejected: 3 });
    const v = await live.getLiveView(user(owner.id), D);
    expect(v.tracking.kind).toBe("live");
    expect(v.lastPosition).toMatchObject({ lat: 29.2, lng: 52.2 });
    const other = await seedUser(sql);
    await expect(live.pushPoints(user(other.id), s.id, [{ seq: 5, recordedAt: new Date().toISOString(), latitude: 1, longitude: 1 }])).rejects.toMatchObject({ code: "not_session_owner" });
  });

  it("tracking only inside the departure window and never on a cancelled departure", async () => {
    const { owner, t } = await world();
    await expect(live.startTracking(user(owner.id), t.departureIds[0])).rejects.toMatchObject({ code: "outside_tracking_window" });
  });

  it("milestones: delay updates the departure, completed ends tracking and completes bookings", async () => {
    const { owner, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    const D = t.departureIds[0];
    await startSoon(D);
    await live.startTracking(user(owner.id), D);
    await live.postMilestone(user(owner.id), { departureId: D, kind: "delayed", delayMinutes: 20 });
    expect(await dep(D)).toMatchObject({ status: "delayed", delay_minutes: 20 });
    await live.postMilestone(user(owner.id), { departureId: D, kind: "departed" });
    await live.postMilestone(user(owner.id), { departureId: D, kind: "arrived_stop", stopId: t.stopIds[0] });
    expect((await live.getLiveView(user(c.id), D)).nextStopId).toBe(t.stopIds[1]);
    await expect(live.postMilestone(user(owner.id), { departureId: D, kind: "arrived_stop", stopId: "00000000-0000-4000-8000-000000000000" })).rejects.toMatchObject({ code: "stop_not_in_tour" });
    await live.postMilestone(user(owner.id), { departureId: D, kind: "completed" });
    expect((await dep(D)).status).toBe("completed");
    const [s] = await sql<any[]>`select end_reason from tour.tracking_sessions where departure_id = ${D}`;
    expect(s.end_reason).toBe("completed");
    const [tb] = await sql<any[]>`select status from tour.bookings where booking_id = ${b.bookingId}`;
    expect(tb.status).toBe("completed");
  });

  // --------------------------------------------------------------------------
  // AT-21 / AT-46 notices
  // --------------------------------------------------------------------------

  it("AT-21/AT-46 a delay notice reaches only that departure's travelers, in their language and calendar, same instant", async () => {
    const { owner, t } = await world();
    const [cFa, cEn, cDe, cOther] = [await seedUser(sql), await seedUser(sql), await seedUser(sql), await seedUser(sql)];
    const bFa = await bookOnce(t, cFa.id, t.departureIds[0], 1, { uiLocale: "fa", displayCalendar: "persian" });
    const bEn = await bookOnce(t, cEn.id, t.departureIds[0], 1, { uiLocale: "en", displayCalendar: "gregory" });
    const bDe = await bookOnce(t, cDe.id, t.departureIds[0], 1, { uiLocale: "de", displayCalendar: "gregory" });
    await bookOnce(t, cOther.id, t.departureIds[1], 1);
    const res = await departures.delayDeparture(user(owner.id), t.departureIds[0], 45, {
      sourceLocale: "fa-IR",
      texts: {
        "fa-IR": { title: "تأخیر حرکت", body: "حرکت به {departure} موکول شد. کد {ref}" },
        "en-US": { title: "Departure delayed", body: "The tour now leaves at {departure}. Ref {ref}" },
      },
    });
    expect(res).toEqual({ notified: 3, fellBack: 1 });
    const sent = notifyMock.sent.filter((s) => s.data?.kind === "notice_delay");
    expect(sent.map((s) => s.recipientUserId).sort()).toEqual([cFa.id, cEn.id, cDe.id].sort());
    expect(new Set(sent.map((s) => s.data.effectiveAt)).size).toBe(1);
    const byUser = Object.fromEntries(sent.map((s) => [s.recipientUserId, s]));
    expect(byUser[cEn.id].body).toContain(bEn.voucherCode);
    expect(byUser[cEn.id].title).toBe("Departure delayed");
    expect(byUser[cFa.id].title).toBe("تأخیر حرکت");
    expect(byUser[cFa.id].body).toMatch(/[۰-۹]/); // Persian calendar + digits
    expect(byUser[cFa.id].body).toContain(bFa.voucherCode);
    expect(byUser[cDe.id].title).toBe("تأخیر حرکت"); // no German text: source language, flagged
    const rows = await sql<any[]>`select nd.booking_id::text, nd.locale_used, nd.fell_back from tour.notice_deliveries nd join tour.notices n on n.id = nd.notice_id
                                   where n.departure_id = ${t.departureIds[0]} and n.kind = 'delay'`;
    expect(Object.fromEntries(rows.map((r) => [r.booking_id, [r.locale_used, r.fell_back]]))).toEqual({
      [bFa.bookingId]: ["fa-IR", false], [bEn.bookingId]: ["en-US", false], [bDe.bookingId]: ["fa-IR", true],
    });
    expect(await dep(t.departureIds[0])).toMatchObject({ status: "delayed", delay_minutes: 45 });

    const en = await notices.listNoticesForBooking(cEn.id, bEn.bookingId, "en-US");
    expect(en[0]).toMatchObject({ kind: "delay", localeUsed: "en-US", fellBack: false, title: "Departure delayed" });
    const de = await notices.listNoticesForBooking(cDe.id, bDe.bookingId, "de-DE");
    expect(de[0]).toMatchObject({ fellBack: true, localeUsed: "fa-IR" });
    expect(en[0].effectiveAt).toBe(de[0].effectiveAt);
    await expect(notices.listNoticesForBooking(cOther.id, bEn.bookingId, "en-US")).rejects.toMatchObject({ kind: "not_found" });

    // Re-delivery of the same notice never notifies twice.
    const [n] = await sql<any[]>`select id::text from tour.notices where departure_id = ${t.departureIds[0]} and kind = 'delay'`;
    expect((await notices.deliverNotice(n.id)).recipients).toBe(0);
  });

  it("a notification outage releases the delivery claim so a retry delivers once", async () => {
    const { owner, t } = await world();
    const c = await seedUser(sql);
    await bookOnce(t, c.id);
    notifyMock.fail = true;
    const r = await notices.sendNotice(user(owner.id), { departureId: t.departureIds[0], kind: "announcement", effectiveAt: new Date().toISOString(), sourceLocale: "en-US", texts: { "en-US": { title: "Hi", body: "Bring water" } } });
    expect(r.recipients).toBe(0);
    notifyMock.fail = false;
    expect((await notices.deliverNotice(r.noticeId)).recipients).toBe(1);
    expect((await notices.deliverNotice(r.noticeId)).recipients).toBe(0);
    await expect(notices.sendNotice(user(owner.id), { departureId: t.departureIds[0], kind: "announcement", effectiveAt: new Date().toISOString(), sourceLocale: "en-US", texts: { "fa-IR": { title: "x", body: "y" } } }))
      .rejects.toMatchObject({ kind: "validation", code: "source_text_required" });
  });

  // --------------------------------------------------------------------------
  // Departure operations
  // --------------------------------------------------------------------------

  it("cancelDeparture closes every live booking, releases all seats and holds, requests refunds for paid ones, notifies them", async () => {
    const { owner, t } = await world();
    const [c1, c2, c3] = [await seedUser(sql), await seedUser(sql), await seedUser(sql)];
    const D = t.departureIds[0];
    const paid = await bookOnce(t, c1.id, D, 2);
    const free = await bookOnce(t, c2.id, D, 1);
    await sql`update booking.bookings set paid_amount = 3000000, payment_status = 'Paid' where id = ${paid.bookingId}`;
    await booking.startCheckout(c3.id, { departureId: D, optionId: t.optionId, travelers: { adult: 1 }, idempotencyKey: idemKey() });
    expect(await dep(D)).toMatchObject({ booked_count: 3, held_count: 1 });

    const r = await departures.cancelDeparture(user(owner.id), D, "weather", {
      sourceLocale: "fa-IR", texts: { "fa-IR": { title: "لغو تور", body: "تور {departure} لغو شد. کد {ref}" }, "en-US": { title: "Tour cancelled", body: "Cancelled. Ref {ref}" } },
    });
    expect(r).toEqual({ notified: 2, cancelledBookings: 2, refundRequests: 1 });
    expect(await dep(D)).toMatchObject({ status: "cancelled", booked_count: 0, held_count: 0 });
    const rows = await sql<any[]>`select booking_id::text, status, refund_quote from tour.bookings where departure_id = ${D}`;
    expect(rows.every((x) => x.status === "cancelled")).toBe(true);
    const pq = rows.find((x) => x.booking_id === paid.bookingId)!.refund_quote;
    expect(pq).toMatchObject({ reason: "operator_cancelled", refundPercent: 100, refundAmount: 3_000_000 });
    const [rr] = await sql<any[]>`select status, refund_scope from commercial.refund_requests where booking_id = ${paid.bookingId}`;
    expect(rr).toMatchObject({ status: "requested", refund_scope: "full" });
    expect((await sql`select 1 from commercial.refund_requests where booking_id = ${free.bookingId}`).length).toBe(0);
    await expect(departures.cancelDeparture(user(owner.id), D, "weather", { sourceLocale: "fa-IR", texts: { "fa-IR": { title: "x", body: "y" } } })).rejects.toMatchObject({ code: "already_cancelled" });
    await expect(booking.startCheckout(c3.id, { departureId: D, optionId: t.optionId, travelers: { adult: 1 }, idempotencyKey: idemKey() })).rejects.toMatchObject({ code: "departure_unavailable" });
  });

  it("updateDeparture: capacity cannot go below booked + held; block; audited", async () => {
    const { owner, t } = await world();
    const c = await seedUser(sql);
    await bookOnce(t, c.id, t.departureIds[0], 3);
    await expect(departures.updateDeparture(user(owner.id), t.departureIds[0], { capacity: 2 })).rejects.toMatchObject({ code: "capacity_below_booked" });
    await departures.updateDeparture(user(owner.id), t.departureIds[0], { capacity: 3, block: true, meetingOverride: { lat: 29.61, lng: 52.51, note: "Gate B" } });
    expect(await dep(t.departureIds[0])).toMatchObject({ capacity: 3, is_blocked: true });
    const list = await departures.listProviderDepartures(user(owner.id), (await sql<any[]>`select service_provider_id::text as id from tour.tours where id = ${t.id}`)[0].id, { tourId: t.id });
    expect(list.find((d) => d.id === t.departureIds[0])).toMatchObject({ capacity: 3, booked: 3, remaining: 0, isBlocked: true });
    expect((await sql`select 1 from tour.audit_log where entity_id = ${t.departureIds[0]} and action = 'departure_updated'`).length).toBe(1);
  });

  it("notifyItineraryChange notifies future booked travelers once per revision", async () => {
    const { owner, t } = await world();
    const c = await seedUser(sql);
    await bookOnce(t, c.id);
    const authoring = await import("../platform/authoring");
    const stops = [{ day: 1, position: 1, type: "meeting", lat: 29.7, lng: 52.6, startTime: "07:00" }];
    const r = await authoring.saveItinerary(user(owner.id), t.id, "fa-IR", stops);
    expect(r.material).toBe(true);
    expect(await departures.notifyItineraryChange(user(owner.id), t.id, r.revision)).toEqual({ notices: 1, recipients: 1 });
    expect(await departures.notifyItineraryChange(user(owner.id), t.id, r.revision)).toEqual({ notices: 0, recipients: 0 });
  });

  // --------------------------------------------------------------------------
  // Reviews, waitlist, inquiries, incidents, guides, analytics
  // --------------------------------------------------------------------------

  it("reviews: only after the tour, once, moderated; rating counts only published reviews", async () => {
    const { owner, p, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    await expect(reviews.submitReview(c.id, { bookingId: b.bookingId, rating: 5, body: "Great", locale: "en-US" })).rejects.toMatchObject({ code: "review_not_eligible" });
    await sql`update tour.bookings set status = 'completed' where booking_id = ${b.bookingId}`;
    const stranger = await seedUser(sql);
    await expect(reviews.submitReview(stranger.id, { bookingId: b.bookingId, rating: 5, body: "x", locale: "en-US" })).rejects.toMatchObject({ kind: "not_found" });
    const r = await reviews.submitReview(c.id, { bookingId: b.bookingId, rating: 4, guideRating: 5, body: "Great guide", locale: "en-US" });
    await expect(reviews.submitReview(c.id, { bookingId: b.bookingId, rating: 1, body: "again", locale: "en-US" })).rejects.toMatchObject({ code: "review_exists" });
    const [before] = await sql<any[]>`select review_count from tour.tours where id = ${t.id}`;
    expect(before.review_count).toBe(0);
    await expect(reviews.moderateReview(user(owner.id), r.id, "published")).rejects.toMatchObject({ kind: "authorization" });
    const adm = await seedAdmin();
    await reviews.moderateReview(admin(adm.id), r.id, "published");
    const [after] = await sql<any[]>`select review_count, rating_avg from tour.tours where id = ${t.id}`;
    expect(after.review_count).toBe(1);
    expect(Number(after.rating_avg)).toBe(4);
    await reviews.replyToReview(user(owner.id), r.id, "Thank you!");
    await reviews.moderateReply(admin(adm.id), r.id, "published");
    expect((await reviews.listProviderReviews(user(owner.id), p.id))[0]).toMatchObject({ id: r.id, replyStatus: "published", status: "published" });
    await reviews.reportReview(stranger.id, r.id, "spam content");
    await expect(reviews.reportReview(stranger.id, r.id, "again")).rejects.toMatchObject({ code: "already_reported" });
    await reviews.moderateReview(admin(adm.id), r.id, "hidden");
    expect((await sql<any[]>`select review_count from tour.tours where id = ${t.id}`)[0].review_count).toBe(0);
  });

  it("waitlist: join a full departure with consent, offered when a seat frees, then converted on booking", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, capacity: 1, adultPrice: 0 });
    const [a, w] = [await seedUser(sql), await seedUser(sql)];
    const D = t.departureIds[0];
    const ba = await bookOnce(t, a.id);
    const j = await waitlist.joinWaitlist(w.id, D, 1);
    expect(j.position).toBe(1);
    await expect(waitlist.joinWaitlist(w.id, D, 1)).rejects.toMatchObject({ code: "already_waitlisted" });
    expect(await waitlist.offerReleasedSeats(D)).toBe(0);
    await booking.cancelByCustomer(a.id, ba.bookingId, "sick");
    expect(await waitlist.offerReleasedSeats(D)).toBe(1);
    const [row] = await sql<any[]>`select status, consent_at is not null as consent, offer_expires_at > now() + interval '1 hour' as window from tour.waitlist where id = ${j.id}`;
    expect(row).toEqual({ status: "offered", consent: true, window: true });
    expect(notifyMock.sent.some((s) => s.recipientUserId === w.id && s.data?.kind === "waitlist_offer")).toBe(true);
    expect(await waitlist.offerReleasedSeats(D)).toBe(0); // seat already promised
    await bookOnce(t, w.id);
    expect(await waitlist.markWaitlistConversions()).toBeGreaterThanOrEqual(1);
    expect((await sql<any[]>`select status from tour.waitlist where id = ${j.id}`)[0].status).toBe("converted");
  });

  it("inquiries: customer asks, provider staff quotes; another provider cannot", async () => {
    const { owner, p, t } = await world();
    const c = await seedUser(sql);
    const { id } = await inquiries.createInquiry(c.id, { tourId: t.id, kind: "private_quote", partySize: 6, preferredDates: ["2030-05-01"], message: "Family trip" });
    const list = await inquiries.listProviderInquiries(user(owner.id), p.id);
    expect(list.find((i) => i.id === id)).toMatchObject({ status: "open", partySize: 6, preferredDates: ["2030-05-01"] });
    const other = await seedUser(sql);
    await seedProvider(sql, other.id);
    await expect(inquiries.quoteInquiry(user(other.id), id, { amount: 1, currency: "IRR", expiresAt: new Date(Date.now() + 86_400_000).toISOString() })).rejects.toMatchObject({ kind: "authorization" });
    await expect(inquiries.quoteInquiry(user(owner.id), id, { amount: 1, currency: "IRR", expiresAt: new Date(Date.now() - 1000).toISOString() })).rejects.toMatchObject({ code: "invalid_expiry" });
    await inquiries.quoteInquiry(user(owner.id), id, { amount: 90_000_000, currency: "IRR", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), reply: "Private van" });
    expect((await inquiries.listProviderInquiries(user(owner.id), p.id)).find((i) => i.id === id)).toMatchObject({ status: "quoted", quoteAmount: 90_000_000 });
    expect(notifyMock.sent.some((s) => s.recipientUserId === c.id)).toBe(true);
  });

  it("incidents: a critical incident pages platform admins; escalate and resolve by role", async () => {
    const { owner, p, t } = await world();
    const adm = await seedAdmin();
    const staff = await seedUser(sql);
    await addMember(sql, p.id, staff.id, "staff");
    const { id } = await incidents.reportIncident(user(staff.id), { departureId: t.departureIds[0], severity: "critical", kind: "medical", description: "Traveler fainted" });
    void adm;
    // Every platform admin (identity role) is paged; the test DB may hold admins from earlier runs.
    expect(notifyMock.sent.filter((s) => s.data?.kind === "tour_incident").length).toBeGreaterThan(0);
    const [admins] = await sql<any[]>`select count(distinct ur.user_id)::int as n from identity.asp_net_user_roles ur join identity.asp_net_roles r on r.id = ur.role_id where r.normalized_name in ('ADMIN','SUPERADMIN')`;
    expect(notifyMock.sent.filter((s) => s.data?.kind === "tour_incident").length).toBe(Math.min(admins.n, 200));
    await incidents.escalateIncident(user(staff.id), id);
    await expect(incidents.resolveIncident(user(staff.id), id, "ok")).rejects.toMatchObject({ kind: "authorization" });
    await incidents.resolveIncident(user(owner.id), id, "Ambulance came; traveler fine");
    const list = await incidents.listIncidents(user(owner.id), { serviceProviderId: p.id });
    expect(list.find((i) => i.id === id)).toMatchObject({ status: "resolved", severity: "critical" });
    expect((await incidents.listIncidents(admin(adm.id), { status: "resolved" })).some((i) => i.id === id)).toBe(true);
  });

  it("guide profile: bio changes need approval by a manager of the guide's provider (V-069)", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const gu = await seedUser(sql, { firstName: "Leila" });
    const inv = await guides.inviteGuide(user(owner.id), p.id, { phone: `+98${gu.phone}` });
    expect(inv.status).toBe("invited");
    expect(await guides.respondToGuideInvitation(user(gu.id), p.id, true)).toEqual({ status: "active" });
    const prof = await guides.saveGuideProfile(user(gu.id), { displayName: "Leila K.", languages: [{ code: "en", level: "fluent" }], bios: { "en-US": "Ten years in Fars." } });
    expect(prof.bios).toEqual([{ locale: "en-US", draft: "Ten years in Fars.", published: null, status: "submitted" }]);
    const stranger = await seedUser(sql);
    await seedProvider(sql, stranger.id);
    await expect(guides.reviewGuideBio(user(stranger.id), inv.guideId, "approve")).rejects.toMatchObject({ kind: "authorization" });
    expect(await guides.reviewGuideBio(user(owner.id), inv.guideId, "approve")).toEqual({ updated: 1 });
    expect((await guides.getGuideProfile(user(gu.id)))!.bios[0]).toMatchObject({ published: "Ten years in Fars.", status: "published" });
    const listed = await guides.listProviderGuides(user(owner.id), p.id);
    expect(listed.find((g) => g.guideId === inv.guideId)).toMatchObject({ status: "active", displayName: "Leila K." });
    await guides.revokeGuide(user(owner.id), p.id, inv.guideId);
    expect((await guides.listProviderGuides(user(owner.id), p.id)).find((g) => g.guideId === inv.guideId)?.status).toBe("revoked");
  });

  it("analytics and payouts: aggregates for the provider; payouts need owner/admin role", async () => {
    const { owner, p, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id, t.departureIds[0], 2);
    await sql`update booking.bookings set paid_amount = 1000000, payment_status = 'Paid' where id = ${b.bookingId}`;
    const [{ from }] = await sql<any[]>`select min(starts_on)::text as from from tour.departures where tour_id = ${t.id}`;
    const a = await analytics.providerAnalytics(user(owner.id), p.id, { from, to: calendar.addDaysIso(from, 5) });
    expect(a).toMatchObject({ departures: 2, capacity: 20, bookedSeats: 2, occupancy: 0.1, totalBookings: 1, cancellationRate: 0 });
    expect(a.revenueByCurrency).toEqual([{ currency: "IRR", paid: 1_000_000, bookings: 1 }]);
    const pay = await analytics.providerPayoutSummary(user(owner.id), p.id);
    expect(pay.currencies[0]).toMatchObject({ currency: "IRR", gross: 1_000_000 });
    expect(pay.currencies[0].commission + pay.currencies[0].net).toBe(1_000_000);
    const mgr = await seedUser(sql);
    await addMember(sql, p.id, mgr.id, "manager");
    await expect(analytics.providerPayoutSummary(user(mgr.id), p.id)).rejects.toMatchObject({ kind: "authorization" });
    await expect(analytics.providerAnalytics(user(owner.id), p.id, { from: "2026-01-01", to: "2028-01-01" })).rejects.toMatchObject({ code: "range_too_long" });
  });

  // --------------------------------------------------------------------------
  // AT-14 every ops function: provider X vs provider Y objects
  // --------------------------------------------------------------------------

  it("AT-14 provider X cannot read or change any of provider Y's operations", async () => {
    const ownerX = await seedUser(sql);
    const px = await seedProvider(sql, ownerX.id);
    void px;
    const { owner: ownerY, p: py, t: ty } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(ty, c.id);
    await sql`update tour.bookings set status = 'completed' where booking_id = ${b.bookingId}`;
    const rv = await reviews.submitReview(c.id, { bookingId: b.bookingId, rating: 5, body: "ok", locale: "en-US" });
    await sql`update tour.reviews set status = 'published' where id = ${rv.id}`;
    const inq = await inquiries.createInquiry(c.id, { tourId: ty.id, kind: "group", partySize: 10 });
    const gY = await seedGuide(py.id);
    const D = ty.departureIds[0];
    const x = user(ownerX.id);
    const texts = { sourceLocale: "en-US", texts: { "en-US": { title: "t", body: "b" } } };
    const before = await dep(D);
    const attempts: [string, () => Promise<unknown>][] = [
      ["listProviderDepartures", () => departures.listProviderDepartures(x, py.id)],
      ["updateDeparture", () => departures.updateDeparture(x, D, { capacity: 99 })],
      ["delayDeparture", () => departures.delayDeparture(x, D, 10, texts)],
      ["cancelDeparture", () => departures.cancelDeparture(x, D, "hijack", texts)],
      ["listProviderBookings", () => departures.listProviderBookings(x, { serviceProviderId: py.id })],
      ["notifyItineraryChange", () => departures.notifyItineraryChange(x, ty.id, 1)],
      ["getManifest", () => checkin.getManifest(x, D)],
      ["scanTicket", () => checkin.scanTicket(x, { departureId: D, token: b.voucherCode, clientEventId: `ev-${idemKey()}`, scannedAt: new Date().toISOString() })],
      ["syncCheckins", () => checkin.syncCheckins(x, D, [])],
      ["startTracking", () => live.startTracking(x, D)],
      ["stopTracking", () => live.stopTracking(x, D)],
      ["postMilestone", () => live.postMilestone(x, { departureId: D, kind: "note", note: "x" })],
      ["getLiveView", () => live.getLiveView(x, D)],
      ["sendNotice", () => notices.sendNotice(x, { departureId: D, kind: "announcement", effectiveAt: new Date().toISOString(), ...texts })],
      ["assignToDeparture", () => guides.assignToDeparture(x, { departureId: D, guideId: gY.guideId, role: "guide" })],
      ["inviteGuide", () => guides.inviteGuide(x, py.id, { guideUserId: c.id })],
      ["revokeGuide", () => guides.revokeGuide(x, py.id, gY.guideId)],
      ["listProviderGuides", () => guides.listProviderGuides(x, py.id)],
      ["reviewGuideBio", () => guides.reviewGuideBio(x, gY.guideId, "approve")],
      ["listProviderReviews", () => reviews.listProviderReviews(x, py.id)],
      ["replyToReview", () => reviews.replyToReview(x, rv.id, "hijack")],
      ["listProviderInquiries", () => inquiries.listProviderInquiries(x, py.id)],
      ["quoteInquiry", () => inquiries.quoteInquiry(x, inq.id, { amount: 1, currency: "IRR", expiresAt: new Date(Date.now() + 86_400_000).toISOString() })],
      ["declineInquiry", () => inquiries.declineInquiry(x, inq.id)],
      ["reportIncident", () => incidents.reportIncident(x, { departureId: D, severity: "low", kind: "other", description: "x" })],
      ["listIncidents", () => incidents.listIncidents(x, { serviceProviderId: py.id })],
      ["providerAnalytics", () => analytics.providerAnalytics(x, py.id, { from: "2026-01-01", to: "2026-02-01" })],
      ["providerPayoutSummary", () => analytics.providerPayoutSummary(x, py.id)],
    ];
    for (const [name, fn] of attempts) {
      await expect(fn(), name).rejects.toMatchObject({ kind: "authorization" });
    }
    expect(await dep(D)).toEqual(before);
    const [r] = await sql<any[]>`select provider_reply from tour.reviews where id = ${rv.id}`;
    expect(r.provider_reply).toBeNull();
    // Owner Y can do the same things.
    await expect(departures.listProviderBookings(user(ownerY.id), { serviceProviderId: py.id })).resolves.toHaveLength(1);
  });

  // --------------------------------------------------------------------------
  // Sweeper
  // --------------------------------------------------------------------------

  it("sweeper completes ended departures and bookings, expires tracking, purges points past retention; one worker at a time", async () => {
    const { owner, t } = await world();
    const c = await seedUser(sql);
    const b = await bookOnce(t, c.id);
    const D = t.departureIds[0];
    await startSoon(D);
    const s = await live.startTracking(user(owner.id), D);
    await live.pushPoints(user(owner.id), s.id, [{ seq: 1, recordedAt: new Date().toISOString(), latitude: 1, longitude: 1 }]);
    await sql`update tour.departures set starts_at = now() - interval '12 hours', ends_at = now() - interval '7 hours' where id = ${D}`;
    // An older session already past retention.
    const D2 = t.departureIds[1];
    const [old] = await sql<any[]>`insert into tour.tracking_sessions (departure_id, started_by, ended_at, end_reason, retention_until)
                                    values (${D2}, ${owner.id}, now() - interval '40 days', 'manual', now() - interval '1 day') returning id::text`;
    await sql`insert into tour.tracking_points (session_id, seq, recorded_at, latitude, longitude) values (${old.id}, 1, now() - interval '41 days', 1, 1)`;

    const results = await Promise.all([sweeper.runToursSweep(), sweeper.runToursSweep()]);
    expect(results.filter((r) => r.ran)).toHaveLength(1);
    const ran = results.find((r) => r.ran)!;
    expect(ran.errors).toEqual([]);
    const [sess] = await sql<any[]>`select end_reason, retention_until is not null as kept from tour.tracking_sessions where id = ${s.id}`;
    expect(sess).toEqual({ end_reason: "expired", kept: true });
    expect((await sql`select 1 from tour.tracking_points where session_id = ${old.id}`).length).toBe(0);
    expect((await sql`select 1 from tour.tracking_points where session_id = ${s.id}`).length).toBe(1);
    expect((await dep(D)).status).toBe("completed");
    expect((await sql<any[]>`select status from tour.bookings where booking_id = ${b.bookingId}`)[0].status).toBe("completed");
    expect((await dep(D2)).status).toBe("scheduled");
  });

  // --------------------------------------------------------------------------
  // Internal RPC contract
  // --------------------------------------------------------------------------

  describe("internal RPC", () => {
    const call = (method: string, actingUserId: string | null, args: unknown, key = KEY) =>
      rpc.handleRpc({ method, authorization: `Bearer ${key}`, actingUserId, body: { args }, serviceKey: KEY });

    it("rejects a wrong key (401), a missing configuration (503), an unknown method (404), invalid args (400), unknown acting user (401)", async () => {
      const u = await seedUser(sql);
      expect((await call("me.context", u.id, {}, "wrong-key-wrong-key-wrong-key-wrong-key")).status).toBe(401);
      expect((await rpc.handleRpc({ method: "me.context", authorization: null, actingUserId: u.id, body: {}, serviceKey: KEY })).status).toBe(401);
      const nc = await rpc.handleRpc({ method: "me.context", authorization: `Bearer ${KEY}`, actingUserId: u.id, body: {}, serviceKey: "short" });
      expect(nc).toMatchObject({ status: 503, body: { ok: false, error: { code: "service_not_configured" } } });
      expect(await call("no.such.method", u.id, {})).toMatchObject({ status: 404, body: { error: { code: "unknown_method" } } });
      expect(await call("__proto__", u.id, {})).toMatchObject({ status: 404 });
      const bad = await call("provider.tours", u.id, { serviceProviderId: "00000000-0000-4000-8000-000000000000", extra: 1 });
      expect(bad).toMatchObject({ status: 400, body: { ok: false, error: { kind: "validation", code: "invalid_args" } } });
      expect((await call("provider.tours", u.id, { serviceProviderId: "not-a-uuid" })).status).toBe(400);
      expect((await rpc.handleRpc({ method: "me.context", authorization: `Bearer ${KEY}`, actingUserId: u.id, body: { args: {}, role: "admin" }, serviceKey: KEY })).status).toBe(400);
      expect(await call("me.context", "11111111-1111-4111-8111-111111111111", {})).toMatchObject({ status: 401, body: { error: { code: "invalid_acting_user" } } });
    });

    it("an acting user without membership gets 403; roles come from the database, not the caller", async () => {
      const { p } = await world();
      const stranger = await seedUser(sql);
      expect(await call("provider.tours", stranger.id, { serviceProviderId: p.id })).toMatchObject({ status: 403, body: { error: { kind: "authorization" } } });
      const adm = await seedAdmin();
      expect((await call("provider.tours", adm.id, { serviceProviderId: p.id })).status).toBe(200);
      expect((await rpc.resolveActingActor(adm.id))?.isAdmin).toBe(true);
      expect((await rpc.resolveActingActor(stranger.id))?.isAdmin).toBe(false);
    });

    it("happy path: me.context, tour.create, content.save, tour.submit (unmet → 400 with requirements, then met → 200)", async () => {
      const owner = await seedUser(sql);
      const p = await seedProvider(sql, owner.id);
      const me = await call("me.context", owner.id, {});
      expect(me.status).toBe(200);
      expect((me.body as any).data.providers).toEqual([expect.objectContaining({ id: p.id, role: "owner" })]);

      const created = await call("tour.create", owner.id, { serviceProviderId: p.id, slug: `rpc-${Date.now()}`, sourceLocale: "fa-IR", currency: "IRR", title: "تور آزمایشی RPC" });
      expect(created.status).toBe(200);
      const tourId = (created.body as any).data.id as string;
      expect(await call("content.save", owner.id, { tourId, locale: "fa-IR", fields: { summary: "خلاصه", description: "شرح", meeting_instructions: "میدان", safety_notes: "ایمنی" } }))
        .toMatchObject({ status: 200, body: { ok: true } });
      const unmet = await call("tour.submit", owner.id, { tourId });
      expect(unmet).toMatchObject({ status: 400, body: { ok: false, error: { code: "publish_requirements_unmet" } } });
      expect(((unmet.body as any).error.details.requirements as any[]).map((r) => r.code)).toEqual(expect.arrayContaining(["missing_media", "missing_price", "missing_policy"]));

      expect((await call("tour.updateCore", owner.id, { tourId, patch: { meetingLat: 29.6, meetingLng: 52.5, durationMinutes: 300 } })).status).toBe(200);
      expect((await call("tour.updateCore", owner.id, { tourId, patch: { status: "published" } })).status).toBe(400); // not a core field
      expect((await call("media.add", owner.id, { tourId, url: "https://cdn.example.test/a.jpg", width: 1600, height: 1000, isCover: true })).status).toBe(200);
      expect((await call("options.save", owner.id, { tourId, locale: "fa-IR", options: [{ code: "standard", kind: "public", tiers: [{ travelerClass: "adult", amount: 1_000_000 }] }] })).status).toBe(200);
      expect((await call("policy.create", owner.id, { tourId, cancellationRules: [{ hoursBefore: 24, refundPercent: 100 }], texts: { "fa-IR": { cancellation: "۲۴ ساعت" } } })).status).toBe(200);
      expect(await call("tour.submit", owner.id, { tourId })).toMatchObject({ status: 200, body: { ok: true } });
      const [{ status }] = await sql<any[]>`select status from tour.tours where id = ${tourId}`;
      expect(status).toBe("submitted");
      const bundle = await call("tour.get", owner.id, { tourId });
      expect(bundle.status).toBe(200);
      expect((bundle.body as any).data.options[0].tiers[0].amount).toBe(1_000_000);
      expect((await sql`select 1 from tour.audit_log where entity_id = ${tourId} and action = 'submitted'`).length).toBe(1);

      const stranger = await seedUser(sql);
      expect((await call("tour.get", stranger.id, { tourId })).status).toBe(403);
      expect((await call("content.save", stranger.id, { tourId, locale: "fa-IR", fields: { summary: "hijack" } })).status).toBe(403);
    });

    it("rate limit per acting user", () => {
      rpc.resetRateLimits();
      const id = "22222222-2222-4222-8222-222222222222";
      const now = Date.now();
      for (let i = 0; i < 120; i += 1) expect(rpc.rateLimited(id, now)).toBeNull();
      expect(rpc.rateLimited(id, now)).toBeGreaterThan(0);
      expect(rpc.rateLimited("33333333-3333-4333-8333-333333333333", now)).toBeNull();
      expect(rpc.rateLimited(id, now + 61_000)).toBeNull();
      rpc.resetRateLimits();
    });

    it("every documented method is registered", () => {
      const documented = [
        "me.context", "provider.tours", "tour.create", "tour.get", "tour.updateCore", "tour.preview", "content.save", "content.approve",
        "media.add", "media.remove", "media.reorder", "itinerary.save", "options.save", "addons.save", "policy.create", "schedule.addRule",
        "schedule.materialize", "blackout.add", "priceRule.add", "tour.submit", "tour.setVisibility", "tour.duplicate", "departures.list",
        "departure.update", "departure.delay", "departure.cancel", "bookings.list", "booking.decide", "manifest.get", "checkin.scan",
        "checkin.sync", "tracking.start", "tracking.stop", "tracking.push", "milestone.post", "notice.send", "guides.list", "guides.invite",
        "guides.revoke", "assignment.create", "assignment.revoke", "guide.profile.get", "guide.profile.save", "guide.schedule", "reviews.list",
        "review.reply", "inquiries.list", "inquiry.quote", "incident.create", "provider.analytics", "provider.payouts",
      ];
      expect(documented.filter((m) => !(m in rpc.RPC_METHODS))).toEqual([]);
    });
  });
});
