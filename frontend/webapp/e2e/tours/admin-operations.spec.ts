/**
 * M-013..M-016 / M-019 / M-020 admin operations through the real UI:
 * departures board overrides (capacity, block), cancel with mass notification,
 * booking support view with masked PII + audited reveal, and rebook.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-operations.spec.ts --project desktop
 */
import { expect, test } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, seedBooking, signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// Long cross-page workflows; the first compile of each route on the dev server is slow.
test.describe.configure({ timeout: 300_000 });

test("M-015 cancel a departure with a mass notice: all seats released, every traveler notified in their language, override audited", async ({ context, page }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, departures: 2, capacity: 8 });
  const b1 = await seedBooking(t, p.id, (await seedUser(sql)).id, 2);
  const b2 = await seedBooking(t, p.id, (await seedUser(sql)).id, 1);
  await signInAdmin(context);

  await page.goto(`/en/admin/tours-platform/departures?tour=${t.id}`);
  const card = page.locator(`[data-departure-id="${t.departureIds[0]}"]`);
  await expect(card.locator('[data-k="booked"]')).toHaveText("3");
  // A click that lands before hydration does nothing; retry until the actions panel is open.
  await expect(async () => {
    if (!(await card.getByTestId("departure-actions").isVisible())) await card.getByTestId("manage-departure").click();
    await expect(card.getByTestId("departure-actions")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 120_000 });

  // Capacity override below booked seats is refused with a clear message; a valid one is applied.
  const capacity = async (value: string) => {
    await card.getByTestId("override-capacity").click();
    const group = card.getByRole("group", { name: "Override capacity" });
    await group.locator(`#cap-${t.departureIds[0]}`).fill(value);
    await group.getByRole("textbox").last().fill("Bigger bus available");
    await group.getByRole("button", { name: "Override capacity" }).click();
  };
  await capacity("2");
  await expectToast(page, "Capacity cannot be lower than booked plus held seats.");
  await capacity("10");
  await expect(card.locator('[data-k="capacity"]')).toHaveText("10");

  // Cancel with a bilingual notice.
  await card.getByTestId("cancel-departure").click();
  const group = card.getByRole("group", { name: "Cancel departure" });
  await group.getByLabel("Title (fa-IR)").fill("لغو حرکت");
  await group.getByLabel("Message (fa-IR)").fill("به دلیل هشدار طوفان، این حرکت لغو شد. مبلغ کامل بازگردانده می‌شود.");
  await group.getByLabel("Title (en-US)").fill("Departure cancelled");
  await group.getByLabel("Message (en-US)").fill("Cancelled due to a storm warning. You will get a full refund.");
  await group.getByRole("textbox").last().fill("Storm warning issued by the met office");
  await group.getByRole("button", { name: "Cancel departure" }).click();
  await expectToast(page, "Departure cancelled");

  const [d] = await sql<any[]>`select status, booked_count, held_count from tour.departures where id = ${t.departureIds[0]}`;
  expect(d).toEqual({ status: "cancelled", booked_count: 0, held_count: 0 });
  const bookings = await sql<any[]>`select status from tour.bookings where booking_id in (${b1.bookingId}, ${b2.bookingId})`;
  expect(bookings.map((b) => b.status)).toEqual(["cancelled", "cancelled"]);
  const deliveries = await sql<any[]>`
    select nd.booking_id::text, nd.locale_used, nd.fell_back from tour.notice_deliveries nd join tour.notices n on n.id = nd.notice_id
     where n.departure_id = ${t.departureIds[0]} and n.kind = 'cancellation'`;
  expect(deliveries).toHaveLength(2);
  expect(deliveries.every((x) => x.locale_used === "en-US" && !x.fell_back)).toBe(true); // seeded bookings use en-US
  const [audit] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${t.departureIds[0]} and action = 'admin_override' and detail->>'action' = 'cancel'`;
  expect(audit.detail).toMatchObject({ reason: "Storm warning issued by the met office", cancelledBookings: 2 });
  await page.reload();
  await expect(page.locator(`[data-departure-id="${t.departureIds[0]}"]`)).toHaveAttribute("data-status", "cancelled");
});

test("M-020/M-015 support view masks PII until an audited reveal; rebook moves the booking and its seats", async ({ context, page }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, departures: 3, capacity: 6 });
  const b = await seedBooking(t, p.id, (await seedUser(sql)).id, 2);
  const admin = await signInAdmin(context);

  await page.goto(`/en/admin/tours-platform/bookings?q=${b.voucher}`);
  // The explorer row links to the support view; open it by its URL (direct navigation is part of the requirement).
  const href = await page.getByRole("link", { name: b.voucher }).getAttribute("href");
  expect(href).toContain(`/admin/tours-platform/bookings/${b.bookingId}`);
  await page.goto(href!);
  await expect(page.getByTestId("buyer-phone")).not.toContainText("+989121234567");
  await expect(page.getByTestId("buyer-phone")).toContainText("4567");
  await page.getByTestId("reveal").click();
  await page.getByLabel("Why do you need the full details?").fill("Traveler called about the pickup point");
  await page.getByRole("button", { name: "Reveal contact details" }).click();
  await expectToast(page, "Details revealed");
  await expect(page.getByTestId("buyer-phone")).toContainText("+989121234567");
  const [audit] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${b.bookingId} and action = 'pii_revealed' and actor_user_id = ${admin.id}`;
  expect(audit.detail.reason).toBe("Traveler called about the pickup point");

  await page.getByTestId("load-targets").click();
  await page.locator("#rb-target").selectOption(t.departureIds[1]);
  await page.getByTestId("rebook").click();
  await page.getByRole("group", { name: "Move booking" }).getByRole("textbox").fill("Customer prefers the next day");
  await page.getByRole("group", { name: "Move booking" }).getByRole("button", { name: "Move booking" }).click();
  await expectToast(page, "Booking moved");
  await page.reload();
  await expect(page.getByTestId("booking-departure")).toHaveAttribute("data-departure-id", t.departureIds[1]);
  const counts = await sql<any[]>`select id::text, booked_count from tour.departures where id in (${t.departureIds[0]}, ${t.departureIds[1]}) order by starts_at`;
  expect(counts.map((c) => c.booked_count)).toEqual([0, 2]);
});
