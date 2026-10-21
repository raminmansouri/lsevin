/**
 * Tours administration panel against a REAL Postgres (production-equivalent
 * baseline + 0078..0081). Same env/skip pattern as platform.integration.test.ts:
 *
 *   TOURS_TEST_DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin_tours_test \
 *   ACCOUNTING_TEST_DATABASE_URL=$TOURS_TEST_DATABASE_URL npx vitest run src/features/tours/server/admin
 *
 * Covers: every admin server action denies non-admins and guests; admin
 * functions deny non-admin actors; settings validation + persistence; rebook
 * keeps inventory consistent; dispute approval hierarchy; CSV escaping; a
 * commission change never alters past bookings; mass cancellation notices.
 */
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
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

// The session is the one thing a test cannot produce; the actor the server
// actions resolve is controlled here. Everything else is real.
const session = vi.hoisted(() => ({ actor: { userId: null as string | null, roles: [] as string[], isAdmin: false } }));
// Replaces the session-reading module (next-auth) entirely; the role helpers it
// re-exports come from roles.ts, unchanged.
vi.mock("../platform/access", async () => {
  const roles = await import("../platform/roles");
  const { fail } = await import("../platform/errors");
  return {
    ...roles,
    GUEST_COOKIE: "lsevin_tours_guest",
    ownerKey: async () => null,
    currentActor: async () => session.actor,
    requireUser: async () => { if (!session.actor.userId) throw fail.auth(); return session.actor; },
    requireAdmin: async () => {
      if (!session.actor.userId) throw fail.auth();
      if (!session.actor.isAdmin) throw fail.forbidden("admin_required");
      return session.actor;
    },
  };
});
vi.mock("@/app/[locale]/n/app/mobile/notifications/notification-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createNotification: vi.fn(async () => "00000000-0000-0000-0000-000000000000"),
}));

let sql: postgres.Sql;
let booking: typeof import("../platform/booking");
let settingsMod: typeof import("../platform/settings");
let actions: typeof import("./actions");
let settingsAdmin: typeof import("./settings-admin");
let rebook: typeof import("./rebook");
let disputes: typeof import("./disputes");
let commissions: typeof import("./commissions");
let reports: typeof import("./reports");
let csv: typeof import("./csv");
let operations: typeof import("./operations");
let queries: typeof import("./queries");
let catalogAdmin: typeof import("./catalog-admin");
let support: typeof import("./support");
let preview: typeof import("./preview");
let authoring: typeof import("../platform/authoring");

const adminActor = (userId: string, roles = ["admin"]) => ({ userId, roles, isAdmin: true });
const userActor = (userId: string) => ({ userId, roles: ["user"], isAdmin: false });

async function bookOnce(t: SeededTour, userId: string, departureId = t.departureIds[0], adults = 1) {
  const sel = { departureId, optionId: t.optionId, travelers: { adult: adults } };
  const started = await booking.startCheckout(userId, { ...sel, idempotencyKey: idemKey() });
  return booking.confirmCheckout(userId, {
    ...sel, holdId: started.holdId, idempotencyKey: idemKey(), expectedTotal: started.quote.total,
    acceptedPolicyVersion: started.policy.version, policyLocale: "fa-IR", uiLocale: "fa", displayCalendar: "persian",
    buyer: sampleBuyer, participants: sampleParticipants(adults),
  });
}

async function dep(id: string) {
  const [d] = await sql<any[]>`select capacity, booked_count, held_count, status, is_blocked from tour.departures where id = ${id}`;
  return d;
}

/** Plausible arguments for any action; the guard must refuse before any of them is looked at. */
const DUMMY_ARGS = ["00000000-0000-0000-0000-000000000001", { tourId: "x", bookingId: "x", departureId: "x", reason: "because", notice: { sourceLocale: "fa-IR", texts: {} } }, "fa-IR", []];

suite("tours admin panel (real database)", () => {
  beforeAll(async () => {
    assertLocalDatabase(URL_!);
    sql = postgres(URL_!, { max: 8, onnotice: () => {} });
    booking = await import("../platform/booking");
    settingsMod = await import("../platform/settings");
    authoring = await import("../platform/authoring");
    actions = await import("./actions");
    settingsAdmin = await import("./settings-admin");
    rebook = await import("./rebook");
    disputes = await import("./disputes");
    commissions = await import("./commissions");
    reports = await import("./reports");
    csv = await import("./csv");
    operations = await import("./operations");
    queries = await import("./queries");
    catalogAdmin = await import("./catalog-admin");
    support = await import("./support");
    preview = await import("./preview");
  });
  afterAll(async () => {
    await sql?.end();
  });

  it("every admin server action refuses guests (authentication) and non-admins (authorization) before doing anything", async () => {
    const names = Object.keys(actions).filter((k) => typeof (actions as Record<string, unknown>)[k] === "function");
    expect(names.length).toBeGreaterThan(40);
    const nonAdmin = await seedUser(sql);
    for (const [actor, kind] of [
      [{ userId: null, roles: [], isAdmin: false }, "authentication"],
      [userActor(nonAdmin.id), "authorization"],
    ] as const) {
      session.actor = actor as typeof session.actor;
      for (const name of names) {
        const fn = (actions as unknown as Record<string, (...a: unknown[]) => Promise<{ ok: boolean; error?: { kind: string } }>>)[name];
        const res = await fn(...DUMMY_ARGS);
        expect(res, name).toMatchObject({ ok: false, error: { kind } });
      }
    }
    const [written] = await sql<{ n: number }[]>`select count(*)::int as n from tour.audit_log where actor_user_id = ${nonAdmin.id}`;
    expect(written.n).toBe(0);
  });

  it("admin server functions refuse a non-admin actor even when called directly", async () => {
    const u = userActor((await seedUser(sql)).id);
    const calls: (() => Promise<unknown>)[] = [
      () => queries.dashboard(u), () => queries.listTours(u, {}), () => queries.listBookings(u, {}), () => queries.departuresBoard(u, {}),
      () => settingsAdmin.saveSettings(u, { holdMinutes: 15 }), () => catalogAdmin.upsertTerm(u, { kind: "tag", code: "x", labels: { "en-US": "X" } }),
      () => catalogAdmin.grantTranslator(u, { userId: u.userId!, locale: "en-US" }), () => rebook.rebookBooking(u, { bookingId: u.userId!, targetDepartureId: u.userId!, reason: "because" }),
      () => disputes.openDispute(u, { bookingId: u.userId!, kind: "complaint", reasonCode: "other", notes: "because" }),
      () => commissions.createAgreement(u, { percent: 5, effectiveFrom: "2099-01-01" }), () => support.revealBookingContact(u, { bookingId: u.userId!, reason: "curiosity only here" }),
      () => operations.adminCancelDeparture(u, { departureId: u.userId!, reasonCode: "weather", reason: "because", notice: { sourceLocale: "fa-IR", texts: {} } }),
      () => reports.bookingsCsv(u, reports.parseRange({})), () => preview.previewTour(u, { tourId: u.userId! }),
    ];
    for (const call of calls) await expect(call()).rejects.toMatchObject({ kind: "authorization", code: "admin_required" });
  });

  it("settings: validation rejects invalid combinations; a valid save persists, is audited and invalidates the cache", async () => {
    const current = await settingsMod.getTourSettings({ fresh: true });
    const bad: [Record<string, unknown>, string][] = [
      [{ defaultLocale: "xx-XX" }, "defaultLocale"],
      [{ enabledLocales: [] }, "enabledLocales"],
      [{ enabledLocales: ["fa-IR", "fa-IR"] }, "enabledLocales"],
      [{ contentFallbackOrder: ["source", "de-AT"] }, "contentFallbackOrder"],
      [{ requiredPublishLocales: ["en-US"] }, "requiredPublishLocales"],
      [{ defaultCalendarByLocale: { fa: "jalali-ish", "*": "gregory" } }, "defaultCalendarByLocale"],
      [{ defaultCalendarByLocale: { fa: "persian" } }, "defaultCalendarByLocale"],
      [{ holdMinutes: 0 }, "holdMinutes"],
      [{ holdMinutes: 40, paymentWindowMinutes: 30 }, "paymentWindowMinutes"],
      [{ serviceFeePercent: 80 }, "serviceFeePercent"],
      [{ hijriConvention: { calendar: "islamic-civil", officialOffsets: {} } }, "hijriConvention"],
      [{ somethingElse: 1 }, "somethingElse"],
      [{ weather: { provider: "open-meteo", currentTtlMinutes: 30, forecastTtlMinutes: 180, forecastHorizonDays: 40, attribution: "x" } }, "weather.forecastHorizonDays"],
    ];
    for (const [patch, field] of bad) {
      expect(() => settingsAdmin.validateSettings(patch, current), JSON.stringify(patch)).toThrowError();
      try { settingsAdmin.validateSettings(patch, current); } catch (e) {
        expect(e).toMatchObject({ kind: "validation", code: "invalid_setting", details: { field } });
      }
    }
    const admin = adminActor((await seedUser(sql)).id);
    const before = current.recentViewsLimit;
    const next = before === 20 ? 21 : 20;
    try {
      const r = await settingsAdmin.saveSettings(admin, { recentViewsLimit: next });
      expect(r.changed).toEqual(["recentViewsLimit"]);
      expect((await settingsMod.getTourSettings()).recentViewsLimit).toBe(next); // cache invalidated
      const [row] = await sql<any[]>`select value, updated_by::text from tour.settings where key = 'recent_views_limit'`;
      expect(Number(row.value)).toBe(next);
      expect(row.updated_by).toBe(admin.userId);
      const [a] = await sql<any[]>`select detail from tour.audit_log where action = 'settings_updated' and actor_user_id = ${admin.userId} order by id desc limit 1`;
      expect(a.detail.changes.recentViewsLimit).toEqual({ from: before, to: next });
      // The server action path enforces the same validation (infra errors are not involved).
      session.actor = admin;
      const res = await actions.saveSettingsAction({ requiredPublishLocales: ["en-US"] });
      expect(res).toMatchObject({ ok: false, error: { kind: "validation", code: "invalid_setting" } });
    } finally {
      await settingsAdmin.saveSettings(admin, { recentViewsLimit: before });
    }
  });

  it("rebook moves the reservation with its seats: old departure −seats, new +seats, same booking/payment row, audited; full target is refused unchanged", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 3, capacity: 4 });
    const customer = await seedUser(sql);
    const b = await bookOnce(t, customer.id, t.departureIds[0], 2);
    const admin = adminActor((await seedUser(sql)).id);
    const [d0, d1] = [await dep(t.departureIds[0]), await dep(t.departureIds[1])];
    expect(d0.booked_count).toBe(2);

    const r = await rebook.rebookBooking(admin, { bookingId: b.bookingId, targetDepartureId: t.departureIds[1], reason: "Customer asked to travel a day later" });
    expect(r).toMatchObject({ from: t.departureIds[0], to: t.departureIds[1], seats: 2 });
    const [a0, a1] = [await dep(t.departureIds[0]), await dep(t.departureIds[1])];
    expect(a0.booked_count).toBe(d0.booked_count - 2);
    expect(a1.booked_count).toBe(d1.booked_count + 2);
    expect(a0.held_count).toBe(d0.held_count);
    expect(a1.held_count).toBe(d1.held_count);
    const [tb] = await sql<any[]>`select departure_id::text, status, voucher_code, total_amount, content_snapshot from tour.bookings where booking_id = ${b.bookingId}`;
    expect(tb.departure_id).toBe(t.departureIds[1]);
    expect(tb.status).toBe(b.status);
    expect(tb.voucher_code).toBe(b.voucherCode);
    const [bb] = await sql<any[]>`select count(*)::int as n, max(metadata->>'tourDepartureId') as dep from booking.bookings where id = ${b.bookingId}`;
    expect(bb).toEqual({ n: 1, dep: t.departureIds[1] });
    const [audit] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${b.bookingId} and action = 'rebooked'`;
    expect(audit.detail).toMatchObject({ from: t.departureIds[0], to: t.departureIds[1], seats: 2 });

    // Target without room: fill departure 2 with another customer, then try to move 2 more seats there.
    const other = await seedUser(sql);
    await bookOnce(t, other.id, t.departureIds[2], 3);
    const beforeFull = [await dep(t.departureIds[1]), await dep(t.departureIds[2])];
    await expect(rebook.rebookBooking(admin, { bookingId: b.bookingId, targetDepartureId: t.departureIds[2], reason: "Try the full one" }))
      .rejects.toMatchObject({ kind: "conflict", code: "insufficient_capacity" });
    expect([await dep(t.departureIds[1]), await dep(t.departureIds[2])]).toEqual(beforeFull);
    const [still] = await sql<any[]>`select departure_id::text from tour.bookings where booking_id = ${b.bookingId}`;
    expect(still.departure_id).toBe(t.departureIds[1]);

    // Another tour's departure is never a target.
    const t2 = await seedTour(sql, { providerId: p.id, departures: 1 });
    await expect(rebook.rebookBooking(admin, { bookingId: b.bookingId, targetDepartureId: t2.departureIds[0], reason: "Wrong tour" }))
      .rejects.toMatchObject({ kind: "validation", code: "different_tour" });
    await expect(rebook.rebookBooking(admin, { bookingId: b.bookingId, targetDepartureId: t.departureIds[1], reason: "Same departure again" }))
      .rejects.toMatchObject({ kind: "validation", code: "same_departure" });
  });

  it("dispute approval hierarchy: agent escalates a 60% refund to manager; agent cannot decide at manager level; manager approves and the refund goes to the platform workflow", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, adultPrice: 1_000_000 });
    const customer = await seedUser(sql);
    const b = await bookOnce(t, customer.id);
    await sql`update booking.bookings set paid_amount = total_amount, payment_status = 'Paid' where id = ${b.bookingId}`;
    const agent = adminActor((await seedUser(sql)).id);
    const manager = adminActor((await seedUser(sql)).id);
    const finance = adminActor((await seedUser(sql)).id);
    await sql`insert into tour.admin_roles (user_id, role) values (${manager.userId}, 'manager'), (${finance.userId}, 'finance')`;

    expect(disputes.requiredLevelFor("refund_exception", 200_000, 1_000_000)).toBe("agent");
    expect(disputes.requiredLevelFor("refund_exception", 600_000, 1_000_000)).toBe("manager");
    expect(disputes.requiredLevelFor("refund_exception", 900_000, 1_000_000)).toBe("finance");
    expect(disputes.requiredLevelFor("chargeback", null, 1_000_000)).toBe("finance");

    await expect(disputes.openDispute(agent, { bookingId: b.bookingId, kind: "refund_exception", reasonCode: "goodwill", amount: 5_000_000, notes: "Too much money" }))
      .rejects.toMatchObject({ kind: "validation", code: "amount_exceeds_total" });
    const d = await disputes.openDispute(agent, { bookingId: b.bookingId, kind: "refund_exception", reasonCode: "service_not_as_described", amount: 600_000, notes: "Lunch was not served" });
    expect(d.requiredLevel).toBe("manager");
    await expect(disputes.decideDispute(agent, { disputeId: d.id, decision: "approve", note: "ok" })).rejects.toMatchObject({ code: "reason_required" });

    const r1 = await disputes.decideDispute(agent, { disputeId: d.id, decision: "approve", note: "Agent agrees, needs manager" });
    expect(r1).toMatchObject({ status: "pending_approval", approvalLevel: "manager", refundRequestId: null });
    await expect(disputes.decideDispute(agent, { disputeId: d.id, decision: "approve", note: "Agent again" })).rejects.toMatchObject({ kind: "authorization", code: "approval_level_required" });

    const r2 = await disputes.decideDispute(manager, { disputeId: d.id, decision: "approve", note: "Manager approves partial refund" });
    expect(r2.status).toBe("approved");
    expect(r2.refundRequestId).toBeTruthy();
    const [rr] = await sql<any[]>`select status, refund_scope from commercial.refund_requests where id = ${r2.refundRequestId}`;
    expect(rr).toEqual({ status: "requested", refund_scope: "partial" });
    const steps = await sql<any[]>`select level, decision from tour.dispute_decisions where dispute_id = ${d.id} order by created_at`;
    expect(steps).toEqual([{ level: "agent", decision: "escalate" }, { level: "manager", decision: "approve" }]);
    await expect(disputes.decideDispute(finance, { disputeId: d.id, decision: "reject", note: "Too late, decided" })).rejects.toMatchObject({ kind: "conflict", code: "dispute_closed" });

    // A chargeback needs finance: manager escalates, finance rejects with a note.
    const c = await disputes.openDispute(agent, { bookingId: b.bookingId, kind: "chargeback", reasonCode: "duplicate_charge", amount: 100_000, notes: "Bank chargeback" });
    expect(c.requiredLevel).toBe("finance");
    expect((await disputes.decideDispute(manager, { disputeId: c.id, decision: "approve", note: "Looks valid to me" })).approvalLevel).toBe("finance");
    expect((await disputes.decideDispute(finance, { disputeId: c.id, decision: "reject", note: "Charge was not duplicated" })).status).toBe("rejected");
    // Only finance assigns roles.
    await expect(disputes.setAdminRole(manager, { userId: agent.userId, role: "finance" })).rejects.toMatchObject({ code: "finance_level_required" });
    await disputes.setAdminRole(finance, { userId: agent.userId, role: "manager" });
    expect(await disputes.adminLevelOf(agent)).toBe("manager");
  });

  it("CSV: formula cells are neutralised, quotes/newlines escaped, BOM present; the real export labels currency, calendar and timezone and carries no personal data", async () => {
    expect(csv.escapeCsvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(csv.escapeCsvCell("+1")).toBe("'+1");
    expect(csv.escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(csv.escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csv.escapeCsvCell("\tcmd")).toBe("'\tcmd");
    expect(csv.escapeCsvCell("a,b")).toBe("\"a,b\"");
    expect(csv.escapeCsvCell("line\nbreak")).toBe("\"line\nbreak\"");
    expect(csv.escapeCsvCell(-5)).toBe("-5"); // typed numbers stay numeric
    expect(csv.escapeCsvCell(null)).toBe("");
    expect(csv.toCsv(["a"], [["x"]])).toBe("﻿a\r\nx\r\n");

    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id, { name: "=cmd|' /C calc'!A0" });
    const t = await seedTour(sql, { providerId: p.id, firstDepartureInDays: 5, departures: 1 });
    const customer = await seedUser(sql, { firstName: "=Evil" });
    await bookOnce(t, customer.id);
    const admin = adminActor((await seedUser(sql)).id);
    const [d] = await sql<any[]>`select starts_on::text as d from tour.departures where id = ${t.departureIds[0]}`;
    // The range is typed in the Jalali calendar, exactly as an admin would enter it (M-027).
    const jalali = reports.calendarDateLabel(d.d, "persian");
    const range = reports.parseRange({ from: jalali, to: jalali, calendar: "persian", timezone: "Asia/Tehran", providerId: p.id });
    expect(range).toMatchObject({ from: d.d, to: d.d });
    const out = await reports.bookingsCsv(admin, range);
    expect(out.body.startsWith("﻿")).toBe(true);
    const lines = out.body.slice(1).trim().split("\r\n");
    const header = lines[0].split(",");
    for (const col of ["departure_date_iso", "departure_date_persian", "calendar", "tour_timezone", "departure_instant_utc", "report_timezone", "currency"]) expect(header).toContain(col);
    expect(lines, out.body).toHaveLength(2);
    const row = lines[1];
    expect(row).toContain("'=cmd");
    expect(row).toContain(d.d);
    expect(row).toContain(reports.calendarDateLabel(d.d, "persian"));
    expect(row).toContain("IRR");
    expect(row).not.toContain("Evil");
    expect(row).not.toContain(customer.phone);
    const [a] = await sql<any[]>`select detail from tour.audit_log where action = 'bookings_exported' and actor_user_id = ${admin.userId}`;
    expect(a.detail).toMatchObject({ calendar: "persian", rows: 1 });
  });

  it("a commission agreement change never alters past bookings; the snapshot is immutable; past-dated or overlapping agreements are refused", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 2 });
    const before = await commissions.effectiveCommission(p.id, new Date().toISOString().slice(0, 10));
    const first = await bookOnce(t, (await seedUser(sql)).id);
    const [fb] = await sql<any[]>`select commission_percent from tour.bookings where booking_id = ${first.bookingId}`;
    expect(Number(fb.commission_percent)).toBe(before.percent);

    const admin = adminActor((await seedUser(sql)).id);
    const [today] = await sql<any[]>`select current_date::text as d, (current_date - 1)::text as y`;
    await expect(commissions.createAgreement(admin, { serviceProviderId: p.id, percent: 30, effectiveFrom: today.y })).rejects.toMatchObject({ code: "effective_from_in_past" });
    const ag = await commissions.createAgreement(admin, { serviceProviderId: p.id, percent: 25, effectiveFrom: today.d });
    await expect(commissions.createAgreement(admin, { serviceProviderId: p.id, percent: 26, effectiveFrom: today.d })).rejects.toMatchObject({ kind: "conflict", code: "agreement_overlap" });

    const [still] = await sql<any[]>`select commission_percent, commission_agreement_id from tour.bookings where booking_id = ${first.bookingId}`;
    expect(Number(still.commission_percent)).toBe(before.percent);
    const second = await bookOnce(t, (await seedUser(sql)).id, t.departureIds[1]);
    const [sb] = await sql<any[]>`select commission_percent, commission_agreement_id::text from tour.bookings where booking_id = ${second.bookingId}`;
    expect(sb).toEqual({ commission_percent: "25.00", commission_agreement_id: ag.id });
    await expect(sql`update tour.bookings set commission_percent = 25 where booking_id = ${first.bookingId}`).rejects.toThrow(/COMMISSION_SNAPSHOT_IMMUTABLE/);
    // Totals were never touched by the agreement either.
    const [tot] = await sql<any[]>`select total_amount from tour.bookings where booking_id = ${first.bookingId}`;
    expect(Number(tot.total_amount)).toBeGreaterThan(0);
  });

  it("M-015/M-019 admin cancels a departure: every live booking closed, seats released exactly once, localized notices delivered, override audited", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, departures: 1, capacity: 6 });
    const c1 = await seedUser(sql);
    const c2 = await seedUser(sql);
    const b1 = await bookOnce(t, c1.id, t.departureIds[0], 2);
    const b2 = await bookOnce(t, c2.id, t.departureIds[0], 1);
    const admin = adminActor((await seedUser(sql)).id);
    session.actor = admin;
    const res = await actions.cancelDepartureAction({
      departureId: t.departureIds[0], reasonCode: "weather", reason: "Storm warning for the region",
      notice: { sourceLocale: "fa-IR", texts: { "fa-IR": { title: "لغو تور", body: "به دلیل طوفان لغو شد." }, "en-US": { title: "Tour cancelled", body: "Cancelled because of a storm." } } },
    });
    expect(res).toMatchObject({ ok: true, data: { cancelledBookings: 2, notified: 2 } });
    const d = await dep(t.departureIds[0]);
    expect(d).toMatchObject({ status: "cancelled", booked_count: 0, held_count: 0 });
    const statuses = await sql<any[]>`select status from tour.bookings where booking_id in (${b1.bookingId}, ${b2.bookingId})`;
    expect(statuses.every((s) => s.status === "cancelled")).toBe(true);
    const deliveries = await sql<any[]>`
      select nd.booking_id::text, nd.locale_used from tour.notice_deliveries nd join tour.notices n on n.id = nd.notice_id
       where n.departure_id = ${t.departureIds[0]} and n.kind = 'cancellation'`;
    expect(deliveries.map((x) => x.booking_id).sort()).toEqual([b1.bookingId, b2.bookingId].sort());
    const [ov] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${t.departureIds[0]} and action = 'admin_override'`;
    expect(ov.detail).toMatchObject({ action: "cancel", reason: "Storm warning for the region", reasonCode: "weather" });
    // A second cancel is a conflict, not a second release.
    const again = await actions.cancelDepartureAction({ departureId: t.departureIds[0], reasonCode: "weather", reason: "Again please", notice: { sourceLocale: "fa-IR", texts: { "fa-IR": { title: "x", body: "y" } } } });
    expect(again).toMatchObject({ ok: false, error: { kind: "conflict", code: "already_cancelled" } });
    expect((await dep(t.departureIds[0])).booked_count).toBe(0);
  });

  it("support view masks contact data; reveal needs a reason and is audited", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id });
    const b = await bookOnce(t, (await seedUser(sql)).id);
    const admin = adminActor((await seedUser(sql)).id);
    const view = await support.supportBooking(admin, b.bookingId);
    expect(view.buyer.phone).not.toContain(sampleBuyer.phone.slice(0, 8));
    expect(view.buyer.phone?.endsWith(sampleBuyer.phone.slice(-4))).toBe(true);
    expect(view.buyer.email).toMatch(/^s\*\*\*@/);
    await expect(support.revealBookingContact(admin, { bookingId: b.bookingId, reason: "short" })).rejects.toMatchObject({ code: "reason_required" });
    const full = await support.revealBookingContact(admin, { bookingId: b.bookingId, reason: "Customer called about pickup" });
    expect(full.buyer.phone).toBe(sampleBuyer.phone);
    const [a] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${b.bookingId} and action = 'pii_revealed'`;
    expect(a.detail.reason).toBe("Customer called about pickup");
  });

  it("preview renders drafts in any language with fallback labels before publishing (M-010)", async () => {
    const owner = await seedUser(sql);
    const p = await seedProvider(sql, owner.id);
    const t = await seedTour(sql, { providerId: p.id, status: "draft", translateTo: ["en-US"] });
    const admin = adminActor((await seedUser(sql)).id);
    const fa = await preview.previewTour(admin, { tourId: t.id, locale: "fa-IR", calendar: "persian" });
    expect(fa.detail.text.title?.locale).toBe("fa-IR");
    expect(fa.detail.text.title?.isFallback).toBe(false);
    const ar = await preview.previewTour(admin, { tourId: t.id, locale: "ar-SA", calendar: "islamic-umalqura", currency: "USD" });
    expect(ar.detail.text.title?.isFallback).toBe(true);
    expect(ar.calendar).toBe("islamic-umalqura");
    expect(ar.currency.base).toBe("IRR");
    // The customer view still has nothing for a draft.
    const { getTourDetail } = await import("../platform/catalog");
    expect(await getTourDetail(t.slug, "fa-IR")).toBeNull();
    // Admin approves publication only when requirements are met (fixtures meet them).
    await authoring.submitForReview(admin, t.id);
    await authoring.approveAndPublish(admin, t.id, "ok");
    expect((await getTourDetail(t.slug, "en-US"))?.text.title?.value).toBe("Persepolis day tour");
  });
});
