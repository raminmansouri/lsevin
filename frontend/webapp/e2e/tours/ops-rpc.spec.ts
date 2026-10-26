/**
 * Internal tours RPC over real HTTP against the running app (portal ⇄ webapp
 * boundary). Seeds its own users/providers/tours in the e2e database.
 *
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts ops-rpc.spec.ts --project mobile
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import { addMember, seedProvider, seedTour, seedUser, idemKey } from "../../src/features/tours/testing/fixtures";

import { closeDb, db } from "./support/db";
import { E2E_INTERNAL_KEY } from "./support/env";

test.afterAll(closeDb);

const RPC = (method: string) => `/api/internal/tours/v1/rpc/${method}`;

async function call(request: APIRequestContext, method: string, actingUserId: string | null, args: unknown, key = E2E_INTERNAL_KEY) {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID() };
  if (actingUserId) headers["X-Acting-User-Id"] = actingUserId;
  const res = await request.post(RPC(method), { headers, data: { args } });
  return { status: res.status(), body: await res.json() };
}

test("transport rules: key, method, args, acting user, membership", async ({ request }) => {
  const u = await seedUser(db());
  const other = await seedUser(db());
  const p = await seedProvider(db(), other.id);

  expect((await call(request, "me.context", u.id, {}, "wrong-key-wrong-key-wrong-key-wrong-key")).status).toBe(401);
  const noAuth = await request.post(RPC("me.context"), { headers: { "X-Acting-User-Id": u.id }, data: { args: {} } });
  expect(noAuth.status()).toBe(401);
  expect(await call(request, "nope.method", u.id, {})).toMatchObject({ status: 404, body: { ok: false, error: { code: "unknown_method" } } });
  expect(await call(request, "provider.tours", u.id, { serviceProviderId: p.id, injected: true })).toMatchObject({ status: 400, body: { error: { code: "invalid_args" } } });
  expect(await call(request, "me.context", crypto.randomUUID(), {})).toMatchObject({ status: 401, body: { error: { code: "invalid_acting_user" } } });
  expect(await call(request, "provider.tours", u.id, { serviceProviderId: p.id })).toMatchObject({ status: 403, body: { ok: false, error: { kind: "authorization" } } });
  const malformed = await request.post(RPC("me.context"), { headers: { Authorization: `Bearer ${E2E_INTERNAL_KEY}`, "X-Acting-User-Id": u.id, "Content-Type": "application/json" }, data: "{not json" });
  expect(malformed.status()).toBe(400);
  expect((await request.get(RPC("me.context"))).status()).toBe(405);
});

test("portal workflow: create tour → save content → submit (unmet, then met) → visible in provider list", async ({ request }) => {
  const owner = await seedUser(db());
  const p = await seedProvider(db(), owner.id);
  const me = await call(request, "me.context", owner.id, {});
  expect(me.status).toBe(200);
  expect(me.body.data.providers).toEqual([expect.objectContaining({ id: p.id, role: "owner" })]);

  const created = await call(request, "tour.create", owner.id, { serviceProviderId: p.id, slug: `e2e-rpc-${Date.now()}`, sourceLocale: "fa-IR", currency: "IRR", title: "تور E2E" });
  expect(created.status).toBe(200);
  const tourId = created.body.data.id as string;
  expect((await call(request, "content.save", owner.id, { tourId, locale: "fa-IR", fields: { summary: "خلاصه", description: "شرح", meeting_instructions: "میدان", safety_notes: "ایمنی" } })).status).toBe(200);
  const unmet = await call(request, "tour.submit", owner.id, { tourId });
  expect(unmet).toMatchObject({ status: 400, body: { error: { code: "publish_requirements_unmet" } } });

  expect((await call(request, "tour.updateCore", owner.id, { tourId, patch: { meetingLat: 29.6, meetingLng: 52.5, durationMinutes: 300 } })).status).toBe(200);
  expect((await call(request, "media.add", owner.id, { tourId, url: "https://cdn.example.test/e2e.jpg", width: 1600, height: 1000, isCover: true })).status).toBe(200);
  expect((await call(request, "options.save", owner.id, { tourId, locale: "fa-IR", options: [{ code: "standard", kind: "public", tiers: [{ travelerClass: "adult", amount: 1_000_000 }] }] })).status).toBe(200);
  expect((await call(request, "policy.create", owner.id, { tourId, cancellationRules: [{ hoursBefore: 24, refundPercent: 100 }], texts: { "fa-IR": { cancellation: "۲۴ ساعت" } } })).status).toBe(200);
  expect(await call(request, "tour.submit", owner.id, { tourId })).toMatchObject({ status: 200, body: { ok: true } });

  const list = await call(request, "provider.tours", owner.id, { serviceProviderId: p.id });
  expect(list.body.data.find((t: any) => t.id === tourId)).toMatchObject({ status: "submitted", requirementErrors: 0 });
  const [row] = await db()<any[]>`select status from tour.tours where id = ${tourId}`;
  expect(row.status).toBe("submitted");

  const stranger = await seedUser(db());
  expect((await call(request, "tour.get", stranger.id, { tourId })).status).toBe(403);
});

test("day of the tour: check-in once over HTTP, manifest, delay notice", async ({ request }) => {
  const owner = await seedUser(db());
  const p = await seedProvider(db(), owner.id);
  const staff = await seedUser(db());
  await addMember(db(), p.id, staff.id, "staff");
  const t = await seedTour(db(), { providerId: p.id, departures: 1, adultPrice: 0 });
  // A confirmed booking written the way checkout writes it is out of scope here;
  // the RPC is exercised against a booking seeded directly in the e2e database.
  const customer = await seedUser(db());
  const bookingId = crypto.randomUUID();
  const voucher = `TR-E2E${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [d] = await db()<any[]>`select starts_on::text, provider_service_id::text from tour.departures where id = ${t.departureIds[0]}`;
  await db()`insert into booking.bookings (id, provider_id, service_id, selected_date, payment_method, add_ons, upload_files, additional_services, payment_status, booking_status, user_id,
               currency_code, total_amount, paid_amount, booking_ui_mode)
             values (${bookingId}, ${p.id}, ${d.provider_service_id}, ${d.starts_on}, 'free_booking', '[]', '[]', '[]', 'NotRequired', 'Confirmed', ${customer.id}, 'IRR', 0, 0, 'custom_form')`;
  await db()`insert into tour.bookings (booking_id, tour_id, departure_id, user_id, service_provider_id, status, confirmation_mode, seats, travelers, currency_code, total_amount,
               price_snapshot, policy_version_id, policy_snapshot, policy_locale, policy_accepted_at, content_snapshot, ui_locale, display_calendar, buyer, voucher_code, qr_token, idempotency_key)
             values (${bookingId}, ${t.id}, ${t.departureIds[0]}, ${customer.id}, ${p.id}, 'confirmed', 'instant', 1, '{"adult":1}', 'IRR', 0, '{}', ${t.policyVersionId}, '{}', 'fa-IR', now(),
                     '{}', 'en-US', 'gregory', ${db().json({ firstName: "Sara", lastName: "Tester", phone: "+989121234567" })}, ${voucher}, ${idemKey()}, ${idemKey()})`;
  await db()`update tour.departures set booked_count = booked_count + 1 where id = ${t.departureIds[0]}`;
  await db()`insert into tour.booking_participants (booking_id, position, traveler_class, first_name, last_name) values (${bookingId}, 1, 'adult', 'Sara', 'Tester')`;

  const scan = (eventId: string) => call(request, "checkin.scan", staff.id, { departureId: t.departureIds[0], token: voucher, clientEventId: eventId, scannedAt: new Date().toISOString() });
  const ev = `ev-${idemKey()}`;
  expect((await scan(ev)).body.data).toMatchObject({ result: "accepted", bookingId });
  expect((await scan(`ev-${idemKey()}`)).body.data.result).toBe("duplicate");
  expect((await scan(ev)).body.data.result).toBe("accepted"); // replay of the same event

  const manifest = await call(request, "manifest.get", staff.id, { departureId: t.departureIds[0] });
  expect(manifest.status).toBe(200);
  expect(manifest.body.data.summary).toEqual({ expectedSeats: 1, checkedInSeats: 1 });

  const delay = await call(request, "departure.delay", owner.id, { departureId: t.departureIds[0], minutes: 30, notice: { sourceLocale: "en-US", texts: { "en-US": { title: "Delayed", body: "New time {departure}. Ref {ref}" } } } });
  expect(delay).toMatchObject({ status: 200, body: { ok: true, data: { notified: 1, fellBack: 0 } } });
  expect((await call(request, "departure.delay", staff.id, { departureId: t.departureIds[0], minutes: 30, notice: { sourceLocale: "en-US", texts: { "en-US": { title: "x", body: "y" } } } })).status).toBe(403);
  const [n] = await db()<any[]>`select count(*)::int as n from tour.notice_deliveries where booking_id = ${bookingId}`;
  expect(n.n).toBe(1);
});
